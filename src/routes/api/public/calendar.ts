import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { calendarDays } from "@/lib/advent";
import { allowedCalendarOrigin, calendarAccessDecision } from "@/lib/calendar-security";
import type { DoorView } from "@/lib/calendar-api";
import { familyPasswordInput, issueFamilySession, passwordMatches, verifyFamilySession } from "@/lib/family-session";

export const Route = createFileRoute("/api/public/calendar")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => {
        const origin = request.headers.get("origin");
        if (!allowedCalendarOrigin(origin, new URL(request.url).origin, process.env['CALENDAR_PAGES_ORIGIN'])) {
          return new Response(null, { status: 403 });
        }
        return new Response(null, { status: 204, headers: {
          ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Authorization, Content-Type",
          "Vary": "Origin",
        } });
      },
      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        const headers: Record<string, string> = { "Cache-Control": "private, no-store", "Vary": "Origin" };
        if (!allowedCalendarOrigin(origin, new URL(request.url).origin, process.env['CALENDAR_PAGES_ORIGIN'])) {
          return Response.json({ error: "Forbidden" }, { status: 403, headers });
        }
        if (origin) headers['Access-Control-Allow-Origin'] = origin;
        const password = process.env['CALENDAR_FAMILY_PASSWORD'];
        const secret = process.env['CALENDAR_SESSION_SECRET'];
        if (!password || !secret) return Response.json({ error: "Unavailable" }, { status: 503, headers });
        const body = await request.text();
        if (body.length > 2048) return Response.json({ error: "Invalid input" }, { status: 400, headers });
        let input;
        try { input = familyPasswordInput.safeParse(JSON.parse(body)); }
        catch { return Response.json({ error: "Invalid input" }, { status: 400, headers }); }
        if (!input.success) return Response.json({ error: "Invalid input" }, { status: 400, headers });
        if (!await passwordMatches(input.data.password, password)) return Response.json({ error: "Unauthorized" }, { status: 401, headers });
        return Response.json({ token: await issueFamilySession(secret, password) }, { headers });
      },
      GET: async ({ request }) => {
        const origin = request.headers.get("origin");
        const headers: Record<string, string> = { "Cache-Control": "private, no-store", "Vary": "Origin, Authorization" };
        if (!allowedCalendarOrigin(origin, new URL(request.url).origin, process.env['CALENDAR_PAGES_ORIGIN'])) {
          return Response.json({ error: "Forbidden" }, { status: 403, headers });
        }
        if (origin) headers['Access-Control-Allow-Origin'] = origin;
        const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
        if (!token) return Response.json({ error: "Unauthorized" }, { status: 401, headers });
        if (token.startsWith("family.")) {
          const password = process.env['CALENDAR_FAMILY_PASSWORD'];
          const secret = process.env['CALENDAR_SESSION_SECRET'];
          if (!password || !secret || !await verifyFamilySession(token, secret, password)) {
            return Response.json({ error: "Unauthorized" }, { status: 401, headers });
          }
        } else {
        const url = process.env['SUPABASE_URL'];
        const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
        if (!url || !key) return Response.json({ error: "Unavailable" }, { status: 503, headers });
        const client = createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${token}` }, fetch: (input, init) => {
            const h = new Headers(init?.headers);
            if (key.startsWith('sb_') && h.get('Authorization') === `Bearer ${key}`) h.delete('Authorization');
            h.set('apikey', key);
            return fetch(input, { ...init, headers: h });
          } },
        });
        const { data: { user }, error } = await client.auth.getUser(token);
        if (error || !user) return Response.json({ error: "Unauthorized" }, { status: 401, headers });
        const { data: approved, error: accessError } = await client.rpc("has_calendar_access");
        const status = calendarAccessDecision(true, !accessError && approved === true);
        if (status !== 200) return Response.json({ error: "Forbidden" }, { status, headers });
        }
        const days = calendarDays(new Date(), true);
        // Shared sessions authorize read-only calendar access, never owner operations.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const result: DoorView[] = Array.from({ length: 24 }, (_, i) => ({ day: i + 1, unlocked: days.includes(i + 1), imageUrl: null, caption: null, videoUrl: null, extraImageUrls: [], extraCaptions: [] }));
        if (days.length) {
          const { data: rows, error: rowsError } = await supabaseAdmin.from("doors").select("day,image_path,caption,video_path,extra_image_paths,extra_captions").in("day", days);
          if (rowsError) return Response.json({ error: "Unavailable" }, { status: 503, headers });
          await Promise.all((rows ?? []).map(async (row) => {
            const { data } = await supabaseAdmin.storage.from("advent").createSignedUrl(row.image_path, 300);
            const door = result.find((d) => d.day === row.day);
            if (door) { door.imageUrl = data?.signedUrl ?? null; door.caption = row.caption; door.extraCaptions = row.extra_captions ?? []; }
            if (door && row.extra_image_paths?.length) {
              const urls = await Promise.all(row.extra_image_paths.map(async (p: string) => (await supabaseAdmin.storage.from("advent").createSignedUrl(p, 300)).data?.signedUrl ?? null));
              door.extraImageUrls = urls.filter((u): u is string => !!u);
            }
            if (door && row.video_path) {
              const { data: v } = await supabaseAdmin.storage.from("advent").createSignedUrl(row.video_path, 1800);
              door.videoUrl = v?.signedUrl ?? null;
            }
          }));
        }
        return Response.json(result, { headers });
      },
    },
  },
});
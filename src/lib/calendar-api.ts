import { supabase } from "@/integrations/supabase/client";
import { calendarEndpointOrigin, requestCalendar } from "@/lib/calendar-endpoint";

export type DoorView = { day: number; unlocked: boolean; imageUrl: string | null; caption: string | null; videoUrl?: string | null; extraImageUrls?: string[] };

const FAMILY_SESSION_KEY = "calendar-family-session";
export function getFamilySession() { return sessionStorage.getItem(FAMILY_SESSION_KEY); }
export function clearFamilySession() { sessionStorage.removeItem(FAMILY_SESSION_KEY); }

export async function signInFamily(password: string) {
  const origin = calendarEndpointOrigin(import.meta.env.DEV, import.meta.env['VITE_CALENDAR_API_ORIGIN']);
  const response = await requestCalendar(`${origin}/api/public/calendar`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }), cache: "no-store",
  });
  if (response.status === 401) throw new Error("Feil passord. Prøv igjen.");
  if (!response.ok) throw new Error("Kunne ikke logge inn. Prøv igjen senere.");
  const data = await response.json();
  if (typeof data.token !== "string") throw new Error("Kunne ikke logge inn.");
  sessionStorage.setItem(FAMILY_SESSION_KEY, data.token);
}

export async function fetchCalendar(): Promise<DoorView[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = getFamilySession() || session?.access_token;
  if (!token) throw new Error("Logg inn for å åpne kalenderen.");
  const origin = calendarEndpointOrigin(import.meta.env.DEV, import.meta.env['VITE_CALENDAR_API_ORIGIN']);
  const response = await requestCalendar(`${origin}/api/public/calendar`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (response.status === 403) throw new Error("Du er ikke på familiens tilgangsliste ennå.");
  if (response.status === 401) throw new Error("Logg inn på nytt.");
  if (!response.ok) throw new Error("Kalenderen kunne ikke lastes. Prøv igjen senere.");
  return response.json();
}
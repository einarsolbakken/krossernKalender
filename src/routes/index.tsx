import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { clearFamilySession, fetchCalendar, getFamilySession, type DoorView } from "@/lib/calendar-api";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { calendarHeadline, doorCaptions } from "@/lib/advent";
import { FamilyAccess } from "@/components/family-access";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

// Shuffled, but fixed, so the calendar always looks the same.
const ORDER = [7, 18, 2, 23, 11, 5, 15, 20, 1, 9, 24, 13, 4, 17, 21, 8, 12, 3, 19, 14, 22, 6, 16, 10];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Krossern's bildekalender 2026" },
      { name: "description", content: "Åpne dagens pakke – en ny hyggelig overraskelse hver dag frem til jul." },
      { property: "og:title", content: "Krossern's bildekalender 2026" },
      { property: "og:description", content: "Åpne dagens pakke – en ny overraskelse hver dag frem til jul." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Calendar,
});

function Snow() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {Array.from({ length: 30 }, (_, i) => (
        <span
          key={i}
          className="animate-snow absolute block rounded-full bg-paper opacity-60"
          style={{ left: `${(i * 37) % 100}%`, width: 3 + (i % 4), height: 3 + (i % 4), animationDuration: `${8 + (i % 7) * 2}s`, animationDelay: `-${i * 1.3}s` }}
        />
      ))}
    </div>
  );
}

function Calendar() {
  const [userId, setUserId] = useState<string | null>(null);
  const [familySignedIn, setFamilySignedIn] = useState(false);
  const [ready, setReady] = useState(false);
  const signedIn = familySignedIn || !!userId;
  const query = useQuery({ queryKey: ["doors", userId, familySignedIn], queryFn: fetchCalendar, enabled: ready && signedIn, retry: false, staleTime: 30_000, refetchInterval: 120_000 });
  const data = query.data ?? [];
  const [opened, setOpened] = useState<number[]>([]);
  const [active, setActive] = useState<DoorView | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [lockedFlash, setLockedFlash] = useState<{ day: number; n: number } | null>(null);

  useEffect(() => {
    if (!lockedFlash) return;
    const timer = setTimeout(() => setLockedFlash(null), 1600);
    return () => clearTimeout(timer);
  }, [lockedFlash]);

  useEffect(() => {
    try { setOpened(JSON.parse(localStorage.getItem("opened-doors") ?? "[]")); } catch { setOpened([]); }
    setFamilySignedIn(!!getFamilySession());
    void supabase.auth.getSession().then(({ data: { session } }) => { setUserId(session?.user.id ?? null); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setUserId(session?.user.id ?? null); setActive(null);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const open = (door: DoorView) => {
    if (!door.unlocked) {
      setLockedFlash((prev) => ({ day: door.day, n: (prev?.n ?? 0) + 1 }));
      return;
    }
    const next = Array.from(new Set([...opened, door.day]));
    setOpened(next);
    localStorage.setItem("opened-doors", JSON.stringify(next));
    setActiveIdx(0);
    setActive(door);
  };

  const byDay = new Map(data.map((d) => [d.day, d]));
  const openDays = data.filter((d) => d.unlocked).map((d) => d.day);
  const today = Math.max(0, ...openDays);
  const headline = calendarHeadline(openDays, opened);
  const activeCaptions = active ? doorCaptions(active) : [];

  return (
    <main className="relative mx-auto max-w-5xl px-4 py-12">
      <Snow />
      <header className="relative mb-10 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-ribbon">Desember</p>
        <h1 className="mt-2 text-4xl font-bold sm:text-6xl">Krossern's bildekalender 2026</h1>
        {signedIn && <p className="mt-3 text-muted-foreground">{headline}</p>}
      </header>

      {!ready ? <p className="text-center">Laster…</p> : !signedIn ? <FamilyAccess onSignedIn={() => setFamilySignedIn(true)} /> : query.isPending ? <p className="animate-in fade-in duration-500 text-center">Laster kalenderen…</p> : query.error ? <div className="text-center"><p role="alert">{query.error.message}</p><Button className="mt-4" variant="secondary" onClick={() => query.refetch()}>Prøv igjen</Button></div> : <ol className="animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-700 ease-out relative grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-5 md:grid-cols-6">
        {ORDER.map((day, i) => {
          const door = byDay.get(day);
          if (!door) return null;
          const isOpen = opened.includes(day) && door.unlocked;
          const isToday = day === today && !isOpen;
          return (
            <li key={day}>
              <Button variant="ghost"
                onClick={() => open(door)}
                aria-disabled={!door.unlocked}
                aria-label={door.unlocked ? `Åpne luke ${day}` : `Luke ${day} er låst`}
                className={`group relative flex aspect-square h-auto w-full items-center justify-center overflow-hidden rounded-lg p-0 transition-[transform,opacity] duration-200 ${
                  isOpen
                    ? "bg-paper"
                    : `gift ${i % 2 ? "bg-gift-a hover:bg-gift-a!" : "bg-gift-b hover:bg-gift-b!"} ${door.unlocked ? "hover:-translate-y-1" : "opacity-70 hover:opacity-100"}`
                } ${isToday ? "animate-wiggle shadow-[var(--glow-gold)]" : ""}`}
              >
                {isOpen && door.imageUrl ? (
                  <img src={door.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : null}
                {!door.unlocked ? (
                  <span
                    aria-hidden="true"
                    className={`absolute right-1.5 top-1.5 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-paper/25 bg-background/85 text-paper shadow-[var(--shadow-gift)] transition-opacity duration-200 ${
                      lockedFlash?.day === day
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                    }`}
                  >
                    <Lock className="h-3.5 w-3.5" />
                  </span>
                ) : null}
                <span
                  className={`relative z-10 font-display text-2xl font-bold sm:text-3xl ${
                    isOpen ? "rounded-md bg-paper/85 px-2 text-paper-foreground" : "rounded-full bg-background/70 px-3 py-1 text-ribbon"
                  }`}
                >
                  {day}
                </span>
              </Button>
            </li>
          );
        })}
      </ol>}

      {signedIn && <nav className="mt-8 flex justify-center"><Button variant="ghost" onClick={() => { clearFamilySession(); setFamilySignedIn(false); setUserId(null); setActive(null); void supabase.auth.signOut(); }}>Logg ut</Button></nav>}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-lg bg-paper text-paper-foreground">
          <DialogTitle className="font-display text-3xl">Luke {active?.day}</DialogTitle>
          {active?.imageUrl ? (
            <DoorMedia key={active.day} door={active} idx={activeIdx} onIdx={setActiveIdx} />
          ) : (
            <p className="py-8 text-center">Denne pakken er ikke fylt ennå – kom tilbake litt senere! 🎁</p>
          )}
          <DialogDescription className="text-center text-base text-paper-foreground">{activeCaptions[activeIdx] ?? ""}</DialogDescription>
        </DialogContent>
      </Dialog>
    </main>
  );
}

// Special doors show the photo first, tease the film, then fade into it.
const TEASER_MS = 4500;
const FILM_MS = 7000;

function DoorMedia({ door, idx, onIdx }: { door: DoorView; idx: number; onIdx: (i: number) => void }) {
  const [teaser, setTeaser] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const images = [door.imageUrl ?? "", ...(door.extraImageUrls ?? [])];
  const captions = doorCaptions(door);
  useEffect(() => {
    if (!door.videoUrl) return;
    const tease = setTimeout(() => setTeaser(true), TEASER_MS);
    const film = setTimeout(() => setShowVideo(true), FILM_MS);
    return () => { clearTimeout(tease); clearTimeout(film); };
  }, [door.videoUrl]);
  return (
    <div className="relative">
      <img src={images[idx] ?? ""} alt={captions[idx] ?? `Bilde for luke ${door.day}`} className={`w-full rounded-md transition-opacity duration-700 ${showVideo ? "opacity-0" : "opacity-100"}`} />
      {images.length > 1 ? (
        <>
          <button type="button" aria-label="Forrige bilde" onClick={() => onIdx((idx - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground shadow"><ChevronLeft className="h-5 w-5" /></button>
          <button type="button" aria-label="Neste bilde" onClick={() => onIdx((idx + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground shadow"><ChevronRight className="h-5 w-5" /></button>
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-2 text-sm text-foreground">{idx + 1} / {images.length}</span>
        </>
      ) : null}
      {teaser && !showVideo ? (
        <div className="animate-in fade-in zoom-in-75 duration-500 pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-accent px-5 py-2 font-display text-2xl text-accent-foreground shadow-[var(--glow-gold)]">
            Spesialluke 🎬
          </span>
        </div>
      ) : null}
      {showVideo && door.videoUrl ? (
        <video src={door.videoUrl} autoPlay playsInline controls className="animate-in fade-in duration-700 absolute inset-0 h-full w-full rounded-md bg-background object-contain" />
      ) : null}
    </div>
  );
}

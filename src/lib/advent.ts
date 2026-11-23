// Pure date logic for the calendar. Doors unlock at midnight Norwegian time.
export function osloDateParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Oslo", year: "numeric", month: "numeric", day: "numeric",
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

export function isDoorOpenable(door: number, now: Date = new Date()) {
  const { month, day } = osloDateParts(now);
  return month === 12 && day >= door;
}

export function unlockedDays(now: Date = new Date()) {
  return Array.from({ length: 24 }, (_, i) => i + 1).filter((d) => isDoorOpenable(d, now));
}

// Only the development preview bypasses the date lock; production stays locked.
export function calendarDays(now: Date, developmentPreview: boolean) {
  return developmentPreview
    ? Array.from({ length: 24 }, (_, i) => i + 1)
    : unlockedDays(now);
}

// Which headline the calendar shows above the doors.
export function calendarHeadline(openDays: number[], openedDays: number[]) {
  const today = openDays.length ? Math.max(...openDays) : 0;
  if (!today) return "Første pakke kan åpnes 1. desember.";
  return openedDays.includes(today)
    ? "Dagens luke er åpnet"
    : "Dagens luke er klar til å åpnes - trykk på pakken";
}

// Every image in a door carries its own text: the door caption first, then one per extra image.
export function doorCaptions(door: { caption: string | null; extraCaptions?: string[] }) {
  return [door.caption ?? "", ...(door.extraCaptions ?? [])];
}

// While the film plays its own text shows; otherwise the text of the image on screen shows.
export function activeDoorCaption(
  door: { caption: string | null; extraCaptions?: string[]; videoCaption?: string | null },
  idx: number,
  videoPlaying: boolean,
) {
  if (videoPlaying && door.videoCaption) return door.videoCaption;
  return doorCaptions(door)[idx] ?? "";
}

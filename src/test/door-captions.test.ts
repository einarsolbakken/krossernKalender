import { describe, it, expect } from "vitest";
import { activeDoorCaption, doorCaptions } from "@/lib/advent";

describe("per-image door texts", () => {
  it("shows the door caption for the first image", () => {
    expect(doorCaptions({ caption: "Første bilde", extraCaptions: ["Andre bilde"] })[0]).toBe("Første bilde");
  });
  it("shows the extra text for the second image", () => {
    expect(doorCaptions({ caption: "Første bilde", extraCaptions: ["Selfie med Vernazza i bakgrunnen🇮🇹"] })[1]).toBe("Selfie med Vernazza i bakgrunnen🇮🇹");
  });
  it("has no text for a third image when none was written", () => {
    expect(doorCaptions({ caption: "Første bilde", extraCaptions: ["Andre bilde"] })[2]).toBeUndefined();
  });
  it("keeps a single-image door on its own caption", () => {
    expect(doorCaptions({ caption: "Bare ett bilde" })).toEqual(["Bare ett bilde"]);
  });
});

describe("film text in a door", () => {
  const door = { caption: "Hele gjengen på skitur påsken 2026 🐣💛", videoCaption: "Rævkrok i Krossern" };
  it("shows the film text while the film plays", () => {
    expect(activeDoorCaption(door, 0, true)).toBe("Rævkrok i Krossern");
  });
  it("shows the photo text before the film starts", () => {
    expect(activeDoorCaption(door, 0, false)).toBe("Hele gjengen på skitur påsken 2026 🐣💛");
  });
  it("keeps the photo text when the door has no film text", () => {
    expect(activeDoorCaption({ caption: "Uten filmtekst" }, 0, true)).toBe("Uten filmtekst");
  });
  it("shows the text of the image on screen in a two-image door", () => {
    expect(activeDoorCaption({ caption: "Bilde 1", extraCaptions: ["Bilde 2"] }, 1, false)).toBe("Bilde 2");
  });
});

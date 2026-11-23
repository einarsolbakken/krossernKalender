import { describe, it, expect } from "vitest";
import { doorCaptions } from "@/lib/advent";

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

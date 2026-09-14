import { describe, it, expect } from "vitest";
import { cn } from "../lib/utils.js";
import { t } from "../translations/index.js";

describe("cn utility", () => {
  it("merges tailwind classes correctly", () => {
    const result = cn("px-4 py-2", "px-6");
    expect(result).toBe("px-6 py-2");
  });

  it("handles conditional classes", () => {
    const result = cn("base", false && "hidden", "visible");
    expect(result).toBe("base visible");
  });
});

describe("translations", () => {
  it("returns English translation for valid key", () => {
    expect(t("en", "common.save")).toBe("Save");
    expect(t("en", "intake.title")).toBe("Tell us what happened");
  });

  it("returns Hindi translation for valid key", () => {
    expect(t("hi", "common.save")).toBe("सहेजें");
  });

  it("returns Hinglish translation for valid key", () => {
    expect(t("hinglish", "common.save")).toBe("Save karo");
  });

  it("returns key path for missing translation", () => {
    expect(t("en", "missing.key")).toBe("missing.key");
  });
});


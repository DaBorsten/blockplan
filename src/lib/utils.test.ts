import { describe, test, expect } from "bun:test";
import { cn } from "./utils";

describe("cn (classNames utility)", () => {
  test("sollte einzelne Klasse zurückgeben", () => {
    expect(cn("foo")).toBe("foo");
  });

  test("sollte mehrere Klassen zusammenführen", () => {
    const result = cn("foo", "bar");
    expect(result).toContain("foo");
    expect(result).toContain("bar");
  });

  test("sollte bedingte Klassen handhaben", () => {
    const isActive = true;
    const result = cn("base", isActive && "active");
    expect(result).toContain("base");
    expect(result).toContain("active");
  });

  test("sollte false Werte ignorieren", () => {
    const result = cn("foo", false && "bar", "baz");
    expect(result).toContain("foo");
    expect(result).not.toContain("bar");
    expect(result).toContain("baz");
  });

  test("sollte null und undefined ignorieren", () => {
    const result = cn("foo", null, undefined, "bar");
    expect(result).toContain("foo");
    expect(result).toContain("bar");
  });

  test("sollte Objekte mit bedingten Klassen handhaben", () => {
    const result = cn({
      foo: true,
      bar: false,
      baz: true,
    });
    expect(result).toContain("foo");
    expect(result).not.toContain("bar");
    expect(result).toContain("baz");
  });

  test("sollte Arrays von Klassen verarbeiten", () => {
    const result = cn(["foo", "bar"], "baz");
    expect(result).toContain("foo");
    expect(result).toContain("bar");
    expect(result).toContain("baz");
  });

  test("sollte Tailwind-Klassen korrekt mergen (twMerge)", () => {
    // twMerge sollte widersprüchliche Tailwind-Klassen auflösen
    const result = cn("px-4 py-2", "px-8");
    expect(result).toContain("px-8");
    expect(result).not.toContain("px-4");
    expect(result).toContain("py-2");
  });

  test("sollte leere Strings ignorieren", () => {
    const result = cn("foo", "", "bar", "  ");
    // Whitespace-only Strings werden gefiltert, Ergebnis ist "foo bar"
    expect(result).toBe("foo bar");
  });

  test("sollte komplexe Kombinationen handhaben", () => {
    const isActive = true;
    const size = "large" as "large" | "small";
    const result = cn(
      "base-class",
      isActive && "is-active",
      {
        "is-large": size === "large",
        "is-small": size === "small",
      },
      ["extra", "classes"],
    );
    expect(result).toContain("base-class");
    expect(result).toContain("is-active");
    expect(result).toContain("is-large");
    expect(result).not.toContain("is-small");
    expect(result).toContain("extra");
    expect(result).toContain("classes");
  });
});

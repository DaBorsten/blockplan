import { describe, test, expect } from "bun:test";
import { isColorDark } from "./colorDark";

describe("isColorDark", () => {
  test("sollte dunkle Farben korrekt erkennen", () => {
    expect(isColorDark("#000000")).toBe(true); // Schwarz
    expect(isColorDark("#1a1a1a")).toBe(true); // Sehr dunkelgrau
    expect(isColorDark("#0000ff")).toBe(true); // Blau (Luminanz < 0.5)
    expect(isColorDark("#8b0000")).toBe(true); // Dunkelrot
    expect(isColorDark("#006400")).toBe(true); // Dunkelgrün
  });

  test("sollte helle Farben korrekt erkennen", () => {
    expect(isColorDark("#ffffff")).toBe(false); // Weiß
    expect(isColorDark("#ffff00")).toBe(false); // Gelb
    expect(isColorDark("#00ffff")).toBe(false); // Cyan
    expect(isColorDark("#ff69b4")).toBe(false); // Pink
    expect(isColorDark("#90ee90")).toBe(false); // Hellgrün
  });

  test("sollte Grenzfälle behandeln", () => {
    // #808080 hat Luminanz genau 0.5 (128/255 * 0.2126 + 128/255 * 0.7152 + 128/255 * 0.0722 = 0.5)
    // Sollte als hell erkannt werden (luminance < 0.5 ist false)
    expect(isColorDark("#808080")).toBe(false);
    
    // #7f7f7f hat Luminanz knapp unter 0.5 (127/255 ≈ 0.498)
    // Sollte als dunkel erkannt werden (luminance < 0.5 ist true)
    expect(isColorDark("#7f7f7f")).toBe(true);
  });

  test("sollte Farben ohne # Zeichen verarbeiten", () => {
    expect(isColorDark("000000")).toBe(true);
    expect(isColorDark("ffffff")).toBe(false);
  });

  test("sollte ungültige Eingaben behandeln", () => {
    expect(isColorDark(undefined as unknown as string)).toBe(false);
    expect(isColorDark(null as unknown as string)).toBe(false);
  });
});

import { describe, test, expect } from "bun:test";
import { withGray700Over40 } from "./withGray700Over40";

describe("withGray700Over40", () => {
  test("sollte rote Hintergrundfarbe korrekt mischen", () => {
    // ff0000 (rot) mit gray-700/40 sollte af1a21 ergeben
    const result = withGray700Over40("#ff0000");
    expect(result).toBe("#af1a21");
  });

  test("sollte weiße Hintergrundfarbe korrekt mischen", () => {
    // #ffffff mit gray-700 (55, 65, 81) bei Alpha 0.4:
    // r = 0.4 * 55 + 0.6 * 255 = 175
    // g = 0.4 * 65 + 0.6 * 255 = 179
    // b = 0.4 * 81 + 0.6 * 255 = 185.4 -> ceil(185.4) = 186
    const result = withGray700Over40("#ffffff");
    expect(result).toBe("#afb3ba");
  });

  test("sollte schwarze Hintergrundfarbe korrekt mischen", () => {
    // #000000 mit gray-700 bei Alpha 0.4:
    // r = 0.4 * 55 = 22
    // g = 0.4 * 65 = 26
    // b = 0.4 * 81 = 32.4 -> ceil(32.4) = 33
    const result = withGray700Over40("#000000");
    expect(result).toBe("#161a21");
  });

  test("sollte Farben ohne # verarbeiten", () => {
    const result = withGray700Over40("ff0000");
    expect(result).toBe("#af1a21");
  });

  test("sollte 3-stellige Hex-Farben verarbeiten", () => {
    // #f00 wird zu #ff0000 erweitert
    const result = withGray700Over40("#f00");
    expect(result).toBe("#af1a21");
  });

  test("sollte null bei ungültigen Eingaben zurückgeben", () => {
    expect(withGray700Over40("")).toBe(null);
    expect(withGray700Over40("invalid")).toBe(null);
    expect(withGray700Over40("#12")).toBe(null);
    expect(withGray700Over40("#1234567")).toBe(null);
  });

  test("sollte null bei null und undefined zurückgeben", () => {
    expect(withGray700Over40(null as unknown as string)).toBe(null);
    expect(withGray700Over40(undefined as unknown as string)).toBe(null);
  });

  test("sollte Hex-Farben mit Großschreibung korrekt verarbeiten", () => {
    // Großgeschriebene Hex-Codes sollten genauso funktionieren wie kleingeschriebene
    expect(withGray700Over40("#FF0000")).toBe("#af1a21");
    expect(withGray700Over40("#FFFFFF")).toBe("#afb3ba");
    expect(withGray700Over40("#00FF00")).toBe("#16b321");
    expect(withGray700Over40("FF0000")).toBe("#af1a21");
  });

  test("sollte gemischte Groß-/Kleinschreibung in Hex-Codes verarbeiten", () => {
    expect(withGray700Over40("#Ff0000")).toBe("#af1a21");
    expect(withGray700Over40("#fF0000")).toBe("#af1a21");
    expect(withGray700Over40("#FfFfFf")).toBe("#afb3ba");
  });

  test("sollte Leerzeichen korrekt handhaben", () => {
    const result = withGray700Over40("  #ff0000  ");
    expect(result).toBe("#af1a21");
  });

  test("sollte blaue Farben korrekt mischen", () => {
    // #0000ff mit gray-700 bei Alpha 0.4
    // b = 0.4 * 81 + 0.6 * 255 = 185.4 -> ceil(185.4) = 186 = 0xba
    const result = withGray700Over40("#0000ff");
    expect(result).toBe("#161aba");
  });

  test("sollte grüne Farben korrekt mischen", () => {
    // #00ff00 mit gray-700 bei Alpha 0.4
    // g = 0.4 * 65 + 0.6 * 255 = 179 = 0xb3
    // b = 0.4 * 81 + 0.6 * 0 = 32.4 -> ceil(32.4) = 33 = 0x21
    const result = withGray700Over40("#00ff00");
    expect(result).toBe("#16b321");
  });
});

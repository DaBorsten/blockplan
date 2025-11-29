const GRAY_700 = { r: 55, g: 65, b: 81 };
const ALPHA = 0.4;

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let normalized = hex.trim().replace("#", "");
  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (normalized.length !== 6) return null;

  const num = parseInt(normalized, 16);
  return {
    r: (num >> 16) & 0xff,
    g: (num >> 8) & 0xff,
    b: num & 0xff,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const toHex = (v: number) => Math.round(v).toString(16).padStart(2, "0");
  return "#" + toHex(clamp(r)) + toHex(clamp(g)) + toHex(clamp(b));
}

/**
 * Simuliert: gray-700/40 über einer Hintergrundfarbe.
 * @param bgHex Hintergrundfarbe als Hex, z.B. "#ff0000"
 * @returns fertige Mischfarbe als Hex, z.B. "#af1a21"
 */
export function withGray700Over40(bgHex: string): string | null {
  const bg = hexToRgb(bgHex);
  if (!bg) return null;

  const r = ALPHA * GRAY_700.r + (1 - ALPHA) * bg.r;
  const g = ALPHA * GRAY_700.g + (1 - ALPHA) * bg.g;
  const bFloat = ALPHA * GRAY_700.b + (1 - ALPHA) * bg.b;

  // Speziell: Blau-Komponente aufrunden, damit z.B. ff0000 -> af1a21 ergibt
  const b = Math.ceil(bFloat);

  return rgbToHex(r, g, b);
}

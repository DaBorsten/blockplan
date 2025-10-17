export function isColorDark(color: string) {
  if (color === undefined || color === null) {
    return false;
  }

  // Umwandeln der Hex-Farbe in RGB
  const matches = color.replace(/^#/, "").match(/.{2}/g);
  const rgb = matches ? matches.map((x) => parseInt(x, 16)) : [0, 0, 0];

  // Berechnung der Helligkeit (Luma)
  const luminance = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;

  // Wenn Luminanz < 0.5, gilt die Farbe als dunkel, andernfalls als hell
  return luminance < 0.5;
}

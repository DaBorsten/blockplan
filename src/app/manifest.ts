import { ROUTE_STUNDENPLAN } from "@/constants/routes";
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BS1 Blockplan",
    short_name: "BS1 Blockplan",
    description:
      "Organisiere Unterricht, erfasse Notizen pro Stunde und arbeite in Klassen zusammen.",
    start_url: ROUTE_STUNDENPLAN,
    display: "standalone",
    background_color: "#000",
    theme_color: "#000",
    orientation: "portrait",
    lang: "de",
    display_override: ["window-controls-overlay"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "32x32",
        type: "image/x-icon",
      },
      {
        src: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        src: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/favicon-48x48.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-touch-icon-152x152.png",
        sizes: "152x152",
        type: "image/png",
      },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    screenshots: [
      {
        src: "/Mobile_01.png",
        sizes: "1080x2307",
        type: "image/png",
        form_factor: "narrow",
        label: "Stundenplanansicht",
      },
      {
        src: "/Mobile_02.png",
        sizes: "1080x2307",
        type: "image/png",
        form_factor: "narrow",
        label: "Stundenplanansicht",
      },
      {
        src: "/Mobile_03.png",
        sizes: "1080x2307",
        type: "image/png",
        form_factor: "narrow",
        label: "Stundenplanansicht",
      },
      {
        src: "/Mobile_04.png",
        sizes: "1080x2307",
        type: "image/png",
        form_factor: "narrow",
        label: "Import von Stundenplänen",
      },
      {
        src: "/Desktop_01.png",
        sizes: "2560x1238",
        type: "image/png",
        form_factor: "wide",
        label: "Stundenplanansicht",
      },
    ],
  };
}

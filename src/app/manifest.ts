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
        sizes: "256x256",
        type: "image/x-icon",
      },
      {
        src: "/icon.png",
        sizes: "200x200",
        type: "image/png",
      },
    ],
  };
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RinsePoint Carwash",
    short_name: "RinsePoint",
    description: "Public customer check-in for RinsePoint Carwash.",
    start_url: "/check-in",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f4f8f7",
    theme_color: "#0d9f91",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}

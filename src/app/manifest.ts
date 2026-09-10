import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cool Car Centrale",
    short_name: "Cool Car",
    description: "Public customer check-in for Cool Car Centrale.",
    start_url: "/check-in",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f7f6f1",
    theme_color: "#f4c400",
    icons: [
      {
        src: "/img/logo.jpg",
        sizes: "2000x1000",
        type: "image/jpeg",
      },
    ],
  };
}

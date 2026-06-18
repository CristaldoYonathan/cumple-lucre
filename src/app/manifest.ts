import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "¿Cuánto conocés a Lucre?",
    short_name: "Quiz Lucre",
    description: "Quiz de cumpleaños para Lucrecia",
    start_url: "/",
    display: "standalone",
    background_color: "#fff5f8",
    theme_color: "#ff4d6d",
    lang: "es",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}

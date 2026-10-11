import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zerem (זרם)",
    short_name: "Zerem",
    description:
      "המעקב הקהילתי בזמן אמת אחרי עומסים בקופות ומצב חניה בסופרמרקטים בישראל.",
    lang: "he",
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f8fb",
    theme_color: "#059669",
    categories: ["shopping", "navigation", "utilities"],
    icons: [
      {
        src: "/icons/icon-512.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "any",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

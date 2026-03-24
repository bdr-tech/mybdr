import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MyBDR - Basketball Daily Routine",
    short_name: "MyBDR",
    description: "농구 경기와 대회를 쉽고 빠르게",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F7FA",
    theme_color: "#1B3C87",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcuts: [
      { name: "경기 일정", url: "/games",       icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }] },
      { name: "토너먼트",  url: "/tournaments", icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }] },
    ],
  };
}

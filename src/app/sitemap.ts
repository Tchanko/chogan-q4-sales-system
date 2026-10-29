import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

const LAST_UPDATE = "2026-10-23";

export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${site.url}${path}`,
    lastModified: LAST_UPDATE,
    changeFrequency: "weekly",
    priority,
  });
  return [
    page("/", 1),
    page("/formation", 0.9),
    page("/inscription", 0.7),
    page("/conditions-de-vente", 0.3),
    page("/confidentialite", 0.3),
    page("/mentions-legales", 0.3),
  ];
}

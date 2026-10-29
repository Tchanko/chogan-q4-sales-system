import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Tant que NEXT_PUBLIC_ALLOW_INDEXING n'est pas « true », rien n'est indexé.
  if (!site.allowIndexing) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/confirmation", "/desinscription"],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}

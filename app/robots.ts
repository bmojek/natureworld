import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nature-world.pl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/adminpanel", "/sklep/profil", "/sklep/koszyk", "/sklep/checkout", "/login", "/register"],
    }],
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    host: new URL(siteUrl).host,
  };
}

import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nature-world.pl";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/sklep",
    "/sklep/dzial/zwierzeta",
    "/sklep/dzial/ogrod",
    "/sklep/dzial/dom",
    "/aktualnosci",
    "/sklep/artykuly",
    "/regulamin",
    "/polityka-prywatnosci",
    "/dostawa-i-zwroty",
    "/formularz-odstapienia",
  ];

  return paths.map((path) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency: path === "/" || path === "/sklep" ? "daily" : "monthly",
    priority: path === "/" ? 1 : path === "/sklep" ? 0.9 : 0.6,
  }));
}

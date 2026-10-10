import Link from "next/link";
import { headers } from "next/headers";
import { House } from "lucide-react";
import { buildCategoryTree, CategoryTree } from "@/app/lib/categories";
import { categoryHasMenuProducts } from "@/app/lib/storefront-categories";
import { findCategoryBySlugPath } from "@/app/lib/category-utils";
import ProductsInfinite from "./products-infinite";
import { CategoryModel } from "@/app/models/category";

type PageProps = { params: Promise<{ slug: string[] }> };

async function fetchCategories(): Promise<CategoryModel[]> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  if (!host) return [];
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  try {
    const response = await fetch(`${protocol}://${host}/api/categories`, { next: { revalidate: 60 } });
    return response.ok ? response.json() : [];
  } catch { return []; }
}

function flattenOptions(nodes: CategoryTree[], prefix = ""): { id: string; name: string }[] {
  return nodes.filter(categoryHasMenuProducts).flatMap((node) => [
    ...(/^\d+$/.test(node.id) ? [{ id: node.id, name: `${prefix}${node.name}` }] : []),
    ...flattenOptions(node.children, `${prefix}${node.name} / `),
  ]);
}

function categoryTiles(category: CategoryTree, slugPath: string[]) {
  return category.children.filter(categoryHasMenuProducts).map((child) => ({
    id: child.id,
    name: child.name,
    href: `/sklep/kategoria/${[...slugPath, child.slug].join("/")}`,
  }));
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const categories = await fetchCategories();
  const tree = buildCategoryTree(categories);
  const category = findCategoryBySlugPath(tree, slug);
  if (!category) return <main className="mx-auto min-h-[50vh] max-w-7xl px-4 py-16"><h1 className="text-2xl font-semibold">{categories.length ? "Nie znaleziono kategorii" : "Katalog chwilowo niedostępny"}</h1><p className="mt-2 text-text-secondary">{categories.length ? "Ta kategoria nie znajduje się w aktualnym katalogu." : "Nie udało się pobrać kategorii z Base.com. Spróbuj ponownie za chwilę."}</p></main>;

  const tiles = categoryTiles(category, slug);
  const options = flattenOptions(category.children);
  return <main className="mx-auto min-h-screen max-w-7xl px-4 py-7 md:px-6 md:py-10">
    <nav aria-label="Okruszki" className="mb-5 flex flex-wrap items-center gap-2 text-sm text-text-secondary"><Link href="/sklep" aria-label="Strona sklepu" className="rounded p-1 hover:text-primary"><House size={16} /></Link>{slug.map((part, index) => <span key={`${part}-${index}`} className="flex items-center gap-2"><span aria-hidden="true">/</span><Link href={`/sklep/kategoria/${slug.slice(0, index + 1).join("/")}`} className="hover:text-primary">{index === slug.length - 1 ? category.name : part.replaceAll("-", " ")}</Link></span>)}</nav>
    <header className="relative isolate overflow-hidden rounded-3xl bg-[#173d2b] px-6 py-8 text-white shadow-sm md:px-10 md:py-10">
      <div aria-hidden="true" className="absolute -right-12 -top-20 -z-10 h-72 w-72 rounded-full bg-lime-300/10 blur-3xl" />
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime-200">Katalog Nature-World</p>
      <h1 style={{ color: "#ffffff" }} className="mt-2 text-3xl font-semibold tracking-tight !text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] md:text-4xl">{category.name}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90">Przeglądaj produkty przypisane do tej kategorii i jej podkategorii.</p>
    </header>
    {tiles.length > 0 && <section aria-labelledby="category-subcategories" className="py-8 md:py-9"><div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Odkryj więcej</p><h2 id="category-subcategories" className="mt-1 text-xl font-semibold md:text-2xl">Podkategorie</h2></div></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{tiles.map((tile) => <Link key={tile.id} href={tile.href} className="group flex min-h-20 items-center justify-between rounded-2xl bg-[#f3f6ef] p-4 transition-colors hover:bg-[#e8efe1] focus-visible:outline-2 focus-visible:outline-primary md:p-5"><span className="font-medium leading-snug group-hover:text-primary">{tile.name}</span><span aria-hidden="true" className="ml-3 text-xl text-primary transition-transform group-hover:translate-x-1">→</span></Link>)}</div></section>}
    <section aria-label={`Produkty — ${category.name}`} className="border-t border-black/5 pt-7"><ProductsInfinite categoryPath={slug} categoryOptions={options} /></section>
  </main>;
}

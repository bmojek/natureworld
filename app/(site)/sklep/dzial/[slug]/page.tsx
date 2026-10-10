import Link from "next/link";
import { headers } from "next/headers";
import { Boxes, House } from "lucide-react";
import { buildCategoryTree, CategoryTree } from "@/app/lib/categories";
import { getDepartmentBySlug, resolveStorefrontDepartments, categoryHasMenuProducts } from "@/app/lib/storefront-categories";
import ProductsInfinite from "../../kategoria/[...slug]/products-infinite";
import { CategoryModel } from "@/app/models/category";

type Props = { params: Promise<{ slug: string }> };

async function fetchCategories(): Promise<CategoryModel[]> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  if (!host) throw new Error("Missing host header");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const response = await fetch(`${protocol}://${host}/api/categories`, { next: { revalidate: 60 } });
  if (!response.ok) throw new Error("Categories unavailable");
  return response.json();
}

function flattenOptions(nodes: CategoryTree[], prefix = ""): { id: string; name: string }[] {
  return nodes.filter(categoryHasMenuProducts).flatMap((node) => [
    ...( /^\d+$/.test(node.id) ? [{ id: node.id, name: `${prefix}${node.name}` }] : []),
    ...flattenOptions(node.children, `${prefix}${node.name} / `),
  ]);
}

function departmentTiles(roots: { category: CategoryTree; slugPath: string[] }[]) {
  if (roots.length > 1) {
    return roots.filter(({ category }) => categoryHasMenuProducts(category)).map(({ category, slugPath }) => ({
      id: category.id,
      name: category.name,
      href: `/sklep/kategoria/${slugPath.join("/")}`,
    }));
  }
  return roots.flatMap(({ category, slugPath }) => {
    const visibleChildren = category.children.filter(categoryHasMenuProducts);
    const entries = visibleChildren.length ? visibleChildren.map((child) => ({ child, path: [...slugPath, child.slug] })) : [{ child: category, path: slugPath }];
    return entries.map(({ child, path }) => ({ id: child.id, name: child.name, href: `/sklep/kategoria/${path.join("/")}` }));
  });
}

export default async function DepartmentPage({ params }: Props) {
  const { slug } = await params;
  const definition = getDepartmentBySlug(slug);
  if (!definition) return <main className="mx-auto max-w-7xl px-4 py-20"><h1 className="text-2xl font-semibold">Nie znaleziono działu</h1></main>;

  let departments;
  try {
    const tree = buildCategoryTree(await fetchCategories());
    departments = resolveStorefrontDepartments(tree);
  } catch {
    return <main className="mx-auto max-w-7xl px-4 py-16"><div className="rounded-3xl bg-[#f3f6ef] p-8"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Nature-World</p><h1 className="mt-2 text-3xl font-semibold">{definition.label}</h1><p className="mt-3 text-text-secondary">Nie udało się teraz pobrać katalogu. Spróbuj ponownie za chwilę.</p></div></main>;
  }
  const department = departments.find((item) => item.slug === definition.slug);
  if (!department || department.categoryIds.length === 0) return <main className="mx-auto max-w-7xl px-4 py-16"><div className="rounded-3xl bg-[#f3f6ef] p-8"><Boxes className="mb-4 text-primary" /><h1 className="text-3xl font-semibold">{definition.label}</h1><p className="mt-3 text-text-secondary">W tym dziale nie ma obecnie kategorii produktowych.</p></div></main>;

  const tiles = departmentTiles(department.roots);
  const options = department.roots.flatMap(({ category }) => flattenOptions(category.children));
  return <main className="mx-auto min-h-screen max-w-7xl px-4 py-7 md:px-6 md:py-10">
    <nav aria-label="Okruszki" className="mb-5 flex items-center gap-2 text-sm text-text-secondary"><Link href="/sklep" aria-label="Strona sklepu" className="rounded p-1 hover:text-primary"><House size={16} /></Link><span>/</span><span>{definition.label}</span></nav>
    <header className="relative isolate overflow-hidden rounded-3xl bg-[#173d2b] px-6 py-9 text-white shadow-sm md:px-10 md:py-12">
      <div aria-hidden="true" className="absolute -right-10 -top-20 -z-10 h-72 w-72 rounded-full bg-lime-300/10 blur-3xl" />
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-200">Nature-World · dział</p>
      <h1 style={{ color: "#ffffff" }} className="mt-3 text-3xl font-semibold tracking-tight !text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] md:text-5xl">{definition.label}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 md:text-base">{definition.description}</p>
    </header>
    {tiles.length > 0 && <section aria-labelledby="department-categories" className="py-8 md:py-10"><div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Przeglądaj katalog</p><h2 id="department-categories" className="mt-1 text-xl font-semibold md:text-2xl">Kategorie w tym dziale</h2></div></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{tiles.map((tile) => <Link key={`${tile.id}:${tile.href}`} href={tile.href} className="group flex min-h-24 items-center justify-between rounded-2xl bg-[#f3f6ef] p-4 transition-colors hover:bg-[#e8efe1] focus-visible:outline-2 focus-visible:outline-primary md:p-5"><span className="font-medium leading-snug group-hover:text-primary">{tile.name}</span><span aria-hidden="true" className="ml-3 text-xl text-primary transition-transform group-hover:translate-x-1">→</span></Link>)}</div></section>}
    <section aria-label={`Produkty — ${definition.label}`} className="border-t border-black/5 pt-7"><ProductsInfinite departmentSlug={department.slug} categoryOptions={options} /></section>
  </main>;
}

import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowLeft, Banknote, Check, Clock3, PackageOpen, Truck } from "lucide-react";
import ProductGallery from "@/app/components/ProductGallery";
import ProductPurchase from "@/app/components/ProductPurchase";
import ProductCard from "@/app/components/ProductCard";
import type { Product } from "@/app/models/product";
import { getBaseCategories, getBaseProductsPage } from "@/app/lib/base-store";
import { withBaseLinkerRequestContext } from "@/app/lib/base-linker-diagnostics";
import { buildCategoryTree, CategoryTree } from "@/app/lib/categories";
import { resolveStorefrontDepartments } from "@/app/lib/storefront-categories";
import sanitizeHtml from "sanitize-html";

type ProductPageProps = { params: Promise<{ slug: string }> };

async function fetchProduct(slug: string): Promise<Product | null> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  if (!host) return null;
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const response = await fetch(`${protocol}://${host}/api/product?slug=${encodeURIComponent(slug)}`, { next: { revalidate: 30 } });
  if (!response.ok) return null;
  return response.json();
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  if (!product) return { title: "Produkt niedostępny", robots: { index: false, follow: true } };
  const descriptionText = product.content
    .replace(/<[^>]*>/g, " ")
    .replace(/[{}\[\]"\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const description = (descriptionText || `Kup ${product.name} w sklepie Nature-World. Sprawdź cenę i dostępność produktu.`).slice(0, 300);
  return {
    title: product.name,
    description,
    alternates: { canonical: `/sklep/produkt/${encodeURIComponent(slug)}` },
    openGraph: {
      type: "website",
      title: product.name,
      description,
      images: product.images.slice(0, 1).map((url) => ({ url, alt: product.name })),
    },
  };
}

function parseContent(content: string) {
  try {
    const parsed = JSON.parse(content) as { sections?: Array<{ items?: Array<{ type?: string; content?: string }> }> };
    const html = (parsed.sections ?? []).flatMap((section) => section.items ?? []).filter((item) => item.type === "TEXT").map((item) => item.content ?? "").join("");
    return sanitizeHtml(html);
  } catch {
    return sanitizeHtml(content);
  }
}

function findCategory(nodes: CategoryTree[], id: string): CategoryTree | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findCategory(node.children, id);
    if (found) return found;
  }
  return undefined;
}

async function getProductContext(product: Product) {
  try {
    const categories = await getBaseCategories();
    const tree = buildCategoryTree(categories);
    const selected = product.categoryIds.map((id) => findCategory(tree, id)).find(Boolean);
    const path: CategoryTree[] = [];
    let current = selected;
    const visited = new Set<string>();
    while (current && !visited.has(current.id)) {
      path.unshift(current);
      visited.add(current.id);
      current = current.parentId ? findCategory(tree, current.parentId) : undefined;
    }
    const breadcrumbs = path.map((category, index) => ({
      name: category.name,
      href: `/sklep/kategoria/${path.slice(0, index + 1).map((part) => part.slug).join("/")}`,
    }));
    const department = resolveStorefrontDepartments(tree).find((item) => item.roots.some(({ category }) => path.some((part) => part.id === category.id)));
    const tierIds = [...new Set([
      selected?.id,
      path.length > 1 ? path[path.length - 2].id : undefined,
      department?.roots.find(({ category }) => path.some((part) => part.id === category.id))?.category.id,
    ].filter((id): id is string => Boolean(id && /^\d+$/.test(id))))];
    const related: Product[] = [];
    const used = new Set([product.id]);
    for (const categoryId of tierIds) {
      if (related.length >= 4) break;
      try {
        const result = await getBaseProductsPage({ categoryIds: [categoryId], preview: true, pageSize: 12 });
        for (const candidate of result.products) {
          if (used.has(candidate.id) || candidate.stock <= 0 || !Number.isFinite(candidate.price) || candidate.price < 0) continue;
          used.add(candidate.id);
          related.push(candidate);
          if (related.length >= 4) break;
        }
      } catch { /* Keep the product page available and try the next broader category. */ }
    }
    return { breadcrumbs, related, moreHref: breadcrumbs.at(-1)?.href ?? department?.href };
  } catch {
    return { breadcrumbs: [], related: [], moreHref: undefined };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  if (!product) return <main className="mx-auto min-h-[55vh] max-w-7xl px-5 py-16 md:px-8"><Link href="/sklep" className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft size={16} />Wróć do sklepu</Link><div className="mt-10 rounded-3xl bg-white p-8 text-center shadow-sm"><PackageOpen className="mx-auto text-primary" size={34} /><h1 className="mt-4 text-2xl font-semibold">Nie znaleziono produktu</h1><p className="mt-2 text-text-secondary">Produkt może być już niedostępny.</p></div></main>;

  const [context] = await Promise.all([withBaseLinkerRequestContext(
    { path: `/sklep/produkt/${slug}`, operation: "product-related-preview" },
    () => getProductContext(product),
  )]);
  const description = parseContent(product.content || "");
  const validPrice = Number.isFinite(product.price) && product.price >= 0;
  const available = Number.isFinite(product.stock) && product.stock > 0;
  const productStructuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku || undefined,
    description: description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500) || undefined,
    image: product.images,
    offers: validPrice ? {
      "@type": "Offer",
      priceCurrency: "PLN",
      price: product.price.toFixed(2),
      availability: available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://nature-world.pl"}/sklep/produkt/${encodeURIComponent(slug)}`,
      itemCondition: "https://schema.org/NewCondition",
    } : undefined,
  };

  return <main className="mx-auto max-w-7xl px-4 py-7 md:px-8 md:py-10">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productStructuredData).replace(/</g, "\\u003c") }} />
    <nav aria-label="Okruszki" className="mb-6 flex min-w-0 flex-wrap items-center gap-2 text-sm text-text-secondary"><Link href="/" className="hover:text-primary">Strona główna</Link><span aria-hidden="true">/</span><Link href="/sklep" className="hover:text-primary">Sklep</Link>{context.breadcrumbs.map((crumb) => <span key={crumb.href} className="contents"><span aria-hidden="true">/</span><Link href={crumb.href} className="max-w-full break-words hover:text-primary">{crumb.name}</Link></span>)}<span aria-hidden="true">/</span><span className="min-w-0 line-clamp-1 text-text-main" aria-current="page">{product.name}</span></nav>
    <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
      <section aria-label="Zdjęcia produktu" className="min-w-0">{product.images?.length ? <ProductGallery images={product.images} name={product.name} /> : <div className="flex aspect-square items-center justify-center rounded-3xl bg-white text-[#aab7a1]"><PackageOpen size={56} strokeWidth={1.2} /><span className="sr-only">Brak zdjęcia produktu</span></div>}</section>
      <section className="flex flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 md:p-8 lg:p-9">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Nature-World</p>
        <h1 className="mt-3 text-2xl font-semibold leading-tight text-[#173d2b] md:text-3xl xl:text-4xl">{product.name}</h1>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {product.sku && <p className="text-xs text-text-secondary">SKU: <span className="font-medium text-[#365443]">{product.sku}</span></p>}
          <p className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${available ? "bg-emerald-50 text-emerald-800" : "bg-gray-100 text-gray-600"}`}><span className={`h-2 w-2 rounded-full ${available ? "bg-emerald-600" : "bg-gray-400"}`} />{available ? `Dostępny (${product.stock})` : "Chwilowo niedostępny"}</p>
        </div>
        <div className="mt-6 flex items-end justify-between gap-4 rounded-2xl bg-[#f6f8f3] px-5 py-4">
          <span className="pb-1 text-sm font-medium text-[#526457]">Cena</span>
          <p className="text-right text-3xl font-bold tracking-tight text-[#173d2b] md:text-4xl">{validPrice ? <>{product.price.toFixed(2)} <span className="text-base font-semibold">zł</span></> : <span className="text-base font-medium text-text-secondary">Cena chwilowo niedostępna</span>}</p>
        </div>
        <div className="mt-5 w-full">{validPrice && available ? <ProductPurchase product={product} /> : <button type="button" disabled className="h-12 w-full cursor-not-allowed rounded-full bg-[#e7ebe6] px-5 font-semibold text-[#56635a]">{available ? "Zakup niedostępny" : "Produkt niedostępny"}</button>}</div>
        <div className="mt-5 w-full overflow-hidden rounded-2xl border border-[#dce8d7] bg-gradient-to-br from-[#f7faf4] to-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-[#e6eee2] px-4 py-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e7f1e3] text-primary"><Truck size={20} aria-hidden="true" /></span>
            <span className="min-w-0 flex-1"><strong className="block text-sm text-[#173d2b]">Wygodna dostawa</strong><span className="text-xs text-text-secondary">Zamów wygodnie online</span></span>
            <span className="shrink-0 rounded-full bg-[#e7f1e3] px-2.5 py-1 text-[11px] font-bold text-[#23613a]">WYSYŁKA 24 H</span>
          </div>
          <div className="grid grid-cols-1 divide-y divide-[#e6eee2] px-4 sm:grid-cols-2 sm:divide-y-0">
            <div className="flex items-center gap-3 py-3 sm:pr-3"><Clock3 size={17} className="shrink-0 text-primary" aria-hidden="true" /><span className="text-xs leading-5 text-[#365443]"><strong className="block text-[#173d2b]">Sprawna realizacja</strong>Wysyłka w ciągu 24 godzin</span></div>
            <div className="flex items-center gap-3 py-3 sm:border-l sm:border-[#e6eee2] sm:pl-3"><Truck size={17} className="shrink-0 text-primary" aria-hidden="true" /><span className="text-xs leading-5 text-[#365443]"><strong className="block text-[#173d2b]">Dostawa kurierem</strong>Stała cena: 10 zł</span></div>
            <div className="flex items-center gap-3 border-t border-[#e6eee2] py-3 sm:col-span-2"><Banknote size={17} className="shrink-0 text-primary" aria-hidden="true" /><span className="text-xs leading-5 text-[#365443]"><strong className="text-[#173d2b]">Płatność przy odbiorze</strong><span> · zapłać kurierowi</span></span></div>
          </div>
        </div>
        <p className="mt-4 text-center text-xs leading-5 text-text-secondary">Dostępność i cena są ponownie weryfikowane przy składaniu zamówienia.</p>
      </section>
    </div>
    {description && <details open className="mt-10 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 md:mt-14 md:p-9"><summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-[#173d2b] focus-visible:outline-2 focus-visible:outline-primary"><Check className="text-primary" size={20} /><span className="text-xl">Opis produktu</span></summary><div className="prose mt-5 max-w-none prose-headings:text-[#173d2b] prose-a:text-primary" dangerouslySetInnerHTML={{ __html: description }} /></details>}
    {product.sku && <details className="mt-4 rounded-2xl bg-white px-6 py-4 shadow-sm ring-1 ring-black/5"><summary className="cursor-pointer font-semibold text-[#173d2b] focus-visible:outline-2 focus-visible:outline-primary">Szczegóły produktu</summary><dl className="mt-3 text-sm"><div className="flex gap-2"><dt className="font-medium">SKU:</dt><dd className="text-text-secondary">{product.sku}</dd></div></dl></details>}
    {context.related.length > 0 && <section aria-labelledby="related-products-heading" className="mt-12 md:mt-16"><div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Odkryj więcej</p><h2 id="related-products-heading" className="mt-2 text-2xl font-semibold text-[#173d2b] md:text-3xl">Podobne produkty</h2></div>{context.moreHref && <Link href={context.moreHref} className="shrink-0 text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary">Zobacz więcej</Link>}</div><div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{context.related.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>}
  </main>;
}

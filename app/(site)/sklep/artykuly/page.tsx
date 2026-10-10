import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { Newspaper } from "lucide-react";

type Article = { id: string; title: string; slug: string; excerpt?: string; content?: string; images?: string[]; publishedAt?: number | string };

async function getArticles(): Promise<Article[]> {
  const host = (await headers()).get("host");
  if (!host) return [];
  try {
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const response = await fetch(`${protocol}://${host}/api/posts?type=article`, { next: { revalidate: 60 } });
    if (!response.ok) return [];
    const data: unknown = await response.json();
    return Array.isArray(data) ? data as Article[] : [];
  } catch { return []; }
}

export default async function ArticlesPage() {
  const articles = await getArticles();
  return <main className="mx-auto min-h-[55vh] max-w-7xl px-4 py-10 md:px-8 md:py-14"><header className="rounded-3xl bg-[#173d2b] p-7 text-white md:p-10"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-lime-200"><Newspaper size={16} />Nature-World</p><h1 className="mt-3 text-3xl font-semibold text-white md:text-5xl">Porady i artykuły</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">Materiały opublikowane przez Nature-World.</p></header>{articles.length ? <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{articles.map((article) => <article id={article.slug} key={article.id} className="scroll-mt-28 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">{article.images?.[0] && <div className="relative aspect-[16/10] bg-[#edf3e9]"><Image src={`/api/image/${encodeURIComponent(article.images[0])}`} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" /></div>}<div className="p-5"><h2 className="text-xl font-semibold text-[#173d2b]">{article.title}</h2>{article.excerpt && <p className="mt-3 text-sm leading-6 text-text-secondary">{article.excerpt}</p>}{article.content && <p className="mt-3 line-clamp-5 whitespace-pre-line text-sm leading-6">{article.content}</p>}</div></article>)}</div> : <div className="mt-8 rounded-3xl border border-dashed border-black/15 bg-white/70 px-6 py-14 text-center"><Newspaper className="mx-auto text-primary" size={30} /><h2 className="mt-4 text-xl font-semibold">Brak opublikowanych artykułów</h2></div>}<Link href="/sklep" className="mt-8 inline-flex min-h-11 items-center rounded-full bg-[#edf3e9] px-5 font-semibold text-[#173d2b] hover:bg-[#e2ecdb]">Wróć do sklepu</Link></main>;
}

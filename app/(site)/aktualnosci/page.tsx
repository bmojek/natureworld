import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft, ArrowRight, CalendarDays, Newspaper } from "lucide-react";
import PostGallery from "@/app/components/Gallery/PostGallery";

type NewsPost = { id: string; title: string; slug: string; excerpt?: string; content?: string; images?: string[]; publishedAt?: number | string | { seconds?: number; _seconds?: number } };

async function getNews(): Promise<NewsPost[]> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  if (!host) return [];
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  try {
    const response = await fetch(protocol + "://" + host + "/api/posts?type=news", { next: { revalidate: 60 } });
    if (!response.ok) return [];
    const data: unknown = await response.json();
    return Array.isArray(data) ? data as NewsPost[] : [];
  } catch {
    return [];
  }
}

function dateLabel(value: NewsPost["publishedAt"]) {
  const raw = typeof value === "object" && value ? (value.seconds ?? value._seconds) : value;
  if (!raw) return "";
  const date = new Date(typeof raw === "number" && raw < 10_000_000_000 ? raw * 1000 : raw);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
}

function PostImage({ post, featured = false }: { post: NewsPost; featured?: boolean }) {
  const sizes = featured ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 30vw, 100vw";
  const imageClass = featured ? "aspect-[4/3] lg:aspect-auto lg:min-h-full" : "aspect-[16/9] lg:aspect-[4/3]";
  return post.images?.[0]
    ? <div className={"relative overflow-hidden bg-[#e7eee1] " + imageClass}><Image src={"/api/image/" + encodeURIComponent(post.images[0])} alt="" fill sizes={sizes} className="object-cover" /></div>
    : <div className={"flex items-center justify-center bg-gradient-to-br from-[#dfeadb] via-[#edf3e9] to-[#d4e2cf] text-primary " + imageClass}><Newspaper size={featured ? 46 : 34} strokeWidth={1.35} /></div>;
}

function PostContent({ post, featured = false }: { post: NewsPost; featured?: boolean }) {
  return <>
    {post.excerpt && <p className={featured ? "mt-4 text-base leading-7 text-[#405b48] md:text-lg" : "mt-3 text-sm leading-7 text-[#405b48]"}>{post.excerpt}</p>}
    {post.content && <div className="mt-5 whitespace-pre-line text-sm leading-7 text-gray-700 md:text-base md:leading-8">{post.content}</div>}
    {post.images && post.images.length > 1 && <div className="mt-7"><PostGallery images={post.images} /></div>}
  </>;
}

function PostDate({ post }: { post: NewsPost }) {
  const date = dateLabel(post.publishedAt);
  return date ? <p className="inline-flex items-center gap-2 text-xs font-medium text-text-secondary"><CalendarDays size={14} className="text-primary" />{date}</p> : null;
}

export default async function NewsPage() {
  const posts = await getNews();
  return <main className="min-h-[60vh] bg-[#fafbf9]">
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 md:px-8 md:pt-9">
      <Link href="/" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-[#405b48] transition hover:bg-[#edf3e9] hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"><ArrowLeft size={16} />Strona główna</Link>

      <header className="relative mt-5 overflow-hidden rounded-[2rem] bg-[#173d2b] px-6 py-9 text-white md:px-10 md:py-12">
        <div aria-hidden="true" className="absolute -right-16 -top-24 h-80 w-80 rounded-full border-[54px] border-white/[0.06]" />
        <div aria-hidden="true" className="absolute -bottom-32 right-48 h-64 w-64 rounded-full bg-lime-200/[0.08] blur-3xl" />
        <div className="relative max-w-3xl">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-lime-200"><Newspaper size={16} />Nature-World • ze sklepu</p>
          <h1 style={{ color: "#ffffff" }} className="mt-4 text-4xl font-semibold tracking-tight !text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] md:text-6xl">Wieści i inspiracje</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/80 md:text-lg">Poznaj aktualności, pomysły i informacje przygotowane przez zespół Nature-World.</p>
          {posts[0] && <a href={"#" + encodeURIComponent(posts[0].slug)} className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-lime-200 px-5 text-sm font-semibold text-[#173d2b] transition hover:bg-lime-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Czytaj najnowszy wpis <ArrowRight size={16} /></a>}
        </div>
      </header>

      {posts.length > 0 ? <>
        {posts[0] && <article id={posts[0].slug} className="scroll-mt-28 mt-8 overflow-hidden rounded-[1.75rem] bg-white shadow-[0_18px_55px_-34px_rgba(23,61,43,.38)] ring-1 ring-black/5 md:mt-10">
          <div className="grid lg:grid-cols-[1.05fr_.95fr]">
            <PostImage post={posts[0]} featured />
            <div className="p-6 md:p-9 lg:p-10">
              <p className="mb-3 text-xs font-bold uppercase tracking-[.16em] text-primary">Najnowszy wpis</p>
              <PostDate post={posts[0]} />
              <h2 style={{ color: "#173d2b" }} className="mt-3 text-2xl font-semibold leading-tight tracking-tight !text-[#173d2b] md:text-4xl">{posts[0].title}</h2>
              <PostContent post={posts[0]} featured />
            </div>
          </div>
        </article>}

        {posts.length > 1 && <section aria-labelledby="archive-heading" className="mt-14 md:mt-20">
          <div className="mb-6 flex items-end justify-between gap-4 border-b border-[#dfe7d8] pb-5">
            <div><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Archiwum</p><h2 id="archive-heading" className="mt-2 text-2xl font-semibold tracking-tight text-[#173d2b] md:text-3xl">Więcej aktualności</h2></div>
            <span className="hidden text-sm text-text-secondary sm:block">{posts.length - 1} {posts.length - 1 === 1 ? "wpis" : "wpisów"}</span>
          </div>
          <div className="divide-y divide-[#dfe7d8]">
            {posts.slice(1).map((post, index) => <article id={post.slug} key={post.id} className="scroll-mt-28 grid gap-5 py-7 md:grid-cols-[4rem_minmax(0,1fr)_16rem] md:gap-8 md:py-9">
              <p className="text-sm font-semibold tabular-nums text-primary/70">0{index + 2}</p>
              <div className="min-w-0">
                <PostDate post={post} />
                <h3 style={{ color: "#173d2b" }} className="mt-2 text-xl font-semibold leading-tight !text-[#173d2b] md:text-2xl">{post.title}</h3>
                <PostContent post={post} />
              </div>
              <div className="md:pt-1"><PostImage post={post} /></div>
            </article>)}
          </div>
        </section>}
      </> : <section className="mt-8 rounded-[1.75rem] border border-dashed border-[#cbd8c5] bg-white px-6 py-14 text-center md:mt-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf3e9] text-primary"><Newspaper size={27} /></span>
        <h2 className="mt-5 text-2xl font-semibold text-[#173d2b]">Na razie bez aktualności</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-secondary">Wróć do nas wkrótce — tutaj pojawią się nowe informacje i inspiracje.</p>
        <Link href="/sklep" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-[#24652a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Przejdź do sklepu <ArrowRight size={16} /></Link>
      </section>}
    </div>
  </main>;
}

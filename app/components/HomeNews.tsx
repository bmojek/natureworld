"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Newspaper } from "lucide-react";

type HomePost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  images?: string[];
  publishedAt?: number | string | { seconds?: number; _seconds?: number };
};

function formatDate(value: HomePost["publishedAt"]) {
  const raw = typeof value === "object" && value ? (value.seconds ?? value._seconds) : value;
  if (!raw) return "";
  const date = new Date(typeof raw === "number" && raw < 10_000_000_000 ? raw * 1000 : raw);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("pl-PL");
}

function newsHref(post: HomePost) {
  return "/aktualnosci#" + encodeURIComponent(post.slug);
}

export default function HomeNews() {
  const [posts, setPosts] = useState<HomePost[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/posts?type=news", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<HomePost[]> : [])
      .then((data) => { if (active && Array.isArray(data)) setPosts(data.slice(0, 3)); })
      .catch(() => { if (active) setPosts([]); });
    return () => { active = false; };
  }, []);

  if (!posts.length) return null;

  return (
    <section aria-labelledby="home-news-title" className="border-y border-[#e3e9df] bg-[#f7f9f5] py-10 text-[#173d2b] md:py-12">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-primary"><Newspaper size={15} />Ze sklepu</p>
            <h2 id="home-news-title" className="mt-2 text-3xl font-semibold tracking-tight text-[#173d2b] md:text-4xl">Aktualności i inspiracje</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#5c6d5e]">Nowości i informacje od Nature-World.</p>
          </div>
          <Link href="/aktualnosci" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#d6e1d1] bg-white px-4 text-sm font-semibold text-[#24532d] shadow-sm transition hover:bg-[#edf3e9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Wszystkie aktualności <ArrowRight size={16} /></Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          {posts[0] && <Link href={newsHref(posts[0])} className="group relative isolate flex min-h-72 overflow-hidden rounded-3xl bg-[#254a31] p-6 shadow-sm transition hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary md:min-h-80 md:p-8">
            {posts[0].images?.[0] ? <Image src={"/api/image/" + encodeURIComponent(posts[0].images[0])} alt="" fill sizes="(min-width: 1024px) 60vw, 100vw" className="-z-20 object-cover transition-transform duration-700 group-hover:scale-[1.03]" /> : <div aria-hidden="true" className="-z-20 absolute inset-0 bg-gradient-to-br from-[#527755] via-[#244b35] to-[#102c20]" />}
            <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-[#102c20]/95 via-[#102c20]/40 to-[#102c20]/10" />
            <div className="mt-auto max-w-2xl">
              <p className="flex flex-wrap items-center gap-2 text-xs font-semibold text-white/85"><span className="rounded-full bg-lime-200 px-3 py-1 text-[#173d2b]">Wyróżniony wpis</span>{formatDate(posts[0].publishedAt) && <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} />{formatDate(posts[0].publishedAt)}</span>}</p>
              <div className="mt-3 max-w-full">
                <h3 className="featured-news-title text-2xl font-semibold leading-tight md:text-3xl">{posts[0].title}</h3>
                {posts[0].excerpt && <p className="mt-2 line-clamp-2 max-w-xl text-sm leading-6 text-white/90">{posts[0].excerpt}</p>}
              </div>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-lime-200">Czytaj aktualność <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></span>
            </div>
          </Link>}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {posts.slice(1).map((post, index) => <Link href={newsHref(post)} key={post.id} className="group flex min-h-28 min-w-0 overflow-hidden rounded-2xl border border-[#e1e8dc] bg-white shadow-sm transition hover:border-[#c8d7c2] hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary">
              <div className="relative w-24 shrink-0 overflow-hidden bg-[#edf3e9] sm:w-28">
                {post.images?.[0] ? <Image src={"/api/image/" + encodeURIComponent(post.images[0])} alt="" fill sizes="112px" className="object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-primary"><Newspaper size={22} /></div>}
              </div>
              <div className="flex min-w-0 flex-col justify-center p-4">
                <p className="text-[11px] font-bold uppercase tracking-[.12em] text-primary">{formatDate(post.publishedAt) || `Aktualność ${String(index + 2).padStart(2, "0")}`}</p>
                <h3 className="mt-1 line-clamp-2 font-semibold leading-5 text-[#173d2b] group-hover:text-primary">{post.title}</h3>
                {post.excerpt && <p className="mt-1 line-clamp-1 text-xs leading-5 text-[#68766a]">{post.excerpt}</p>}
              </div>
            </Link>)}
          </div>
        </div>
      </div>
    </section>
  );
}

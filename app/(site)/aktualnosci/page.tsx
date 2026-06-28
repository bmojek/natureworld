import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Home,
  Newspaper,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

import PostGallery from "@/app/components/Gallery/PostGallery";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  images?: string[];
  publishedAt?: any;
};

const fallbackImage = "banerwide2.webp";

const fallbackPosts: Post[] = [
  {
    id: "start",
    title: "Nowości w Nature World",
    slug: "startujemy-z-firmowa-strona",
    excerpt:
      "Sprawdzaj aktualne informacje o produktach do ogrodu, domu i dla zwierząt.",
    content:
      "W aktualnościach znajdziesz zapowiedzi nowości, sezonowe propozycje oraz praktyczne informacje o asortymencie Nature World.",
    images: ["banerwide2.webp", "bilbordsharp.webp", "o-nas.webp"],
    publishedAt: Date.now(),
  },
  {
    id: "sezon",
    title: "Produkty sezonowe dla domu i ogrodu",
    slug: "produkty-sezonowe",
    excerpt:
      "Praktyczne propozycje na balkon, ogród, dom i najważniejsze prace sezonowe.",
    content:
      "Oferta Nature World zmienia się razem z sezonem. Warto śledzić nowe dostawy, produkty do pielęgnacji roślin, dekoracje oraz akcesoria przydatne w domu i ogrodzie.",
    images: ["bilbordsharp.webp", "banerwide2.webp"],
    publishedAt: Date.now(),
  },
  {
    id: "allegro",
    title: "Oferta w sklepie Nature World",
    slug: "oferta-na-allegro",
    excerpt:
      "Zobacz dostępne produkty i wybierz artykuły dopasowane do swoich potrzeb.",
    content:
      "W ofercie Nature World znajdziesz artykuły ogrodnicze, dekoracje, produkty sezonowe oraz asortyment dla zwierząt. Zakupy zrobisz stacjonarnie, a wybrane produkty są dostępne również online.",
    images: ["o-nas.webp"],
    publishedAt: Date.now(),
  },
];

async function fetchPosts(): Promise<Post[]> {
  const h = await headers();
  const host = h.get("host");

  if (!host) return [];

  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  const res = await fetch(`${protocol}://${host}/api/posts?type=news`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) return [];

  return res.json();
}

function formatDate(value: any) {
  if (!value) return "";

  if (value.seconds) {
    return new Date(value.seconds * 1000).toLocaleDateString("pl-PL");
  }

  if (value._seconds) {
    return new Date(value._seconds * 1000).toLocaleDateString("pl-PL");
  }

  if (value.toDate) {
    return value.toDate().toLocaleDateString("pl-PL");
  }

  return new Date(value).toLocaleDateString("pl-PL");
}

export default async function NewsPage() {
  const fetchedPosts = await fetchPosts();
  const posts = fetchedPosts.length ? fetchedPosts : fallbackPosts;
  const featured = posts[0];

  return (
    <main className="min-h-screen bg-background">
      <Link
        href="/"
        className="fixed left-4 top-4 z-40 inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/70 bg-white/90 px-5 text-sm font-semibold text-primary shadow-xl backdrop-blur transition hover:-translate-y-0.5 hover:bg-primary hover:text-white md:left-8 md:top-8"
      >
        <Home size={17} />
        Strona główna
      </Link>

      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-end">
          <Link
            href="/#kontakt"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            <ShoppingBag size={17} />
            Kontakt
          </Link>
        </div>

        <header className="overflow-hidden rounded-[2rem] bg-white/80 shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
            <div className="relative bg-primary p-7 text-white md:p-10 lg:p-12">
              <div className="absolute inset-x-0 top-0 h-1 bg-accent" />
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
                <Newspaper size={18} />
                Aktualności
              </p>
              <h1 className="mt-5 text-4xl font-semibold leading-tight !text-white md:text-6xl">
                Najnowsze informacje z Nature World
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/85">
                Nowości produktowe, sezonowe inspiracje, porady ogrodnicze oraz
                informacje o ofercie dla domu i zwierząt.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">
                  <Sparkles size={16} />
                  Nowości
                </span>
                <span className="inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">
                  Ogród i rośliny
                </span>
                <span className="inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">
                  Zwierzęta
                </span>
              </div>
            </div>

            <div className="relative min-h-[320px] bg-white">
              <Image
                src={`/api/image/${featured.images?.[0] ?? fallbackImage}`}
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/10" />
            </div>
          </div>
        </header>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid gap-8 lg:grid-cols-[0.75fr_1.55fr]">
          <aside className="space-y-4 pt-8 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-3xl bg-white/80 p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Wpisy</h2>
              <nav className="mt-5 grid max-h-[52vh] gap-3 overflow-y-auto pr-2">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`#${post.slug}`}
                    className="group rounded-2xl bg-background p-4 text-sm font-semibold leading-snug transition hover:bg-primary hover:text-white"
                  >
                    {post.title}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="rounded-3xl bg-primary p-6 text-white shadow-sm">
              <h2 className="text-lg font-semibold !text-white">
                Nature World
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/80">
                Aktualności pomagają śledzić nowości, produkty sezonowe i
                inspiracje dla ogrodu, domu oraz zwierząt.
              </p>
              <Link
                href="/#kontakt"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white"
              >
                Kontakt
                <ArrowRight size={16} />
              </Link>
            </div>
          </aside>

          <div className="space-y-8 pt-8">
            {posts.map((post) => (
              <article
                id={post.slug}
                key={post.id}
                className="scroll-mt-8 overflow-hidden rounded-3xl bg-white/80 shadow-sm transition hover:shadow-xl"
              >
                {post.images?.[0] && (
                  <div className="relative aspect-[16/8] bg-white">
                    <Image
                      src={`/api/image/${post.images[0]}`}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 65vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="p-6 md:p-8">
                  <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                    <CalendarDays size={16} className="text-primary" />
                    {formatDate(post.publishedAt)}
                  </p>

                  <h2 className="mt-4 text-3xl font-semibold leading-tight">
                    {post.title}
                  </h2>

                  {post.excerpt && (
                    <p className="mt-5 text-lg leading-8 text-text-secondary">
                      {post.excerpt}
                    </p>
                  )}

                  {post.content && (
                    <div className="mt-6 whitespace-pre-line leading-8 text-text-main">
                      {post.content}
                    </div>
                  )}

                  {post.images && post.images.length > 1 && (
                    <div className="mt-8">
                      <PostGallery images={post.images} />
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

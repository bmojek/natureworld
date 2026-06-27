import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft, CalendarDays, Newspaper, ShoppingBag } from "lucide-react";

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

const allegroUrl = "https://allegro.pl/uzytkownik/nature-world";
const fallbackImage = "banerwide2.webp";

const fallbackPosts: Post[] = [
  {
    id: "start",
    title: "Startujemy z firmową stroną Nature World",
    slug: "startujemy-z-firmowa-strona",
    excerpt:
      "To miejsce na najnowsze informacje o ofercie, sezonowych produktach i zmianach w sprzedaży.",
    content:
      "Na stronie będziemy publikować krótkie aktualizacje, zapowiedzi nowości oraz praktyczne informacje dla klientów. To pierwszy etap firmowej komunikacji Nature World.",
    images: ["banerwide2.webp", "bilbordsharp.webp", "o-nas.webp"],
    publishedAt: Date.now(),
  },
  {
    id: "sezon",
    title: "Produkty sezonowe dla domu i ogrodu",
    slug: "produkty-sezonowe",
    excerpt:
      "Będziemy tu pokazywać nowości, praktyczne inspiracje i kategorie warte uwagi.",
    content:
      "Oferta Nature World może zmieniać się razem z sezonem. Aktualności pozwolą szybko pokazać klientom, co właśnie pojawiło się w sprzedaży i na co warto zwrócić uwagę.",
    images: ["bilbordsharp.webp", "banerwide2.webp"],
    publishedAt: Date.now(),
  },
  {
    id: "allegro",
    title: "Aktualna oferta dostępna na Allegro",
    slug: "oferta-na-allegro",
    excerpt:
      "Na tym etapie zakupy kierujemy do działającego kanału sprzedaży Nature World.",
    content:
      "Strona firmowa ma budować zaufanie i porządkować informacje o marce, a sprzedaż może być realizowana przez Allegro. To prosty i wygodny start przed rozbudową własnego sklepu.",
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
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft size={17} />
            Strona główna
          </Link>

          <Link
            href={allegroUrl}
            target="_blank"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            <ShoppingBag size={17} />
            Oferta na Allegro
          </Link>
        </div>

        <header className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
          <div className="rounded-3xl bg-primary p-7 text-white shadow-sm md:p-10">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
              <Newspaper size={18} />
              Aktualności
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight text-white md:text-6xl">
              Najnowsze informacje z Nature World
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/80">
              Tutaj zbieramy wpisy firmowe, nowości produktowe, sezonowe
              informacje i komunikaty dla klientów.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl bg-white/80 shadow-sm">
            <div className="relative aspect-[4/3]">
              <Image
                src={`/api/image/${featured.images?.[0] ?? fallbackImage}`}
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </header>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid gap-8 lg:grid-cols-[0.75fr_1.55fr]">
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-3xl bg-white/80 p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Wpisy</h2>
              <nav className="mt-5 grid gap-3">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`#${post.slug}`}
                    className="rounded-2xl bg-background p-4 text-sm font-semibold leading-snug transition hover:text-primary"
                  >
                    {post.title}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          <div className="space-y-8">
            {posts.map((post) => (
              <article
                id={post.slug}
                key={post.id}
                className="scroll-mt-8 overflow-hidden rounded-3xl bg-white/80 shadow-sm"
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
                  <p className="flex items-center gap-2 text-sm text-text-secondary">
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

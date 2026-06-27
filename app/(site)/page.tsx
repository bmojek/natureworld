"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Facebook,
  Home,
  Instagram,
  Leaf,
  Mail,
  MapPin,
  Newspaper,
  PawPrint,
  Phone,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sprout,
  Store,
  Truck,
} from "lucide-react";

type NewsPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  images?: string[];
  publishedAt?: any;
};

const allegroUrl = "https://allegro.pl/uzytkownik/nature-world";
const facebookUrl = "https://facebook.com";
const fallbackImage = "banerwide2.webp";

const fallbackPosts: NewsPost[] = [
  {
    id: "start",
    title: "Startujemy z firmową stroną Nature World",
    slug: "startujemy-z-firmowa-strona",
    excerpt:
      "To miejsce na najnowsze informacje o ofercie, sezonowych produktach i zmianach w sprzedaży.",
    images: ["banerwide2.webp"],
    publishedAt: Date.now(),
  },
  {
    id: "sezon",
    title: "Produkty sezonowe dla domu i ogrodu",
    slug: "produkty-sezonowe",
    excerpt:
      "Będziemy tu pokazywać nowości, praktyczne inspiracje i kategorie warte uwagi.",
    images: ["bilbordsharp.webp"],
    publishedAt: Date.now(),
  },
  {
    id: "allegro",
    title: "Aktualna oferta dostępna na Allegro",
    slug: "oferta-na-allegro",
    excerpt:
      "Na tym etapie zakupy kierujemy do działającego kanału sprzedaży Nature World.",
    images: ["o-nas.webp"],
    publishedAt: Date.now(),
  },
];

const categories = [
  {
    icon: Leaf,
    title: "Ogród",
    text: "Nasiona, nawozy, podłoża, doniczki, osłonki i akcesoria sezonowe.",
  },
  {
    icon: PawPrint,
    title: "Zwierzęta",
    text: "Produkty dla psów, kotów oraz dział akwarystyczny.",
  },
  {
    icon: Sprout,
    title: "Rośliny i florystyka",
    text: "Artykuły dla roślin, dekoracje, ozdoby i dodatki florystyczne.",
  },
  {
    icon: Sparkles,
    title: "Sezonowe",
    text: "Nowości, promocje i produkty dopasowane do aktualnego sezonu.",
  },
];

const offerGroups = [
  {
    title: "Ogród i rośliny",
    image: "bilbordsharp.webp",
    items: ["nasiona warzyw, ziół i roślin ozdobnych", "nawozy i preparaty", "podłoża oraz ziemie", "doniczki, osłonki i pojemniki"],
  },
  {
    title: "Zwierzęta",
    image: "o-nas.webp",
    items: ["produkty dla psów", "produkty dla kotów", "akwarystyka", "praktyczne akcesoria dla pupili"],
  },
  {
    title: "Dom i sezon",
    image: "banerwide2.webp",
    items: ["dekoracje i ozdoby", "florystyka", "produkty okazjonalne", "nowości dostępne w sprzedaży online"],
  },
];

const storeFacts = [
  {
    icon: Store,
    title: "Sklep internetowy w rozwoju",
    text: "Nature World działa jako młoda marka. Strona firmowa ma najpierw porządkować informacje, aktualności i kontakt.",
  },
  {
    icon: ShoppingBag,
    title: "Zakupy przez Allegro",
    text: "Aktualny kanał sprzedaży prowadzi przez Allegro, więc klient od razu trafia do działającej oferty.",
  },
  {
    icon: Newspaper,
    title: "Aktualności na pierwszym miejscu",
    text: "Nowe produkty, sezonowe komunikaty i informacje o ofercie mogą być publikowane bez przebudowy strony.",
  },
];

const servicePoints = [
  "szybka komunikacja z klientem",
  "oferta ogrodniczo-zoologiczna w jednym miejscu",
  "sezonowe aktualizacje i nowości",
  "prosty kierunek rozbudowy pod pełny sklep",
];

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

export default function Main() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch("/api/posts?type=news")
      .then((response) => response.json())
      .then((data) => {
        if (active) setPosts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setPosts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const visiblePosts = useMemo(
    () => (posts.length ? posts : fallbackPosts),
    [posts],
  );

  const featured = visiblePosts[0];
  const secondaryPosts = visiblePosts.slice(1, 4);

  return (
    <main className="min-h-screen bg-background">
      <CompanyHeader />

      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <FeaturedNews post={featured} loading={loading} />

          <aside className="grid gap-4">
            <div className="rounded-3xl bg-primary p-7 text-white shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
                Nature World
              </p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight text-white">
                Aktualności, nowości i ważne informacje
              </h1>
              <p className="mt-5 leading-7 text-white/80">
                To główne miejsce komunikacji marki. Tu pokazujemy nowe
                produkty, sezonowe wpisy, informacje o ofercie i krótkie
                aktualizacje dla klientów.
              </p>
              <Link
                href={allegroUrl}
                target="_blank"
                className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-primary transition hover:bg-white/90"
              >
                <ShoppingBag size={17} />
                Oferta na Allegro
              </Link>
            </div>

            <div className="rounded-3xl bg-white/80 p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Newspaper className="text-primary" size={20} />
                Najnowsze wpisy
              </h2>
              <div className="mt-5 grid gap-4">
                {secondaryPosts.map((post) => (
                  <SmallNewsItem key={post.id} post={post} />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section id="aktualnosci" className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionHeader
            eyebrow="Aktualności"
            title="Wszystko, co nowe w Nature World"
            description="Sekcja aktualności jest centrum tej strony. Później można ją zasilać wpisami z panelu admina."
          />
          <Link
            href="/aktualnosci"
            className="inline-flex h-12 w-fit items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            Wszystkie aktualności
            <ArrowRight size={17} />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visiblePosts.map((post) => (
            <NewsCard key={post.id} post={post} />
          ))}
        </div>
      </section>

      <section id="oferta" className="max-w-7xl mx-auto px-4 py-12">
        <SectionHeader
          eyebrow="Oferta"
          title="Krótko o tym, czym się zajmujemy"
          description="Oferta jest dodatkiem do aktualności, ale użytkownik powinien od razu zrozumieć, co można znaleźć w Nature World."
        />

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((item) => (
            <CategoryCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid gap-6 lg:grid-cols-3">
          {offerGroups.map((group) => (
            <article
              key={group.title}
              className="group overflow-hidden rounded-3xl bg-white/80 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative aspect-[4/3] bg-white">
                <Image
                  src={`/api/image/${group.image}`}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              </div>

              <div className="p-6">
                <h3 className="text-2xl font-semibold group-hover:text-primary">
                  {group.title}
                </h3>
                <ul className="mt-5 grid gap-3">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 text-sm leading-6 text-text-secondary"
                    >
                      <CheckCircle2
                        className="mt-0.5 shrink-0 text-primary"
                        size={17}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="onas" className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid gap-8 rounded-3xl bg-white/80 p-5 shadow-sm md:p-8 lg:grid-cols-2 lg:items-center">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-background">
            <Image
              src="/api/image/o-nas.webp"
              alt="Nature World"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover transition duration-300 hover:scale-105"
            />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              O nas
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight md:text-4xl">
              Młody sklep z prostą komunikacją
            </h2>
            <p className="mt-5 leading-8 text-text-secondary">
              Nature World rozwijamy jako sklep dla osób szukających produktów
              do ogrodu, domu i zwierząt. Strona firmowa ma najpierw pokazywać
              aktualności i budować wiarygodność marki, a sprzedaż prowadzić do
              Allegro.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {servicePoints.map((point) => (
                <div
                  key={point}
                  className="flex items-center gap-3 rounded-2xl bg-background p-4 text-sm font-medium"
                >
                  <CheckCircle2 className="shrink-0 text-primary" size={18} />
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <SectionHeader
          eyebrow="Jak działa strona"
          title="Firmowa baza pod dalszy rozwój sklepu"
          description="Najpierw publikujemy treści i informacje o marce, a później możemy rozszerzać projekt o pełną sprzedaż, kategorie i produkty."
        />

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {storeFacts.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="rounded-3xl bg-white/80 p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <Icon className="text-primary" size={32} />
              <h3 className="mt-5 text-xl font-semibold">{title}</h3>
              <p className="mt-3 leading-7 text-text-secondary">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="kontakt" className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid gap-6 rounded-3xl bg-primary p-6 text-white shadow-sm md:p-8 lg:grid-cols-[1fr_0.85fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
              Kontakt
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
              Chcesz zapytać o ofertę?
            </h2>
            <p className="mt-5 max-w-2xl leading-8 text-white/80">
              Napisz do nas albo sprawdź aktualną ofertę na Allegro. Dane
              kontaktowe można podmienić na właściwe przed publikacją.
            </p>
          </div>

          <div className="grid gap-3">
            <ContactRow icon={Phone} label="+48 000 000 000" />
            <ContactRow icon={Mail} label="kontakt@natureworld.pl" />
            <ContactRow icon={MapPin} label="Sprzedaż internetowa, Polska" />
          </div>
        </div>
      </section>

      <CompanyFooter />
    </main>
  );
}

function CompanyHeader() {
  return (
    <header className="relative z-50 bg-background shadow-md">
      <div className="max-w-7xl mx-auto flex items-center gap-4 px-4 py-3">
        <Link href="/" className="shrink-0">
          <Image
            src="/api/image/logo.webp"
            alt="Nature World"
            width={180}
            height={45}
            priority
          />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-6 md:flex">
          <Link
            className="text-sm font-semibold text-primary"
            href="/aktualnosci"
          >
            Aktualności
          </Link>
          <a
            className="text-sm font-semibold text-text-secondary transition hover:text-primary"
            href="#oferta"
          >
            Oferta
          </a>
          <a
            className="text-sm font-semibold text-text-secondary transition hover:text-primary"
            href="#onas"
          >
            O nas
          </a>
          <a
            className="text-sm font-semibold text-text-secondary transition hover:text-primary"
            href="#kontakt"
          >
            Kontakt
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href={facebookUrl}
            target="_blank"
            aria-label="Facebook"
            className="hidden rounded-full bg-white p-3 text-primary shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:inline-flex"
          >
            <Facebook size={18} />
          </Link>
          <Link
            href={facebookUrl}
            target="_blank"
            aria-label="Instagram"
            className="hidden rounded-full bg-white p-3 text-primary shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:inline-flex"
          >
            <Instagram size={18} />
          </Link>
          <Link
            href={allegroUrl}
            target="_blank"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            <Search size={16} />
            Oferta
          </Link>
        </div>
      </div>

      <div className="bg-primary">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white">
          <Newspaper size={17} />
          <span>Aktualności Nature World</span>
        </div>
      </div>
    </header>
  );
}

function FeaturedNews({
  post,
  loading,
}: {
  post: NewsPost;
  loading: boolean;
}) {
  const image = post.images?.[0] ?? fallbackImage;

  return (
    <article className="group overflow-hidden rounded-3xl bg-white/80 shadow-sm transition hover:shadow-xl">
      <Link href={`/aktualnosci#${post.slug}`} className="block">
        <div className="relative aspect-[16/9] bg-white">
          <Image
            src={`/api/image/${image}`}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 65vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute left-5 top-5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white">
            {loading ? "Ładowanie..." : "Najnowsze"}
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <CalendarDays size={16} className="text-primary" />
            {formatDate(post.publishedAt)}
          </div>
          <h1 className="mt-4 text-3xl font-semibold leading-tight transition group-hover:text-primary md:text-5xl">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mt-5 max-w-3xl text-lg leading-8 text-text-secondary">
              {post.excerpt}
            </p>
          )}
          <span className="mt-7 inline-flex items-center gap-2 font-semibold text-primary">
            Czytaj aktualność
            <ArrowRight size={18} />
          </span>
        </div>
      </Link>
    </article>
  );
}

function SmallNewsItem({ post }: { post: NewsPost }) {
  return (
    <Link href={`/aktualnosci#${post.slug}`} className="group flex gap-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-background">
        <Image
          src={`/api/image/${post.images?.[0] ?? fallbackImage}`}
          alt=""
          fill
          sizes="80px"
          className="object-cover transition group-hover:scale-105"
        />
      </div>
      <div>
        <p className="line-clamp-2 font-semibold leading-snug group-hover:text-primary">
          {post.title}
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          {formatDate(post.publishedAt)}
        </p>
      </div>
    </Link>
  );
}

function CompanyFooter() {
  return (
    <footer className="mt-12 bg-white/80 shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
      <div className="max-w-7xl mx-auto grid gap-10 px-4 py-12 md:grid-cols-[1.15fr_0.8fr_1fr_1fr]">
        <div>
          <Link href="/" className="inline-flex">
            <Image
              src="/api/image/logo.webp"
              alt="Nature World"
              width={180}
              height={45}
            />
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-7 text-text-secondary">
            Nature World to sklep ogrodniczo-zoologiczny rozwijany wokół
            aktualności, sezonowej oferty i wygodnych zakupów online.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href={facebookUrl}
              target="_blank"
              aria-label="Facebook"
              className="rounded-full bg-background p-3 text-primary transition hover:bg-primary hover:text-white"
            >
              <Facebook size={18} />
            </Link>
            <Link
              href={facebookUrl}
              target="_blank"
              aria-label="Instagram"
              className="rounded-full bg-background p-3 text-primary transition hover:bg-primary hover:text-white"
            >
              <Instagram size={18} />
            </Link>
          </div>
        </div>

        <div>
          <h2 className="font-semibold">Menu</h2>
          <nav className="mt-5 grid gap-3 text-sm text-text-secondary">
            <Link href="/aktualnosci" className="hover:text-primary">
              Aktualności
            </Link>
            <a href="#oferta" className="hover:text-primary">
              Oferta
            </a>
            <a href="#onas" className="hover:text-primary">
              O nas
            </a>
            <a href="#kontakt" className="hover:text-primary">
              Kontakt
            </a>
            <Link href={allegroUrl} target="_blank" className="hover:text-primary">
              Allegro
            </Link>
          </nav>
        </div>

        <div>
          <h2 className="font-semibold">Oferta</h2>
          <ul className="mt-5 grid gap-3 text-sm text-text-secondary">
            <li>Ogród, rośliny i nasiona</li>
            <li>Nawozy, podłoża i preparaty</li>
            <li>Doniczki, osłonki i dekoracje</li>
            <li>Produkty dla psów i kotów</li>
            <li>Akwarystyka i akcesoria</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold">Kontakt</h2>
          <div className="mt-5 grid gap-3 text-sm text-text-secondary">
            <p className="flex items-center gap-2">
              <Phone className="text-primary" size={16} />
              +48 000 000 000
            </p>
            <p className="flex items-center gap-2">
              <Mail className="text-primary" size={16} />
              kontakt@natureworld.pl
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="text-primary" size={16} />
              Sprzedaż internetowa, Polska
            </p>
            <p className="flex items-center gap-2">
              <Clock className="text-primary" size={16} />
              Obsługa online
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-black/5">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 px-4 py-6 text-sm text-text-secondary md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Nature World. Wszelkie prawa zastrzeżone.</p>
          <div className="flex flex-wrap gap-4">
            <span className="inline-flex items-center gap-2">
              <Truck size={16} className="text-primary" />
              Wysyłka przez kanał sprzedaży
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={16} className="text-primary" />
              Zakupy na Allegro
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function NewsCard({ post }: { post: NewsPost }) {
  return (
    <Link
      href={`/aktualnosci#${post.slug}`}
      className="group overflow-hidden rounded-2xl bg-white/80 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-video bg-white">
        <Image
          src={`/api/image/${post.images?.[0] ?? fallbackImage}`}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, 100vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
      </div>

      <div className="p-6">
        <p className="flex items-center gap-2 text-sm text-text-secondary">
          <CalendarDays size={15} className="text-primary" />
          {formatDate(post.publishedAt)}
        </p>
        <h3 className="mt-3 text-xl font-semibold leading-snug group-hover:text-primary">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mt-3 line-clamp-3 text-sm leading-7 text-text-secondary">
            {post.excerpt}
          </p>
        )}
      </div>
    </Link>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-3xl font-semibold leading-tight md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 leading-8 text-text-secondary">{description}</p>
      )}
    </div>
  );
}

function CategoryCard({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-2xl bg-white/80 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Icon className="text-primary" size={30} />
      <h3 className="mt-5 text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-text-secondary">{text}</p>
    </article>
  );
}

function ContactRow({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 text-white">
      <Icon className="shrink-0" size={20} />
      <span className="font-medium">{label}</span>
    </div>
  );
}

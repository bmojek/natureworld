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
  Dog,
  Facebook,
  Fish,
  Flower2,
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
  Waves,
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

const facebookUrl = "https://www.facebook.com/p/Nature-World-61573608614787/";
const allegroUrl = "https://allegro.pl/uzytkownik/nature-world";
const phoneNumber = "14 650 15 01";
const emailAddress = "biuro@nature-world.pl";
const storeAddress = "Oświatowa 2, 33-111 Koszyce Małe";
const openingHours = "Pn-Pt 9:00-18:00, Sob 9:00-15:00";
const mapsUrl =
  "https://www.google.com/maps/place/O%C5%9Bwiatowa+2,+33-111+Koszyce+Ma%C5%82e";
const fallbackImage = "banerwide2.webp";

const fallbackPosts: NewsPost[] = [
  {
    id: "start",
    title: "Nowości w Nature World",
    slug: "startujemy-z-firmowa-strona",
    excerpt:
      "Sprawdzaj aktualne informacje o produktach do ogrodu, domu i dla zwierząt.",
    images: ["banerwide2.webp"],
    publishedAt: Date.now(),
  },
  {
    id: "sezon",
    title: "Produkty sezonowe dla domu i ogrodu",
    slug: "produkty-sezonowe",
    excerpt:
      "Praktyczne propozycje na balkon, ogród, dom i najważniejsze prace sezonowe.",
    images: ["bilbordsharp.webp"],
    publishedAt: Date.now(),
  },
  {
    id: "allegro",
    title: "Oferta w sklepie Nature World",
    slug: "oferta-na-allegro",
    excerpt:
      "Zobacz dostępne produkty i wybierz artykuły dopasowane do swoich potrzeb.",
    images: ["main_onas2.webp"],
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
    image: "main_ogrod.webp",
    items: [
      "nasiona warzyw, ziół i roślin ozdobnych",
      "nawozy i preparaty",
      "podłoża oraz ziemie",
      "doniczki, osłonki i pojemniki",
    ],
  },
  {
    title: "Zwierzęta",
    image: "main_zwierzeta.webp",
    items: [
      "produkty dla psów",
      "produkty dla kotów",
      "akwarystyka",
      "praktyczne akcesoria dla pupili",
    ],
  },
  {
    title: "Dom i sezon",
    image: "main_dom.webp",
    items: [
      "dekoracje i ozdoby",
      "florystyka",
      "produkty okazjonalne",
      "nowości dostępne w sklepie",
    ],
  },
];

const storeFacts = [
  {
    icon: Store,
    title: "Szeroki wybór produktów",
    text: "W jednym miejscu znajdziesz artykuły ogrodnicze, dekoracyjne, sezonowe i zoologiczne.",
  },
  {
    icon: ShoppingBag,
    title: "Wygodne zakupy online",
    text: "Aktualną ofertę Nature World możesz sprawdzić i zamówić bezpośrednio przez Allegro.",
  },
  {
    icon: Newspaper,
    title: "Nowości i inspiracje",
    text: "Regularnie pokazujemy produkty sezonowe, praktyczne wskazówki i propozycje warte uwagi.",
  },
];

const servicePoints = [
  "produkty ogrodnicze i akcesoria do roślin",
  "dekoracje domowe, ozdoby i dodatki sezonowe",
  "asortyment zoologiczny dla zwierząt",
  "zakupy stacjonarne, Allegro i dostawy",
];

const gardenSeason = [
  {
    title: "Wysiew i rozsady",
    text: "Nasiona warzyw, ziół i roślin ozdobnych, które dobrze pasują do wiosennego startu sezonu.",
  },
  {
    title: "Pielęgnacja roślin",
    text: "Nawozy, preparaty, podłoża i ziemie do codziennej opieki nad roślinami domowymi i ogrodowymi.",
  },
  {
    title: "Doniczki i dekoracje",
    text: "Doniczki, osłonki, pojemniki, ozdoby oraz dodatki florystyczne do domu, balkonu i ogrodu.",
  },
  {
    title: "Produkty sezonowe",
    text: "Artykuły okazjonalne, dekoracje i nowości dopasowane do aktualnej pory roku.",
  },
];

const petZones = [
  {
    icon: Dog,
    title: "Dla psów",
    text: "Karmy, przysmaki, zabawki i praktyczne akcesoria dla codziennej opieki nad psem.",
  },
  {
    icon: PawPrint,
    title: "Dla kotów",
    text: "Produkty dla kotów: od podstawowej opieki po dodatki poprawiające komfort pupila.",
  },
  {
    icon: Fish,
    title: "Akwarystyka",
    text: "Asortyment akwarystyczny i drobne akcesoria dla osób rozwijających domowe akwarium.",
  },
];

const newsTopics = [
  "nowe dostawy i produkty w ofercie",
  "sezonowe porady ogrodnicze",
  "propozycje dla psów, kotów i akwarystyki",
  "informacje o promocjach i sprzedaży online",
  "krótkie inspiracje dla domu, balkonu i ogrodu",
  "komunikaty organizacyjne Nature World",
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

  const homepagePosts = useMemo(() => visiblePosts.slice(0, 6), [visiblePosts]);

  const featured = visiblePosts[0];
  const secondaryPosts = visiblePosts.slice(1, 4);

  return (
    <main className="min-h-screen bg-background">
      <CompanyHeader />

      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <FeaturedNews post={featured} loading={loading} />

          <aside className="grid gap-4">
            <div className="animate-fade-up rounded-3xl bg-primary p-7 text-white shadow-sm [animation-delay:120ms]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
                Nature World
              </p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight !text-white">
                Aktualności, nowości i ważne informacje
              </h1>
              <p className="mt-5 leading-7 text-white/80">
                Sprawdzaj nowe produkty, sezonowe inspiracje, porady ogrodnicze
                oraz informacje o ofercie dla domu i zwierząt.
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

            <div className="animate-fade-up rounded-3xl bg-white/80 p-6 shadow-sm [animation-delay:220ms]">
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

      <section id="aktualnosci" className="animate-fade-up max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionHeader
            eyebrow="Aktualności"
            title="Wszystko, co nowe w Nature World"
            description="Nowości produktowe, sezonowe inspiracje i praktyczne informacje dla osób, które dbają o ogród, dom oraz swoich pupili."
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
          {homepagePosts.map((post) => (
            <NewsCard key={post.id} post={post} />
          ))}
        </div>
      </section>

      <section id="oferta" className="max-w-7xl mx-auto px-4 py-12">
        <SectionHeader
          eyebrow="Oferta"
          title="Krótko o tym, czym się zajmujemy"
          description="Nature World łączy artykuły ogrodnicze, dekoracje domowe, produkty sezonowe oraz asortyment zoologiczny."
        />

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((item) => (
            <CategoryCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid gap-6 lg:grid-cols-3">
          {offerGroups.map((group, index) => (
            <article
              key={group.title}
              className="animate-fade-up group overflow-hidden rounded-3xl bg-white/80 shadow-sm ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-primary/20"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="relative aspect-[3/2] bg-white">
                <Image
                  src={`/api/image/${group.image}`}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-contain transition duration-300 group-hover:scale-105"
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

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <SectionHeader
              eyebrow="Sezon w ogrodzie"
              title="Od nasion po dekoracje"
              description="Wybierz produkty do wysiewu, pielęgnacji roślin, przesadzania, dekorowania domu oraz przygotowania ogrodu na kolejne etapy sezonu."
            />
            <Link
              href="/aktualnosci"
              className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              Zobacz sezonowe wpisy
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {gardenSeason.map((item, index) => (
              <article
                key={item.title}
                className="animate-fade-up rounded-3xl bg-white/80 p-6 shadow-sm ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-primary/20"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {index === 0 && <Sprout size={22} />}
                  {index === 1 && <Waves size={22} />}
                  {index === 2 && <Flower2 size={22} />}
                  {index === 3 && <Sparkles size={22} />}
                </div>
                <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-text-secondary">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="rounded-3xl bg-white/80 p-5 shadow-sm md:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-background">
              <Image
                src="/api/image/strefa_zwierzak.webp"
                alt="Produkty zoologiczne Nature World"
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover transition duration-300 hover:scale-105"
              />
            </div>

            <div>
              <SectionHeader
                eyebrow="Strefa zwierząt"
                title="Produkty dla pupili i akwarystyki"
                description="W ofercie znajdziesz produkty dla psów i kotów, praktyczne akcesoria dla pupili oraz artykuły akwarystyczne."
              />

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {petZones.map(({ icon: Icon, title, text }) => (
                  <article
                    key={title}
                    className="rounded-2xl bg-background p-5 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-sm"
                  >
                    <Icon className="text-primary" size={28} />
                    <h3 className="mt-4 font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-text-secondary">
                      {text}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="onas" className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid gap-8 rounded-3xl bg-white/80 p-5 shadow-sm md:p-8 lg:grid-cols-2 lg:items-center">
          <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-background">
            <Image
              src="/api/image/main_onas3.webp"
              alt="Nature World"
              fill
              sizes="(min-width: 1024px) 33vw, 100vw"
              className="object-cover transition duration-300 hover:scale-105"
            />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              O nas
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight md:text-4xl">
              Różnorodny asortyment dla domu, ogrodu i zwierząt
            </h2>
            <p className="mt-5 leading-8 text-text-secondary">
              Nature World to sklep z szerokim, praktycznym asortymentem: od
              produktów ogrodniczych i akcesoriów do roślin, przez dekoracje
              domowe i sezonowe, aż po artykuły zoologiczne dla zwierząt. Na
              stronie pokazujemy przede wszystkim aktualności, nowości i
              kategorie, które najlepiej oddają charakter sklepu.
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
          eyebrow="Dlaczego Nature World?"
          title="Praktyczna oferta do codziennych potrzeb"
          description="Łączymy produkty do ogrodu, domu i opieki nad zwierzętami, żeby łatwiej znaleźć potrzebne artykuły w jednym miejscu."
        />

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {storeFacts.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="animate-fade-up rounded-3xl bg-white/80 p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <Icon className="text-primary" size={32} />
              <h3 className="mt-5 text-xl font-semibold">{title}</h3>
              <p className="mt-3 leading-7 text-text-secondary">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid gap-8 rounded-3xl bg-white/80 p-6 shadow-sm md:p-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeader
              eyebrow="Porady i inspiracje"
              title="Pomysły na ogród, dom i opiekę nad zwierzętami"
              description="Aktualności pomagają szybko znaleźć nowości, sezonowe propozycje oraz praktyczne wskazówki przy wyborze produktów."
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {newsTopics.map((topic) => (
              <div
                key={topic}
                className="flex gap-3 rounded-2xl bg-background p-4 text-sm font-medium leading-6"
              >
                <Newspaper className="mt-0.5 shrink-0 text-primary" size={18} />
                {topic}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="kontakt" className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-fade-up overflow-hidden rounded-3xl bg-primary text-white shadow-xl">
          <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[0.95fr_1.05fr] lg:p-10">
            <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
              Kontakt
            </p>
            <h2 className="mt-3 text-3xl font-semibold !text-white md:text-4xl">
              Chcesz zapytać o ofertę?
            </h2>
            <p className="mt-5 max-w-2xl leading-8 text-white/80">
              Odwiedź nas w Koszycach Małych, zadzwoń albo sprawdź aktualną
              ofertę online. Chętnie pomożemy w wyborze produktów do ogrodu,
              domu i dla zwierząt.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`tel:${phoneNumber.replaceAll(" ", "")}`}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-primary transition hover:bg-white/90"
              >
                <Phone size={17} />
                Zadzwoń
              </Link>
              <Link
                href={mapsUrl}
                target="_blank"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/45 px-6 text-sm font-semibold text-white transition hover:bg-white hover:text-primary"
              >
                <MapPin size={17} />
                Pokaż na mapie
              </Link>
            </div>
          </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <ContactRow
                icon={Phone}
                label={phoneNumber}
                href={`tel:${phoneNumber.replaceAll(" ", "")}`}
              />
              <ContactRow
                icon={Mail}
                label={emailAddress}
                href={`mailto:${emailAddress}`}
              />
              <ContactRow icon={MapPin} label={storeAddress} href={mapsUrl} />
              <ContactRow icon={Clock} label={openingHours} />
            </div>
          </div>

          <div className="border-t border-white/15 bg-black/10 px-6 py-4 text-sm text-white/75 md:px-8 lg:px-10">
            Sklep stacjonarny, sprzedaż przez Allegro i wygodne formy dostawy.
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

function FeaturedNews({ post, loading }: { post: NewsPost; loading: boolean }) {
  const image = post.images?.[0] ?? fallbackImage;

  return (
    <article className="animate-fade-up group overflow-hidden rounded-3xl bg-white/80 shadow-sm transition hover:shadow-xl">
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
            Nature World to sklep ogrodniczo-zoologiczny z ofertą stacjonarną i
            online, rozwijany wokół sezonowych produktów, praktycznych
            inspiracji i wygodnych zakupów.
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
            <Link
              href={allegroUrl}
              target="_blank"
              className="hover:text-primary"
            >
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
              {phoneNumber}
            </p>
            <p className="flex items-center gap-2">
              <Mail className="text-primary" size={16} />
              {emailAddress}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="text-primary" size={16} />
              {storeAddress}
            </p>
            <p className="flex items-center gap-2">
              <Clock className="text-primary" size={16} />
              {openingHours}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-black/5">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 px-4 py-6 text-sm text-text-secondary md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} Nature World. Wszelkie prawa
            zastrzeżone.
          </p>
          <div className="flex flex-wrap gap-4">
            <span className="inline-flex items-center gap-2">
              <Truck size={16} className="text-primary" />
              Sklep stacjonarny
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={16} className="text-primary" />
              Allegro i dostawa
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
      className="animate-fade-up group overflow-hidden rounded-2xl bg-white/80 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
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
    <article className="animate-fade-up rounded-2xl bg-white/80 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Icon className="text-primary" size={30} />
      <h3 className="mt-5 text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-text-secondary">{text}</p>
    </article>
  );
}

function ContactRow({
  icon: Icon,
  label,
  href,
}: {
  icon: LucideIcon;
  label: string;
  href?: string;
}) {
  const content = (
    <>
      <Icon className="shrink-0" size={20} />
      <span className="font-medium">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 text-white transition hover:-translate-y-0.5 hover:bg-white/20"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 text-white">
      {content}
    </div>
  );
}

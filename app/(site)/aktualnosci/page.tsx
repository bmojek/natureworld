import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";

async function fetchNews() {
  const h = await headers();

  const host = h.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  const res = await fetch(`${protocol}://${host}/api/posts?type=news`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) return [];

  return res.json();
}

export default async function NewsPage() {
  const posts = await fetchNews();

  return (
    <main className="bg-background">
      <section className="max-w-6xl mx-auto px-6 py-14">
        <h1 className="text-4xl font-heading mb-10">Aktualności</h1>

        {posts.length === 0 && (
          <p className="text-text-secondary">Brak aktualności</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((p: any) => (
            <Link
              key={p.id}
              href={`/aktualnosci/${p.slug}`}
              className="bg-white rounded-2xl overflow-hidden hover:shadow-md transition"
            >
              {p.images?.[0] && (
                <Image
                  src={`/api/image/${p.images[0]}`}
                  alt={p.title}
                  width={400}
                  height={300}
                  className="w-full h-48 object-cover"
                />
              )}

              <div className="p-4">
                <h2 className="font-semibold text-lg mb-2">{p.title}</h2>

                {p.excerpt && (
                  <p className="text-sm text-text-secondary">{p.excerpt}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

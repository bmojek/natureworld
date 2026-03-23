import { headers } from "next/headers";
import Image from "next/image";

async function fetchPost(slug: string) {
  const h = await headers();

  const host = h.get("host");

  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  const res = await fetch(`${protocol}://${host}/api/post?slug=${slug}`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) return null;

  return res.json();
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const post = await fetchPost(slug);

  if (!post) {
    return <div className="p-20 text-center">Nie znaleziono posta</div>;
  }

  return (
    <main className="bg-background">
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-heading mb-4">{post.title}</h1>

        {post.publishedAt && (
          <p className="text-sm text-text-secondary mb-6">
            {new Date(post.publishedAt).toLocaleDateString()}
          </p>
        )}

        {post.images?.[0] && (
          <div className="relative w-full aspect-video mb-6 rounded-xl overflow-hidden">
            <Image
              src={`/api/image/${post.images[0]}`}
              alt={post.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        {post.excerpt && (
          <p className="text-lg mb-6 text-text-secondary">{post.excerpt}</p>
        )}

        {post.content && (
          <div className="prose max-w-none mb-10">{post.content}</div>
        )}

        {post.images?.length > 1 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {post.images.slice(1).map((img: string, i: number) => (
              <div
                key={i}
                className="relative aspect-square rounded-lg overflow-hidden"
              >
                <Image
                  src={`/api/image/${img}`}
                  alt={post.title}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

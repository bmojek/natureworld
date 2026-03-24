import Image from "next/image";
import { headers } from "next/headers";
import PostGallery from "@/app/components/Gallery/PostGallery";
async function fetchPosts() {
  const h = await headers();

  const host = h.get("host");

  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  const res = await fetch(`${protocol}://${host}/api/posts?type=news`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) return [];

  return res.json();
}
function formatDate(date: any) {
  if (!date) return "";

  if (date.seconds) {
    return new Date(date.seconds * 1000).toLocaleDateString();
  }

  if (date._seconds) {
    return new Date(date._seconds * 1000).toLocaleDateString();
  }

  if (date.toDate) {
    return date.toDate().toLocaleDateString();
  }

  return new Date(date).toLocaleDateString();
}
export default async function NewsPage() {
  const posts = await fetchPosts();

  return (
    <main className="bg-background">
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-heading mb-10">Aktualności</h1>

        <div className="space-y-14">
          {posts.map((post: any) => (
            <article id={post.slug} key={post.id}>
              {/* TITLE */}

              <h2 className="text-2xl font-semibold mb-2">{post.title}</h2>

              {/* DATE */}

              {post.publishedAt && (
                <p className="text-sm text-text-secondary mb-4">
                  {formatDate(post.publishedAt)}
                </p>
              )}
              {post.excerpt && (
                <div className="mb-4 whitespace-pre-line leading-relaxed">
                  {post.excerpt}
                </div>
              )}
              {/* TEXT */}

              {post.content && (
                <div className="mb-4 whitespace-pre-line leading-relaxed">
                  {post.content}
                </div>
              )}

              {post.images?.length > 0 && <PostGallery images={post.images} />}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

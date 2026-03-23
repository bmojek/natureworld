"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  images?: string[];
};

export default function PostsSnippet({
  type = "news",
  title = "Aktualności",
  href = "/aktualnosci",
}: {
  type?: string;
  title?: string;
  href?: string;
}) {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetch(`/api/posts?type=${type}`)
      .then((r) => r.json())
      .then(setPosts);
  }, [type]);

  if (!posts.length) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">{title}</h2>

        <Link href={href} className="text-primary text-sm font-medium">
          Zobacz wszystkie →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {posts.slice(0, 3).map((post) => (
          <Link
            key={post.id}
            href={`${href}/${post.slug}`}
            className="border rounded-xl overflow-hidden hover:shadow transition bg-white"
          >
            {post.images?.[0] && (
              <div className="relative aspect-video">
                <Image
                  src={`/api/image/${post.images[0]}`}
                  alt={post.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div className="p-4">
              <h3 className="font-semibold line-clamp-2">{post.title}</h3>

              {post.excerpt && (
                <p className="text-sm text-text-secondary mt-2 line-clamp-3">
                  {post.excerpt}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

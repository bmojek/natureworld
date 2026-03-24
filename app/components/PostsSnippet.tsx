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
    <section className="space-y-6">
      {/* HEADER */}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>

        <Link href={href} className="text-sm text-primary hover:underline">
          Zobacz wszystkie
        </Link>
      </div>

      {/* LIST */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {posts.slice(0, 3).map((post) => (
          <Link
            key={post.id}
            href={`${href}#${post.slug}`}
            className="group block"
          >
            {/* IMAGE */}

            {post.images?.[0] && (
              <div className="relative aspect-video bg-white mb-3">
                <Image
                  src={`/api/image/${post.images[0]}`}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:opacity-90 transition"
                />
              </div>
            )}

            {/* TITLE */}

            <h3 className="font-medium leading-snug group-hover:text-primary">
              {post.title}
            </h3>

            {/* EXCERPT */}

            {post.excerpt && (
              <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                {post.excerpt}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

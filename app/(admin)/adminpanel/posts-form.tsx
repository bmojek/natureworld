"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { uploadPostImagesToR2 } from "@/app/lib/upload-post-images";
import PostImageUploader from "@/app/components/ImageUploader/PostImageUploader";
import { PostImage } from "@/app/components/ImageUploader/post-types";
function slugify(text: string) {
  const map: Record<string, string> = {
    ą: "a",
    ć: "c",
    ę: "e",
    ł: "l",
    ń: "n",
    ó: "o",
    ś: "s",
    ż: "z",
    ź: "z",
  };

  return text
    .toLowerCase()
    .trim()
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "") // ← usuń z początku
    .replace(/-+$/, ""); // ← usuń z końca
}
export default function PostsForm() {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");

  const [type, setType] = useState<"news" | "article">("news");

  const [images, setImages] = useState<PostImage[]>([]);

  const [published, setPublished] = useState(true);

  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!title) {
      alert("Podaj tytuł");
      return;
    }

    setLoading(true);

    const slug = slugify(title);

    const uploaded = await uploadPostImagesToR2(images);

    await addDoc(collection(db, "posts"), {
      title,
      slug,

      excerpt,
      content,

      type,

      images: uploaded,

      isPublished: published,

      createdAt: serverTimestamp(),
      publishedAt: serverTimestamp(),
    });

    setLoading(false);

    setTitle("");
    setExcerpt("");
    setContent("");
    setImages([]);

    alert("Post dodany");
  };

  return (
    <section className="max-w-3xl space-y-6">
      <h2 className="text-xl font-semibold">Dodaj post</h2>

      {/* TYPE */}

      <select
        value={type}
        onChange={(e) => setType(e.target.value as any)}
        className="border p-3"
      >
        <option value="news">Aktualność</option>

        <option value="article">Artykuł / poradnik</option>
      </select>

      {/* TITLE */}

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Tytuł"
        className="border p-3 w-full"
      />

      {/* EXCERPT */}

      <textarea
        value={excerpt}
        onChange={(e) => setExcerpt(e.target.value)}
        placeholder="Krótki opis"
        rows={2}
        className="border p-3 w-full"
      />

      {/* CONTENT */}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Treść"
        rows={8}
        className="border p-3 w-full"
      />

      {/* IMAGES */}

      <PostImageUploader slug={slugify(title)} onChange={setImages} />

      {/* PUBLISHED */}

      <label className="flex gap-2">
        <input
          type="checkbox"
          checked={published}
          onChange={() => setPublished(!published)}
        />
        Opublikowany
      </label>

      <button
        onClick={submit}
        disabled={loading}
        className="bg-primary text-white px-6 py-3 rounded-xl"
      >
        {loading ? "Zapisywanie..." : "Dodaj post"}
      </button>
    </section>
  );
}

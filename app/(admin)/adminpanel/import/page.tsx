"use client";

import { useState } from "react";

export default function ImportPage() {
  const [loading, setLoading] = useState(false);

  const upload = async (file: File) => {
    setLoading(true);

    const form = new FormData();

    form.append("file", file);

    const res = await fetch("/api/import-categories", {
      method: "POST",
      body: form,
    });

    const data = await res.json();

    console.log(data);

    setLoading(false);
  };

  return (
    <div className="p-10 space-y-4">
      <h1 className="text-xl font-bold">Import kategorii z Allegro</h1>

      <input
        type="file"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            upload(e.target.files[0]);
          }
        }}
      />

      {loading && <p>Import...</p>}
    </div>
  );
}

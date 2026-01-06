"use client";

import { useState } from "react";

type AuthFormProps = {
  onSubmit: (email: string, password: string) => Promise<void>;
  submitLabel: string;
};

export default function AuthForm({ onSubmit, submitLabel }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onSubmit(email, password);
    } catch (err: any) {
      setError(err.message || "Wystąpił błąd");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-sm w-full flex flex-col gap-4"
    >
      {error && <p className="text-red-500">{error}</p>}
      <input
        type="email"
        placeholder="Email"
        className="border rounded-lg p-2"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Hasło"
        className="border rounded-lg p-2"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button
        type="submit"
        className="bg-primary text-background p-2 rounded-lg hover:bg-accent disabled:opacity-50"
        disabled={loading}
      >
        {submitLabel}
      </button>
    </form>
  );
}

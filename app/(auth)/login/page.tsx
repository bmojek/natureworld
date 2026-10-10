"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch {
      setError("Nieprawidłowy email lub hasło");
    }
  };

  return (
    <main className="flex min-h-[55vh] justify-center px-4 py-10 md:py-16">
      <div className="w-full max-w-md self-start rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
        <div className="mb-6 flex">
          <Link
            href="/login"
            className="flex-1 text-center py-3 font-medium border-b-2 border-primary text-primary"
          >
            Logowanie
          </Link>
          <Link
            href="/register"
            className="flex-1 text-center py-3 font-medium border-b-2 border-transparent text-text-secondary hover:text-primary"
          >
            Rejestracja
          </Link>
        </div>

        <h1 className="mb-5 text-2xl font-semibold text-[#173d2b]">Zaloguj się</h1>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="login-email" className="mb-1 block text-sm">Adres e-mail</label>
            <input
              id="login-email"
              type="email"
              className="w-full rounded-xl border border-black/15 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="login-password" className="mb-1 block text-sm">Hasło</label>
            <div className="relative">
              <input
                id="login-password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                className="w-full rounded-xl border border-black/15 px-4 py-3 pr-12 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                aria-label={show ? "Ukryj hasło" : "Pokaż hasło"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary cursor-pointer"
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              min. 6, max. 70 znaków
            </p>
          </div>
          {error && <p role="alert" className="text-center text-sm font-medium text-red-800">{error}</p>}
          <button className="min-h-12 w-full rounded-full bg-primary py-3 font-semibold text-white transition hover:bg-[#24652a]">
            Zaloguj się
          </button>

        </form>
      </div>
    </main>
  );
}

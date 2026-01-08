"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
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
    <main className="flex justify-center px-4 py-5">
      <div className="w-full max-w-md rounded-2xl  p-8">
        <div className="relative flex items-center justify-center mb-6">
          <ArrowLeft
            size={24}
            onClick={() => router.push("/")}
            className="absolute left-0 text-text-secondary hover:text-primary cursor-pointer"
          />

          <Link href="/" className="relative w-40 h-16">
            <Image
              src="/api/image/logot.webp"
              alt="Logo NatureWorld"
              fill
              className="object-contain"
              priority
            />
          </Link>
        </div>

        <div className="flex mb-6">
          <Link
            href="/login"
            className="flex-1 text-center py-3 font-medium border-b-2 border-primary text-primary"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="flex-1 text-center py-3 font-medium border-b-2 border-transparent text-text-secondary hover:text-primary"
          >
            Rejestracja
          </Link>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm mb-1">Adres e-mail</label>
            <input
              type="email"
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Hasło</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                autoComplete="current-password"
                className="w-full border rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-primary outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary cursor-pointer"
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              min. 6, max. 70 znaków
            </p>
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button className="w-full bg-primary text-white py-3 rounded-full font-semibold hover:bg-green-700 transition cursor-pointer">
            Zaloguj się
          </button>

          <div className="text-center">
            <Link
              href="/reset-password"
              className="text-sm text-primary hover:underline"
            >
              Nie pamiętam hasła
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

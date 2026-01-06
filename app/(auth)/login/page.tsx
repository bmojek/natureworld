"use client";

import AuthForm from "@/app//components/AuthForm";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/app//lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    router.push("/"); // po zalogowaniu przeniesienie na home
  };

  return (
    <main className=" flex  justify-center bg-background text-textMain">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-primary mb-4">Zaloguj się</h1>
        <AuthForm onSubmit={handleLogin} submitLabel="Zaloguj" />
        <p className="mt-4 text-textSecondary text-sm">
          Nie masz konta?{" "}
          <a href="/register" className="text-primary">
            Zarejestruj się
          </a>
        </p>
        <p className="mt-2 text-textSecondary text-sm">
          Zapomniałeś hasła?{" "}
          <a href="/reset-password" className="text-primary">
            Resetuj
          </a>
        </p>
      </div>
    </main>
  );
}

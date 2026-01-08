"use client";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { useAuth } from "@/app/context/auth-context";
export default function KontoPage() {
  const { user } = useAuth();
  return (
    <ProtectedRoute>
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold">Moje konto</h1>
        <p className="mt-4">Tutaj możesz zarządzać swoim kontem.</p>
        <p>{user?.email}</p>
      </div>
    </ProtectedRoute>
  );
}

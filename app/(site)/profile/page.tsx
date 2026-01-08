import ProtectedRoute from "@/app/components/ProtectedRoute";

export default function KontoPage() {
  return (
    <ProtectedRoute>
      <div className="p-8">
        <h1 className="text-3xl font-bold">Moje konto</h1>
      </div>
    </ProtectedRoute>
  );
}

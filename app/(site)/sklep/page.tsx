import type { Metadata } from "next";
import ShopCatalog from "./ShopCatalog";

export const metadata: Metadata = {
  title: "Sklep internetowy",
  description: "Przeglądaj katalog Nature-World: produkty dla zwierząt, ogrodu i domu. Sprawdź dostępność, ceny i wygodną dostawę kurierem.",
  alternates: { canonical: "/sklep" },
};

export default function ShopPage() {
  return <ShopCatalog />;
}

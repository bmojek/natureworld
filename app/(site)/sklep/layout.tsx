import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sklep internetowy",
  description: "Przeglądaj produkty dla zwierząt, ogrodu i domu w sklepie internetowym Nature-World.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}

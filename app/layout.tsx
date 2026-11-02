import type { Metadata } from "next";
import { Poppins, Roboto } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/auth-context";
import { CartProvider } from "./context/cart-context";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://nature-world.pl"),
  title: {
    default: "Nature-World — sklep dla domu, ogrodu i zwierząt",
    template: "%s | Nature-World",
  },
  description: "Kupuj online produkty dla zwierząt, domu i ogrodu. Sprawdź ofertę Nature-World, dostępność, dostawę i aktualności sklepu.",
  applicationName: "Nature-World",
  openGraph: {
    type: "website",
    locale: "pl_PL",
    siteName: "Nature-World",
    title: "Nature-World — sklep dla domu, ogrodu i zwierząt",
    description: "Produkty dla zwierząt, domu i ogrodu w sklepie Nature-World.",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={`${poppins.variable} ${roboto.variable} antialiased`}>
        <CartProvider>
          <AuthProvider>{children}</AuthProvider>
        </CartProvider>
      </body>
    </html>
  );
}

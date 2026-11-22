import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./context/auth-context";
import { CartProvider } from "./context/cart-context";
import { Analytics } from "@vercel/analytics/next";

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
    description: "Produkty dla zwierząt, domu i ogrodu w sklepie Nature-World. Przeglądaj katalog i sprawdź aktualną ofertę.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Nature-World — sklep dla domu, ogrodu i zwierząt" }],
  },
  twitter: { card: "summary_large_image", images: ["/opengraph-image"] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className="antialiased">
        <CartProvider>
          <AuthProvider>{children}</AuthProvider>
        </CartProvider>
        <Analytics />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "./context/auth-context";
import { CartProvider } from "./context/cart-context";
import { Analytics } from "@vercel/analytics/next";

const poppins = localFont({
  src: [
    { path: "../public/fonts/poppins-regular.ttf", weight: "400" },
    { path: "../public/fonts/poppins-semibold.ttf", weight: "600" },
    { path: "../public/fonts/poppins-bold.ttf", weight: "700" },
  ],
  variable: "--font-poppins",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});

const roboto = localFont({
  src: [
    { path: "../public/fonts/roboto-regular.ttf", weight: "400" },
    { path: "../public/fonts/roboto-medium.ttf", weight: "500" },
    { path: "../public/fonts/roboto-bold.ttf", weight: "700" },
  ],
  variable: "--font-roboto",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
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
      <body className={`${poppins.variable} ${roboto.variable} antialiased`}>
        <CartProvider>
          <AuthProvider>{children}</AuthProvider>
        </CartProvider>
        <Analytics />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Poppins, Roboto } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/auth-context";
import { Car } from "lucide-react";
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
  title: "Nature-World - Sklep Ogrodniczo-Zoologiczny",
  description: "Nature-World - Sklep Ogrodniczo-Zoologiczny",
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

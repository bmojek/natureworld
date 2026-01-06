import type { Metadata } from "next";
import { Poppins, Roboto } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/auth-context";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Categories from "./components/Categories";

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
  title: "Nature World",
  description: "NatureWorld - sklep zoologiczno-ogrodniczy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={`${poppins.variable} ${roboto.variable} antialiased`}>
        <AuthProvider>
          <Header />
          <Categories />
          <main className="flex-1 font-poppins">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      {/* <Categories /> */}
      {children}
      <Footer />
    </>
  );
}

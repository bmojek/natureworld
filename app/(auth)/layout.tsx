import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>
    <Header />
    {children}
    <Footer />
  </>;
}

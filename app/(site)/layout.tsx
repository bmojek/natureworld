import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>
    <Header />
    {children}
    <Footer />
  </>;
}

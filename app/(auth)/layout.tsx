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

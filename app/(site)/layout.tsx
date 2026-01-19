import Header from "../components/Header";
import Footer from "../components/Footer";
import Categories from "../components/Categories";

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

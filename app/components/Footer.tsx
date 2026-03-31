"use client";

import Link from "next/link";
import { Mail, Phone, Truck, ShieldCheck } from "lucide-react";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-background drop-shadow-2xl shadow-primary mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* ================= BRAND ================= */}
        <div className="space-y-4">
          <Link href="/" className="shrink-0 pb-2">
            <Image
              src="/api/image/logo.webp"
              alt="NatureWorld"
              width={180}
              height={45}
              priority
              className="pb-5"
            />
          </Link>
          <p className="text-sm text-text-secondary">
            Sklep ogrodniczy i zoologiczny oferujący produkty najwyższej jakości
            dla Twojego ogrodu i zwierząt.
          </p>

          <div className="flex flex-col gap-2 text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              <Phone size={16} />
              +48 123 456 789
            </div>

            <div className="flex items-center gap-2">
              <Mail size={16} />
              kontakt@natureworld.pl
            </div>
          </div>
        </div>

        {/* ================= SHOP ================= */}
        <div>
          <h3 className="font-semibold mb-4">Sklep</h3>

          <ul className="space-y-2 text-sm text-text-secondary">
            <li>
              <Link href="/kategoria/ogrod" className="hover:text-primary">
                Ogród
              </Link>
            </li>
            <li>
              <Link href="/kategoria/zwierzeta" className="hover:text-primary">
                Zwierzęta
              </Link>
            </li>
            <li>
              <Link href="/promocje" className="hover:text-primary">
                Promocje
              </Link>
            </li>
            <li>
              <Link href="/nowosci" className="hover:text-primary">
                Nowości
              </Link>
            </li>
          </ul>
        </div>

        {/* ================= INFO ================= */}
        <div>
          <h3 className="font-semibold mb-4">Informacje</h3>

          <ul className="space-y-2 text-sm text-text-secondary">
            <li>
              <Link href="/contact" className="hover:text-primary">
                Kontakt
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-primary">
                Regulamin
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-primary">
                Polityka prywatności
              </Link>
            </li>
            <li>
              <Link href="/returns" className="hover:text-primary">
                Zwroty i reklamacje
              </Link>
            </li>
          </ul>
        </div>

        {/* ================= TRUST ================= */}
        <div>
          <h3 className="font-semibold mb-4">Zakupy bez ryzyka</h3>

          <div className="space-y-3 text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              <Truck size={16} />
              Wysyłka 24–48h
            </div>

            <div className="flex items-center gap-2">
              <ShieldCheck size={16} />
              Bezpieczne płatności
            </div>

            <div className="flex items-center gap-2">✔ 14 dni na zwrot</div>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM ================= */}

      <div className="shadow-2xl shadow-primary">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center text-sm text-text-secondary">
          <p>
            © {new Date().getFullYear()} NatureWorld — Wszelkie prawa
            zastrzeżone
          </p>

          <div className="flex gap-6 mt-3 md:mt-0">
            <span>Visa</span>
            <span>Mastercard</span>
            <span>BLIK</span>
            <span>PayU</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

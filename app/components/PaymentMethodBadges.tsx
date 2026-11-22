import Image from "next/image";

const marks = [
  { name: "BLIK", src: "/payment-methods/blik.svg", width: 56, height: 23 },
  { name: "Mastercard", src: "/payment-methods/mastercard.svg", width: 28, height: 28 },
  { name: "Apple Pay", src: "/payment-methods/applepay.svg", width: 48, height: 40 },
  { name: "Google Pay", src: "/payment-methods/googlepay.svg", width: 36, height: 36 },
];

export default function PaymentMethodBadges({ compact = false, whiteApplePay = false }: { compact?: boolean; whiteApplePay?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5" role="img" aria-label="BLIK, Mastercard, Apple Pay i Google Pay">
      {marks.map((mark) => <span key={mark.name} className="flex h-10 items-center justify-center">
        <Image src={mark.src} alt="" aria-hidden="true" width={mark.width} height={mark.height} className={`object-contain ${mark.name === "Apple Pay" ? (compact ? "max-h-7 max-w-14" : "max-h-9 max-w-16") : (compact ? "max-h-5 max-w-9" : "max-h-7 max-w-14")} ${mark.name === "Apple Pay" && whiteApplePay ? "brightness-0 invert" : ""}`} />
      </span>)}
    </div>
  );
}


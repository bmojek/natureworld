import { ImageResponse } from "next/og";

export const alt = "Nature-World — sklep dla domu, ogrodu i zwierząt";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 84, background: "linear-gradient(120deg, #102c20 0%, #173d2b 62%, #376b43 100%)", color: "white" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, color: "#d9f99d", fontSize: 28, fontWeight: 700, letterSpacing: 5 }}>NATURE-WORLD</div>
      <div style={{ display: "flex", marginTop: 32, maxWidth: 970, fontSize: 68, lineHeight: 1.12, fontWeight: 700 }}>Dla domu, ogrodu i Twoich zwierząt</div>
      <div style={{ display: "flex", marginTop: 28, color: "#e7eee1", fontSize: 28 }}>Sklep internetowy Nature-World</div>
    </div>,
    size,
  );
}

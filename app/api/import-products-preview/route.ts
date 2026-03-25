import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

function cleanCategory(cat: string) {
  if (!cat) return "";
  return cat.replace(/\(\d+\)/g, "").trim();
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    const buffer = await file.arrayBuffer();

    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(buffer);

    const sheet = workbook.getWorksheet("Szablon") || workbook.worksheets[1];

    const headerRow = 4;
    const dataStart = 5;

    const headers: string[] = [];

    sheet.getRow(headerRow).eachCell((c) => {
      headers.push(c.text.trim());
    });

    const products: any[] = [];

    sheet.eachRow((row, i) => {
      if (i < dataStart) return;

      const obj: any = {};

      row.eachCell((cell, col) => {
        const key = headers[col - 1];

        if (!key) return;

        obj[key] = cell.text;
      });

      if (!obj["Tytuł oferty"]) return;

      products.push({
        allegroId: obj["ID oferty"],
        name: obj["Tytuł oferty"],
        price: obj["Cena PL"],
        stock: obj["Liczba sztuk"],
        sku: obj["Sygnatura/SKU Sprzedającego"],
        category: cleanCategory(obj["Podkategoria"]),
        images: obj["Zdjęcia"]?.split("|") || [],
        html: obj["Opis oferty"],
      });
    });

    return NextResponse.json({
      products: products.slice(0, 15),
    });
  } catch (e) {
    console.log(e);

    return NextResponse.json({ error: true }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

function cleanCategory(cat: string) {
  if (!cat) return "";
  return cat.replace(/\(\d+\)/g, "").trim();
}
const rootMap: Record<string, "ogrod" | "zwierzeta"> = {
  Rośliny: "ogrod",
  Doniczki: "ogrod",
  "Doniczki i pojemniki": "ogrod",
  Nawozy: "ogrod",
  Podłoża: "ogrod",
  Florystyka: "ogrod",
  Ozdoby: "ogrod",
  Dekoracje: "ogrod",

  Akwarystyka: "zwierzeta",
  "Dla psów": "zwierzeta",
  "Dla kotów": "zwierzeta",
  Rolnictwo: "zwierzeta",
};
function getRoot(parts: string[]) {
  const first = parts[0];

  if (!first) return "ogrod";

  if (
    first.includes("Akwarystyka") ||
    first.includes("psów") ||
    first.includes("kotów") ||
    first.includes("Rolnictwo")
  ) {
    return "Zwierzęta";
  }

  return "Ogród";
}

function addToTree(tree: any, parts: string[]) {
  const root = getRoot(parts);

  if (!tree[root]) {
    tree[root] = {};
  }

  let current = tree[root];

  for (const part of parts) {
    if (!current[part]) {
      current[part] = {};
    }

    current = current[part];
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File;

    const buffer = await file.arrayBuffer();

    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(buffer);

    const sheet = workbook.getWorksheet("Szablon") || workbook.worksheets[1];

    const headerRowIndex = 4;
    const dataStartRow = 5;

    const headers: string[] = [];

    sheet.getRow(headerRowIndex).eachCell((cell) => {
      headers.push(cell.text.trim());
    });

    const rows: any[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber < dataStartRow) return;

      const obj: any = {};

      row.eachCell((cell, colNumber) => {
        const key = headers[colNumber - 1];
        if (!key) return;

        obj[key] = cell.text;
      });

      rows.push(obj);
    });

    const categories = new Set<string>();

    for (const row of rows) {
      const cat = row["Podkategoria"] || row["Kategoria główna"];

      if (!cat) continue;

      categories.add(cleanCategory(cat));
    }

    const tree: any = {};

    for (const path of categories) {
      const parts = path.split(" > ");

      addToTree(tree, parts);
    }

    return NextResponse.json({
      ok: true,
      tree,
    });
  } catch (e) {
    console.log(e);

    return NextResponse.json({ error: true }, { status: 500 });
  }
}

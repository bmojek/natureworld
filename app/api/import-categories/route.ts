import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

import { collection, addDoc, getDocs } from "firebase/firestore";

import { db } from "@/app/lib/firebase";

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/ą/g, "a")
    .replace(/ć/g, "c")
    .replace(/ę/g, "e")
    .replace(/ł/g, "l")
    .replace(/ń/g, "n")
    .replace(/ó/g, "o")
    .replace(/ś/g, "s")
    .replace(/ż/g, "z")
    .replace(/ź/g, "z")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanCategory(cat: string) {
  if (!cat) return "";
  return cat.replace(/\(\d+\)/g, "").trim();
}

async function getCategoryMap() {
  const snap = await getDocs(collection(db, "categories"));

  const map: any = {};

  snap.forEach((d) => {
    map[d.data().slug] = {
      id: d.id,
      ...d.data(),
    };
  });

  return map;
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

    const catMap = await getCategoryMap();

    for (const path of categories) {
      const parts = path.split(" > ");

      let parentId = null;

      for (let i = 0; i < parts.length; i++) {
        const name = parts[i].trim();

        const slug = slugify(name);

        if (catMap[slug]) {
          parentId = catMap[slug].id;
          continue;
        }

        const level = i;

        const ref: any = await addDoc(collection(db, "categories"), {
          name,
          slug,
          level,
          parentId,
        });

        catMap[slug] = {
          id: ref.id,
        };

        parentId = ref.id;
      }
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (e) {
    console.log(e);

    return NextResponse.json({ error: true }, { status: 500 });
  }
}

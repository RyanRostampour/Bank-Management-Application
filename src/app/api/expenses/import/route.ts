import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { NextRequest, NextResponse } from "next/server";
import { ExpenseCategory } from "@prisma/client";

function fuzzyMatchCategory(raw: string): ExpenseCategory {
  const val = raw.toLowerCase().trim();
  if (val.includes("food") || val.includes("grocer") || val.includes("restaurant") || val.includes("dining") || val.includes("eat")) {
    return "FOOD";
  }
  if (val.includes("transport") || val.includes("gas") || val.includes("fuel") || val.includes("uber") || val.includes("lyft") || val.includes("taxi") || val.includes("bus") || val.includes("train") || val.includes("car")) {
    return "TRANSPORT";
  }
  if (val.includes("hous") || val.includes("rent") || val.includes("mortgage") || val.includes("home")) {
    return "HOUSING";
  }
  if (val.includes("util") || val.includes("electric") || val.includes("water") || val.includes("internet") || val.includes("phone") || val.includes("cable")) {
    return "UTILITIES";
  }
  if (val.includes("health") || val.includes("medical") || val.includes("doctor") || val.includes("pharma") || val.includes("drug") || val.includes("hospital")) {
    return "HEALTHCARE";
  }
  if (val.includes("entertain") || val.includes("movie") || val.includes("game") || val.includes("sport") || val.includes("gym") || val.includes("netflix") || val.includes("spotify")) {
    return "ENTERTAINMENT";
  }
  if (val.includes("shop") || val.includes("cloth") || val.includes("amazon") || val.includes("retail") || val.includes("store")) {
    return "SHOPPING";
  }
  if (val.includes("edu") || val.includes("school") || val.includes("tuition") || val.includes("course") || val.includes("book")) {
    return "EDUCATION";
  }
  if (val.includes("saving") || val.includes("invest") || val.includes("deposit")) {
    return "SAVINGS";
  }
  if (val.includes("debt") || val.includes("loan") || val.includes("credit") || val.includes("payment")) {
    return "DEBT_PAYMENT";
  }
  return "OTHER";
}

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const text = await file.text();
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  if (lines.length < 2) {
    return NextResponse.json({ error: "CSV has no data rows" }, { status: 400 });
  }

  const headerLine = lines[0]!;
  const headers = headerLine.split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));

  const dateIdx = headers.indexOf("date");
  const descIdx = headers.findIndex((h) => h.includes("desc"));
  const amountIdx = headers.findIndex((h) => h.includes("amount") || h === "price" || h === "cost");
  const categoryIdx = headers.findIndex((h) => h.includes("cat"));

  if (amountIdx === -1 || descIdx === -1) {
    return NextResponse.json({ error: "CSV must have at least Description and Amount columns" }, { status: 400 });
  }

  const toCreate: {
    userId: string;
    amount: number;
    description: string;
    category: ExpenseCategory;
    date: Date;
  }[] = [];

  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Handle quoted CSV fields
    const cols: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        cols.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    cols.push(current.trim());

    const rawAmount = cols[amountIdx]?.replace(/[$,]/g, "") ?? "";
    const amount = parseFloat(rawAmount);

    if (isNaN(amount) || amount <= 0) {
      skipped++;
      continue;
    }

    const description = cols[descIdx]?.replace(/^["']|["']$/g, "") ?? "";
    if (!description) {
      skipped++;
      continue;
    }

    const rawDate = dateIdx >= 0 ? cols[dateIdx] ?? "" : "";
    let date = new Date();
    if (rawDate) {
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) {
        date = parsed;
      }
    }

    const rawCategory = categoryIdx >= 0 ? cols[categoryIdx] ?? "" : "";
    const category = fuzzyMatchCategory(rawCategory);

    toCreate.push({
      userId: user.id,
      amount,
      description,
      category,
      date,
    });
  }

  if (toCreate.length > 0) {
    await prisma.expense.createMany({ data: toCreate });
  }

  return NextResponse.json({ imported: toCreate.length, skipped });
}

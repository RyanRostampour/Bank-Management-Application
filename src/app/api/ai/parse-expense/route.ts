import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCurrentUser } from "@/lib/get-user";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const VALID_CATEGORIES = [
  "FOOD",
  "TRANSPORT",
  "HOUSING",
  "UTILITIES",
  "HEALTHCARE",
  "ENTERTAINMENT",
  "SHOPPING",
  "EDUCATION",
  "SAVINGS",
  "DEBT_PAYMENT",
  "OTHER",
] as const;

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { text } = body as { text: string };

  if (!text?.trim()) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  const systemPrompt = `You are a financial data parser. Extract expense information from natural language text and return ONLY valid JSON with no markdown, no code blocks, no explanation.

Return exactly this shape:
{"amount": number, "description": string, "category": string, "date": string}

Rules:
- amount: positive number (e.g. 40.00)
- description: short description of what was spent on
- category: MUST be one of: FOOD, TRANSPORT, HOUSING, UTILITIES, HEALTHCARE, ENTERTAINMENT, SHOPPING, EDUCATION, SAVINGS, DEBT_PAYMENT, OTHER
- date: ISO date string (YYYY-MM-DD). Today is ${new Date().toISOString().split("T")[0]}. "yesterday" means subtract 1 day, "last week" means 7 days ago, etc.

ONLY return the JSON object. Nothing else.`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    system: systemPrompt,
    messages: [{ role: "user", content: text }],
  });

  const rawText =
    message.content[0].type === "text" ? message.content[0].text.trim() : "";

  let parsed: { amount: number; description: string; category: string; date: string };
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse expense from text" },
      { status: 422 }
    );
  }

  // Validate fields
  if (
    typeof parsed.amount !== "number" ||
    parsed.amount <= 0 ||
    !parsed.description ||
    !VALID_CATEGORIES.includes(parsed.category as (typeof VALID_CATEGORIES)[number]) ||
    !parsed.date
  ) {
    return NextResponse.json(
      { error: "Could not extract valid expense data" },
      { status: 422 }
    );
  }

  return NextResponse.json(parsed);
}

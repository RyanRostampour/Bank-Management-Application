import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCurrentUser } from "@/lib/get-user";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  const expenses = await prisma.expense.findMany({
    where: { userId: user.id, date: { gte: threeMonthsAgo } },
    orderBy: { date: "desc" },
  });

  if (expenses.length < 3) {
    return NextResponse.json(
      { error: "Not enough expense data" },
      { status: 400 }
    );
  }

  // Build monthly breakdown
  const monthlyData: Record<string, { total: number; categories: Record<string, number> }> =
    {};

  for (const e of expenses) {
    const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyData[key]) monthlyData[key] = { total: 0, categories: {} };
    monthlyData[key].total += e.amount;
    monthlyData[key].categories[e.category] =
      (monthlyData[key].categories[e.category] ?? 0) + e.amount;
  }

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const categoryTotals = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});
  const topCategory =
    Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "OTHER";

  const systemPrompt = `You are a financial analyst. Analyze the user's spending data and return ONLY valid JSON with no markdown or code blocks.

Return exactly this shape:
{"summary": string, "insights": [string, string, string], "recommendations": [string, string], "topCategory": string, "savingsPotential": number}

Rules:
- summary: 1-2 sentences about overall spending trends
- insights: exactly 3 specific observations about the spending data
- recommendations: exactly 2 actionable recommendations
- topCategory: the highest spending category (must be one of: FOOD, TRANSPORT, HOUSING, UTILITIES, HEALTHCARE, ENTERTAINMENT, SHOPPING, EDUCATION, SAVINGS, DEBT_PAYMENT, OTHER)
- savingsPotential: estimated monthly dollar amount they could save (number, e.g. 150.00)

ONLY return the JSON object. Nothing else.`;

  const userMessage = `Here is my spending data for the last 3 months:

Total spent: $${totalSpent.toFixed(2)}
Number of transactions: ${expenses.length}

Monthly breakdown:
${Object.entries(monthlyData)
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([month, data]) => `${month}: $${data.total.toFixed(2)}`)
  .join("\n")}

Spending by category:
${Object.entries(categoryTotals)
  .sort((a, b) => b[1] - a[1])
  .map(([cat, amt]) => `${cat}: $${amt.toFixed(2)}`)
  .join("\n")}

Please analyze my spending patterns.`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const rawText =
    message.content[0].type === "text" ? message.content[0].text.trim() : "";

  let analysis: {
    summary: string;
    insights: string[];
    recommendations: string[];
    topCategory: string;
    savingsPotential: number;
  };

  try {
    analysis = JSON.parse(rawText);
  } catch {
    return NextResponse.json(
      { error: "Failed to analyze spending" },
      { status: 500 }
    );
  }

  // Ensure topCategory is always set
  if (!analysis.topCategory) {
    analysis.topCategory = topCategory;
  }

  return NextResponse.json(analysis);
}

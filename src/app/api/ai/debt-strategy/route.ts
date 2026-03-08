import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCurrentUser } from "@/lib/get-user";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const debts = await prisma.debt.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  if (debts.length === 0) {
    return NextResponse.json({ error: "No debts found" }, { status: 400 });
  }

  const systemPrompt = `You are a debt payoff strategy expert. Analyze the user's debts and recommend the best strategy. Return ONLY valid JSON with no markdown or code blocks.

Return exactly this shape:
{"recommendation": "AVALANCHE" | "SNOWBALL", "reasoning": string, "avalancheMonths": number, "snowballMonths": number, "interestSavedWithAvalanche": number, "priorityOrder": string[]}

Rules:
- recommendation: "AVALANCHE" (highest interest first, saves more money) or "SNOWBALL" (smallest balance first, psychological wins)
- reasoning: 2-3 sentences explaining the recommendation in plain language
- avalancheMonths: estimated months to pay off all debt with avalanche method (integer)
- snowballMonths: estimated months to pay off all debt with snowball method (integer)
- interestSavedWithAvalanche: estimated total interest saved by using avalanche vs snowball (number, can be 0 if same)
- priorityOrder: array of debt names in the recommended payoff order

Base estimates on the minimum payments provided. Be realistic with your estimates.
ONLY return the JSON object. Nothing else.`;

  const debtList = debts
    .map(
      (d) =>
        `- Name: ${d.name}, Balance: $${(d.totalAmount - d.paidAmount).toFixed(2)}, Interest Rate: ${d.interestRate}% APR, Minimum Payment: $${d.minimumPayment.toFixed(2)}/month`
    )
    .join("\n");

  const totalBalance = debts.reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);
  const totalMinPayments = debts.reduce((sum, d) => sum + d.minimumPayment, 0);

  const userMessage = `Here are my debts:

${debtList}

Total remaining balance: $${totalBalance.toFixed(2)}
Total minimum monthly payments: $${totalMinPayments.toFixed(2)}

Please analyze these debts and recommend whether I should use the avalanche or snowball method, with estimated payoff timelines for both.`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const rawText =
    message.content[0].type === "text" ? message.content[0].text.trim() : "";

  let strategy: {
    recommendation: "AVALANCHE" | "SNOWBALL";
    reasoning: string;
    avalancheMonths: number;
    snowballMonths: number;
    interestSavedWithAvalanche: number;
    priorityOrder: string[];
  };

  try {
    strategy = JSON.parse(rawText);
  } catch {
    return NextResponse.json(
      { error: "Failed to generate debt strategy" },
      { status: 500 }
    );
  }

  return NextResponse.json(strategy);
}

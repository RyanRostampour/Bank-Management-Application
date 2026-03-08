import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCurrentUser } from "@/lib/get-user";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { messages } = body as {
      messages: { role: "user" | "assistant"; content: string }[];
    };

    // Fetch financial data for context
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const [expenses, debts, paymentPlans] = await Promise.all([
      prisma.expense.findMany({
        where: { userId: user.id, date: { gte: threeMonthsAgo } },
        orderBy: { date: "desc" },
      }),
      prisma.debt.findMany({ where: { userId: user.id } }),
      prisma.paymentPlan.findMany({
        where: { userId: user.id, status: "ACTIVE" },
      }),
    ]);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const monthlyAvg = expenses.length > 0 ? totalExpenses / 3 : 0;

    const categoryTotals = expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, {});
    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, amt]) => `${cat}: $${amt.toFixed(2)}`);

    const totalDebt = debts.reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);

    const systemPrompt = `You are an expert AI financial advisor integrated into BankingAI, a personal finance management app.
You have access to the user's financial data:

FINANCIAL SNAPSHOT:
- Monthly expenses average (last 3 months): $${monthlyAvg.toFixed(2)}
- Total expenses last 3 months: $${totalExpenses.toFixed(2)} across ${expenses.length} transactions
- Total debt: $${totalDebt.toFixed(2)} across ${debts.length} debt(s)
- Active payment plans: ${paymentPlans.length} plan(s)
- Top spending categories: ${topCategories.length > 0 ? topCategories.join(", ") : "No data yet"}

DEBT DETAILS:
${
  debts.length > 0
    ? debts
        .map(
          (d) =>
            `- ${d.name}: $${(d.totalAmount - d.paidAmount).toFixed(2)} remaining at ${d.interestRate}% APR, $${d.minimumPayment.toFixed(2)}/mo minimum`
        )
        .join("\n")
    : "No debts tracked."
}

Provide personalized, actionable financial advice. Be concise and friendly.
When discussing numbers, be specific using their actual data.
Format responses with markdown where helpful.`;

    const readable = new ReadableStream({
      async start(controller) {
        try {
          const stream = anthropic.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: 2048,
            system: systemPrompt,
            messages,
          });

          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(new TextEncoder().encode(chunk.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          controller.enqueue(new TextEncoder().encode(`\n\n[Error: ${msg}]`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    console.error("AI chat error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

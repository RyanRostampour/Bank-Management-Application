"use client";

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";

const COLORS = [
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#84cc16", // lime
  "#06b6d4", // cyan
];

interface SpendingByCategoryProps {
  expenses: { category: string; amount: number }[];
}

const CATEGORY_LABELS: Record<string, string> = {
  FOOD: "Food",
  TRANSPORT: "Transport",
  HOUSING: "Housing",
  UTILITIES: "Utilities",
  HEALTHCARE: "Healthcare",
  ENTERTAINMENT: "Entertainment",
  SHOPPING: "Shopping",
  EDUCATION: "Education",
  SAVINGS: "Savings",
  DEBT_PAYMENT: "Debt Payment",
  OTHER: "Other",
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-muted-foreground">${payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
}

export function SpendingByCategory({ expenses }: SpendingByCategoryProps) {
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <PieChartIcon className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No expense data yet this month.</p>
      </div>
    );
  }

  const data = expenses.map((e) => ({
    name: CATEGORY_LABELS[e.category] ?? e.category,
    value: e.amount,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
          isAnimationActive={false}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
        <Legend
          formatter={(value) => (
            <span className="text-xs text-foreground">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

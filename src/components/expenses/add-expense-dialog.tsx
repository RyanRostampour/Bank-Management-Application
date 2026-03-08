"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon, Loader2, Bot, PenLine } from "lucide-react";

const CATEGORIES = [
  { value: "FOOD", label: "Food" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "HOUSING", label: "Housing" },
  { value: "UTILITIES", label: "Utilities" },
  { value: "HEALTHCARE", label: "Healthcare" },
  { value: "ENTERTAINMENT", label: "Entertainment" },
  { value: "SHOPPING", label: "Shopping" },
  { value: "EDUCATION", label: "Education" },
  { value: "SAVINGS", label: "Savings" },
  { value: "DEBT_PAYMENT", label: "Debt Payment" },
  { value: "OTHER", label: "Other" },
];

type EntryMode = "manual" | "ai";

export function AddExpenseDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<EntryMode>("manual");
  const [loading, setLoading] = useState(false);
  const [aiParsing, setAiParsing] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiText, setAiText] = useState("");

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  function resetForm() {
    setAmount("");
    setDescription("");
    setCategory("");
    setDate(new Date().toISOString().split("T")[0]);
    setAiText("");
    setAiError("");
    setMode("manual");
  }

  async function handleParseWithAI() {
    if (!aiText.trim()) return;
    setAiParsing(true);
    setAiError("");

    try {
      const res = await fetch("/api/ai/parse-expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText }),
      });

      if (!res.ok) {
        const data = await res.json();
        setAiError(data.error ?? "Failed to parse expense");
        return;
      }

      const parsed = await res.json();
      setAmount(String(parsed.amount));
      setDescription(parsed.description);
      setCategory(parsed.category);
      setDate(parsed.date);
      setMode("manual");
    } catch {
      setAiError("Something went wrong. Please try again.");
    } finally {
      setAiParsing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !description || !category) return;

    setLoading(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, description, category, date }),
      });

      if (res.ok) {
        setOpen(false);
        resetForm();
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(value: boolean) {
    setOpen(value);
    if (!value) resetForm();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>

        {/* Mode toggle */}
        <div className="flex rounded-lg border bg-muted p-1 gap-1">
          <button
            type="button"
            onClick={() => { setMode("manual"); setAiError(""); }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "manual"
                ? "bg-background shadow-sm"
                : "hover:text-foreground text-muted-foreground"
            }`}
          >
            <PenLine className="h-3.5 w-3.5" />
            Manual Entry
          </button>
          <button
            type="button"
            onClick={() => { setMode("ai"); setAiError(""); }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "ai"
                ? "bg-background shadow-sm"
                : "hover:text-foreground text-muted-foreground"
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            AI Parse
          </button>
        </div>

        {mode === "ai" ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Describe your expense</label>
              <textarea
                rows={3}
                placeholder="e.g. spent $40 on groceries yesterday, or paid $120 for electricity bill"
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {aiError && (
              <p className="text-sm text-destructive">{aiError}</p>
            )}
            <Button
              type="button"
              onClick={handleParseWithAI}
              disabled={aiParsing || !aiText.trim()}
              className="w-full"
            >
              {aiParsing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Bot className="mr-2 h-4 w-4" />
                  Parse with AI
                </>
              )}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Amount ($)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Description</label>
              <Input
                type="text"
                placeholder="What did you spend on?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Category</label>
              <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Adding..." : "Add Expense"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

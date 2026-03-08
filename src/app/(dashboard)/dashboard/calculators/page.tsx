"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ── Compound Interest ──────────────────────────────────────────
function CompoundInterestCalc() {
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("");
  const [time, setTime] = useState("");
  const [frequency, setFrequency] = useState("12");

  const p = parseFloat(principal) || 0;
  const r = parseFloat(rate) / 100 || 0;
  const t = parseFloat(time) || 0;
  const n = parseInt(frequency) || 12;

  const finalAmount = p > 0 && r > 0 && t > 0 ? p * Math.pow(1 + r / n, n * t) : 0;
  const totalInterest = finalAmount - p;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Principal ($)</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="10000"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Annual Rate (%)</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="7"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Time (years)</label>
          <Input
            type="number"
            min="0"
            step="0.5"
            placeholder="10"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Compound Frequency</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="1">Annually</option>
            <option value="2">Semi-annually</option>
            <option value="4">Quarterly</option>
            <option value="12">Monthly</option>
            <option value="365">Daily</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <ResultCard
          label="Final Amount"
          value={finalAmount > 0 ? `$${finalAmount.toFixed(2)}` : "-"}
          highlight
        />
        <ResultCard
          label="Total Interest Earned"
          value={totalInterest > 0 ? `$${totalInterest.toFixed(2)}` : "-"}
        />
        <ResultCard
          label="Principal"
          value={p > 0 ? `$${p.toFixed(2)}` : "-"}
        />
      </div>
    </div>
  );
}

// ── Loan / EMI ─────────────────────────────────────────────────
function LoanCalc() {
  const [loanAmount, setLoanAmount] = useState("");
  const [annualRate, setAnnualRate] = useState("");
  const [tenure, setTenure] = useState("");

  const p = parseFloat(loanAmount) || 0;
  const r = parseFloat(annualRate) / 100 / 12 || 0;
  const n = parseInt(tenure) || 0;

  let emi = 0;
  if (p > 0 && n > 0) {
    if (r === 0) {
      emi = p / n;
    } else {
      emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }
  }

  const totalPayment = emi * n;
  const totalInterest = totalPayment - p;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Loan Amount ($)</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="25000"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Annual Interest Rate (%)</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="6.5"
            value={annualRate}
            onChange={(e) => setAnnualRate(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Tenure (months)</label>
          <Input
            type="number"
            min="1"
            placeholder="60"
            value={tenure}
            onChange={(e) => setTenure(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <ResultCard
          label="Monthly Payment (EMI)"
          value={emi > 0 ? `$${emi.toFixed(2)}` : "-"}
          highlight
        />
        <ResultCard
          label="Total Payment"
          value={totalPayment > 0 ? `$${totalPayment.toFixed(2)}` : "-"}
        />
        <ResultCard
          label="Total Interest"
          value={totalInterest > 0 ? `$${totalInterest.toFixed(2)}` : "-"}
        />
      </div>
    </div>
  );
}

// ── Debt Payoff ────────────────────────────────────────────────
function DebtPayoffCalc() {
  const [debtAmount, setDebtAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");

  const balance = parseFloat(debtAmount) || 0;
  const rate = parseFloat(interestRate) / 100 / 12 || 0;
  const payment = parseFloat(monthlyPayment) || 0;

  let months = 0;
  let totalInterest = 0;

  if (balance > 0 && payment > 0) {
    if (rate === 0) {
      months = Math.ceil(balance / payment);
      totalInterest = 0;
    } else if (payment > balance * rate) {
      months = Math.ceil(
        -Math.log(1 - (balance * rate) / payment) / Math.log(1 + rate)
      );
      totalInterest = payment * months - balance;
    }
  }

  const payoffDate =
    months > 0
      ? new Date(
          new Date().getFullYear(),
          new Date().getMonth() + months,
          1
        ).toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : "-";

  const payoffWarning = payment > 0 && rate > 0 && payment <= balance * rate;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Debt Amount ($)</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="5000"
            value={debtAmount}
            onChange={(e) => setDebtAmount(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Annual Interest Rate (%)</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="19.99"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Monthly Payment ($)</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="200"
            value={monthlyPayment}
            onChange={(e) => setMonthlyPayment(e.target.value)}
          />
        </div>
        {payoffWarning && (
          <p className="text-xs text-destructive">
            Monthly payment must exceed the interest charge (${(balance * rate).toFixed(2)}/mo) to pay off the debt.
          </p>
        )}
      </div>

      <div className="space-y-4">
        <ResultCard
          label="Months to Payoff"
          value={months > 0 ? `${months} months` : "-"}
          highlight
        />
        <ResultCard
          label="Total Interest Paid"
          value={months > 0 ? `$${totalInterest.toFixed(2)}` : "-"}
        />
        <ResultCard
          label="Payoff Date"
          value={payoffDate}
        />
      </div>
    </div>
  );
}

// ── Result Card ────────────────────────────────────────────────
function ResultCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? "bg-primary/10 ring-1 ring-primary/20" : "bg-muted/50"}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────
export default function CalculatorsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calculators</h1>
        <p className="text-sm text-muted-foreground">Financial tools to help you plan</p>
      </div>

      <Tabs defaultValue="compound">
        <TabsList className="mb-4">
          <TabsTrigger value="compound">Compound Interest</TabsTrigger>
          <TabsTrigger value="loan">Loan / EMI</TabsTrigger>
          <TabsTrigger value="payoff">Debt Payoff</TabsTrigger>
        </TabsList>

        <TabsContent value="compound">
          <Card>
            <CardHeader>
              <CardTitle>Compound Interest Calculator</CardTitle>
            </CardHeader>
            <CardContent>
              <CompoundInterestCalc />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loan">
          <Card>
            <CardHeader>
              <CardTitle>Loan / EMI Calculator</CardTitle>
            </CardHeader>
            <CardContent>
              <LoanCalc />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payoff">
          <Card>
            <CardHeader>
              <CardTitle>Debt Payoff Calculator</CardTitle>
            </CardHeader>
            <CardContent>
              <DebtPayoffCalc />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

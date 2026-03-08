import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bot,
  TrendingDown,
  CreditCard,
  Receipt,
  Calculator,
  PiggyBank,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Receipt,
    title: "Expense Tracking",
    description: "Log and categorize your spending with ease. See where your money goes at a glance.",
  },
  {
    icon: CreditCard,
    title: "Payment Plans",
    description: "Create and manage installment plans with automatic interest calculations.",
  },
  {
    icon: TrendingDown,
    title: "Debt Management",
    description: "Track all your debts, choose avalanche or snowball strategies, and stay on top of payments.",
  },
  {
    icon: Calculator,
    title: "Smart Calculators",
    description: "Compound interest, loan amortization, debt payoff - all the calculators you need.",
  },
  {
    icon: PiggyBank,
    title: "Budget Planning",
    description: "Set monthly budgets per category and get alerts when you're close to your limits.",
  },
  {
    icon: Bot,
    title: "AI Financial Advisor",
    description: "Chat with Claude AI to get personalized spending analysis and financial advice.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <nav className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <PiggyBank className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold">BankingAI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" render={<Link href="/sign-in" />} nativeButton={false}>
              Sign In
            </Button>
            <Button render={<Link href="/sign-up" />} nativeButton={false}>Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto flex flex-col items-center gap-6 py-24 text-center px-4">
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" />
          Powered by Claude AI
        </Badge>
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight">
          Manage your finances with{" "}
          <span className="text-primary">AI-powered</span> intelligence
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Track expenses, manage debt, plan payments, and get personalized financial advice - all in one place.
        </p>
        <div className="flex gap-3">
          <Button size="lg" render={<Link href="/sign-up" />} nativeButton={false}>
            Start for free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/sign-in" />} nativeButton={false}>
            Sign in
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 pb-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Everything you need</h2>
          <p className="mt-2 text-muted-foreground">
            A complete financial toolkit backed by artificial intelligence.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Ready to take control?</h2>
          <p className="mt-2 text-muted-foreground">
            Join and start managing your finances smarter today.
          </p>
          <Button size="lg" className="mt-6" render={<Link href="/sign-up" />} nativeButton={false}>
            Get started free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}

BankingAI:

A full-stack personal finance management application powered by Claude AI. Built with Next.js, PostgreSQL, and shadcn/ui.

Overview:

BankingAI gives you a complete picture of your finances in one place. Log expenses, track debt, manage payment plans, set budgets, and get personalized advice from an AI financial advisor that has direct access to your financial data.

Features:

Expense Tracking - Log, categorize, and filter expenses. Import and export via CSV.

Payment Plans - Create installment plans with automatic EMI and interest calculations.

Debt Tracker - Track debts with avalanche and snowball payoff strategies.

Budget Management - Set monthly limits per category with live progress tracking.

Savings Goals - Set targets, make contributions, and track progress.

Bill Reminders - Organize upcoming bills by due date.

Net Worth - Track assets vs liabilities in one view.

Calculators - Compound interest, loan EMI, and debt payoff calculators.

AI Advisor - Chat with Claude AI about your finances with real data context.

AI Insights - Automatic spending analysis, debt strategy recommendations, and natural language expense entry.

Dark Mode - System-aware light and dark theme.

Stack:

Next.js 16, shadcn/ui, Tailwind CSS, Clerk, PostgreSQL, Prisma, Anthropic Claude, Recharts

Getting Started:

Prerequisites: Node.js 18+, PostgreSQL, Clerk account, Anthropic API key

Clone the repository and install dependencies. Create a .env file in the root with your DATABASE_URL, Clerk keys, and Anthropic API key. Run npx prisma db push and npx prisma generate to set up the database. Then start the development server with npm run dev and open http://localhost:3000.

Configuration:

Clerk - In your Clerk dashboard, go to Configure > Restrictions and add http://localhost:3000 to allowed redirect origins. Then go to Configure > Paths and set the sign-in redirect URL to /dashboard.

Anthropic - AI features require Anthropic API credits. Note that the Claude Pro subscription is separate from API access and does not grant API usage.

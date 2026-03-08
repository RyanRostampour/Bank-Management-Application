"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  TrendingDown,
  Calculator,
  Bot,
  PiggyBank,
  Target,
  RefreshCw,
  Bell,
  Landmark,
  Settings,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Finance",
    items: [
      { title: "Expenses", href: "/dashboard/expenses", icon: Receipt },
      { title: "Payment Plans", href: "/dashboard/payment-plans", icon: CreditCard },
      { title: "Debt Tracker", href: "/dashboard/debts", icon: TrendingDown },
      { title: "Budgets", href: "/dashboard/budgets", icon: PiggyBank },
      { title: "Goals", href: "/dashboard/goals", icon: Target },
      { title: "Recurring", href: "/dashboard/recurring", icon: RefreshCw },
      { title: "Bills", href: "/dashboard/bills", icon: Bell },
      { title: "Net Worth", href: "/dashboard/net-worth", icon: Landmark },
    ],
  },
  {
    title: "Tools",
    items: [
      { title: "Calculators", href: "/dashboard/calculators", icon: Calculator },
      { title: "AI Advisor", href: "/dashboard/ai-advisor", icon: Bot },
    ],
  },
  {
    title: "Account",
    items: [
      { title: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <PiggyBank className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">BankingAI</p>
            <p className="text-xs text-muted-foreground">Smart Finance Manager</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={pathname === item.href}
                      className={
                        pathname === item.href
                          ? "bg-accent text-accent-foreground font-medium"
                          : ""
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <p className="text-xs text-muted-foreground">Powered by Claude AI</p>
      </SidebarFooter>
    </Sidebar>
  );
}

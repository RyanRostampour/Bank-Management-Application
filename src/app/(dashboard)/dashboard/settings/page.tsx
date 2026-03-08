import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";
import { DeleteAllExpensesButton } from "@/components/settings/delete-all-expenses-button";

export default async function SettingsPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await currentUser();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information from Clerk</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-1">
            <p className="text-sm font-medium text-muted-foreground">Name</p>
            <p className="text-sm">{[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Not set"}</p>
          </div>
          <div className="grid gap-1">
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="text-sm">{user?.emailAddresses[0]?.emailAddress ?? "Not set"}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            To update your name or email, use the Clerk profile page.
          </p>
          <Button variant="outline" size="sm" render={<Link href="/user-profile" />} nativeButton={false}>
            <ExternalLink className="mr-2 h-3.5 w-3.5" />
            Edit Profile
          </Button>
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
          <CardDescription>Export or manage your financial data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Export Expenses</p>
              <p className="text-xs text-muted-foreground">Download all your expenses as CSV</p>
            </div>
            <a
              href="/api/expenses/export"
              download
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </a>
          </div>
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-destructive">Danger Zone</p>
              <p className="text-xs text-muted-foreground">This action cannot be undone</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Delete All Expenses</p>
                <p className="text-xs text-muted-foreground">Permanently delete all your expense records</p>
              </div>
              <DeleteAllExpensesButton />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your Clerk account settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" render={<Link href="/user-profile" />} nativeButton={false}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Manage Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

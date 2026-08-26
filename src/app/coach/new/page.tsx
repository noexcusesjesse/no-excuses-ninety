import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { AddClientForm } from "./add-client-form";

export const dynamic = "force-dynamic";

export default function AddClientPage() {
  return (
    <>
      <AppHeader role="coach" />
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-6 sm:px-6">
        <Link href="/coach" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to roster
        </Link>

        <h1 className="mb-6 text-3xl font-semibold tracking-tight">Add Client</h1>

        <Card>
          <CardHeader>
            <CardTitle>New Client Setup</CardTitle>
            <CardDescription>
              Create a new client account. Default password is &quot;client-demo&quot; — the client should change it after first login.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddClientForm />
          </CardContent>
        </Card>
      </main>
    </>
  );
}

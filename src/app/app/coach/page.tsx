import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getClientOwnThread, getProgramNotices } from "@/db/messages";
import { MessageThread } from "@/components/message-thread";
import { ProgramNotices } from "@/components/program-notices";
import { formatPositionKicker, formatPositionSecondary } from "@/lib/program-position";
import { getClientToday } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function CoachPage() {
  const client = await getClientToday();
  const thread = await getClientOwnThread();
  const notices = await getProgramNotices();
  if (!client || !thread) {
    return <div className="py-12 text-center text-muted-foreground">Not signed in as a client.</div>;
  }

  return (
    <>
      <div className="mb-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {formatPositionKicker(client.position, client.plan.dayLabel)}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Coach</h1>
        {formatPositionSecondary(client.position) && (
          <p className="mt-1 text-sm text-muted-foreground">{formatPositionSecondary(client.position)}</p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          Message {thread.coachName} here. This is your assigned coach — not an AI, and not Staff.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Program</CardTitle>
          <CardDescription>From LoadLine. Not a Staff portal.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProgramNotices notices={notices} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thread with {thread.coachName}</CardTitle>
          <CardDescription>1:1 with your assigned coach only.</CardDescription>
        </CardHeader>
        <CardContent>
          <MessageThread
            clientId={thread.clientId}
            selfRole="client"
            coachName={thread.coachName}
            clientName={thread.clientName}
            initialMessages={thread.messages}
            canSend={thread.canSend}
          />
        </CardContent>
      </Card>

      <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
        LoadLine does not prescribe, dose, or adjust medications.
      </p>
    </>
  );
}

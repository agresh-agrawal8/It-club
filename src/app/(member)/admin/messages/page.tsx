import type { Metadata } from "next";
import { CheckCircle2, Undo2, Mail } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader, DeleteButton } from "@/components/admin/admin-shell";
import { toggleMessageHandledAction, deleteMessageAction } from "@/lib/actions/content";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Messages" };

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  handled: boolean;
  created_at: string;
}

export default async function AdminMessagesPage() {
  await requireAdmin();

  let messages: Message[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("contact_messages")
      .select("*")
      .order("handled", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(100);
    messages = (data as Message[]) ?? [];
  } catch {
    messages = [];
  }

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Messages"
        description="Everything sent through the contact form. Mark messages handled as you work through them."
        backHref="/admin"
      />

      {messages.length === 0 ? (
        <EmptyState
          icon={<Mail className="h-6 w-6" />}
          title="No messages yet"
          description="Messages from the public contact form will land here."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {messages.map((m) => (
            <Card key={m.id} className={`p-6 ${m.handled ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-sm font-semibold text-white">{m.name}</h3>
                    <a
                      href={`mailto:${m.email}`}
                      className="text-xs text-brand-300 hover:text-brand-200"
                    >
                      {m.email}
                    </a>
                    <span className="text-[11px] text-zinc-600">{timeAgo(m.created_at)}</span>
                    {m.handled && <Badge variant="success">Handled</Badge>}
                  </div>
                  {m.subject && (
                    <p className="mt-2 text-sm font-medium text-zinc-300">{m.subject}</p>
                  )}
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
                    {m.message}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <form action={toggleMessageHandledAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="handled" value={String(m.handled)} />
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-emerald-400/40 hover:text-emerald-300"
                    >
                      {m.handled ? (
                        <>
                          <Undo2 className="h-3.5 w-3.5" /> Reopen
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Mark handled
                        </>
                      )}
                    </button>
                  </form>
                  <DeleteButton action={deleteMessageAction} id={m.id} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

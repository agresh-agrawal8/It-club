import type { Metadata } from "next";
import { CheckSquare } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getMyTasks } from "@/lib/data";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskItem } from "./task-item";

export const metadata: Metadata = { title: "My Tasks" };

export default async function MyTasksPage() {
  const { user } = await requireUser();
  const tasks = await getMyTasks(user.id);
  const open = tasks.filter((t) => t.status !== "done");
  const done = tasks.filter((t) => t.status === "done");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tighter text-white md:text-4xl">My Tasks</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Tasks assigned to you by the core team. Update your status and progress.
        </p>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="h-6 w-6" />}
          title="No tasks assigned"
          description="When the core team assigns you a task, it'll show up here."
        />
      ) : (
        <>
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Open · {open.length}
            </h2>
            {open.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {open.map((t) => (
                  <TaskItem key={t.id} task={t} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Nothing open — great work! 🎉</p>
            )}
          </section>

          {done.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                Completed · {done.length}
              </h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {done.map((t) => (
                  <TaskItem key={t.id} task={t} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

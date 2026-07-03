"use client";

import { useState, useTransition } from "react";
import { CalendarClock } from "lucide-react";
import type { TaskRow } from "@/types/database";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { ProgressBar } from "@/components/ui/progress";
import { updateTaskProgressAction } from "@/lib/actions/member";
import { formatDate } from "@/lib/utils";

const priorityVariant = { urgent: "danger", high: "warning", medium: "accent", low: "small" } as const;

export function TaskItem({ task }: { task: TaskRow }) {
  const [status, setStatus] = useState(task.status);
  const [progress, setProgress] = useState(task.progress);
  const [pending, startTransition] = useTransition();

  function save(next: { status?: string; progress?: number }) {
    const fd = new FormData();
    fd.set("id", task.id);
    fd.set("status", next.status ?? status);
    fd.set("progress", String(next.progress ?? progress));
    startTransition(() => updateTaskProgressAction(fd));
  }

  const overdue = task.deadline && new Date(task.deadline) < new Date() && status !== "done";

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-white">{task.title}</h3>
          {task.description && <p className="text-sm text-zinc-400">{task.description}</p>}
        </div>
        <Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge>
      </div>

      <div className="flex items-center gap-4 text-xs text-zinc-500">
        {task.deadline && (
          <span className={`flex items-center gap-1.5 ${overdue ? "text-red-300" : ""}`}>
            <CalendarClock className="h-3.5 w-3.5" />
            {overdue ? "Overdue · " : "Due "}
            {formatDate(task.deadline)}
          </span>
        )}
        {pending && <span className="text-brand-300">Saving…</span>}
      </div>

      <ProgressBar value={progress} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Status"
          value={status}
          onChange={(e) => {
            const v = e.target.value as TaskRow["status"];
            setStatus(v);
            const p = v === "done" ? 100 : progress;
            setProgress(p);
            save({ status: v, progress: p });
          }}
        >
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="blocked">Blocked</option>
          <option value="done">Done</option>
        </Select>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Progress · {progress}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            onMouseUp={() => save({ progress })}
            onTouchEnd={() => save({ progress })}
            className="accent-brand-500"
          />
        </div>
      </div>
    </Card>
  );
}

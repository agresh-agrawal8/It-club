"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Users,
  CalendarDays,
  Award,
  CheckSquare,
  ImageIcon,
} from "lucide-react";
import type { SearchResult } from "@/app/api/search/route";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";

const typeMeta: Record<SearchResult["type"], { icon: React.ElementType; label: string }> = {
  member: { icon: Users, label: "Member" },
  event: { icon: CalendarDays, label: "Event" },
  achievement: { icon: Award, label: "Achievement" },
  gallery: { icon: ImageIcon, label: "Photo" },
  task: { icon: CheckSquare, label: "Task" },
};

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    setTouched(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="flex flex-col gap-8">
      <div className="glass flex items-center gap-3 rounded-2xl px-5 py-4 transition-colors focus-within:border-brand-400/60">
        <Search className="h-5 w-5 text-zinc-500" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search events, members, photos…"
          className="w-full bg-transparent text-base text-white placeholder:text-zinc-500 focus:outline-none"
        />
        {loading && <Spinner />}
      </div>

      {results.length > 0 && (
        <div className="flex flex-col gap-2">
          {results.map((r, i) => {
            const { icon: Icon, label } = typeMeta[r.type];
            return (
              <Link
                key={`${r.type}-${i}`}
                href={r.href}
                className="glass flex items-center gap-4 rounded-2xl p-4 transition-colors hover:border-brand-400/40"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">{r.title}</div>
                  {r.subtitle && <div className="truncate text-xs text-zinc-500">{r.subtitle}</div>}
                </div>
                <span className="text-xs uppercase tracking-wide text-zinc-600">{label}</span>
              </Link>
            );
          })}
        </div>
      )}

      {touched && !loading && results.length === 0 && query.trim().length >= 2 && (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="No results found"
          description={`Nothing matched "${query}". Try a different search term.`}
        />
      )}
    </div>
  );
}

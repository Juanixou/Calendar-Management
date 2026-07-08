import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { PackTimelineEntry } from "@gestion-clases/core";
import { packsCompletedInMonth, packsActivatedInMonth } from "@gestion-clases/core";
import { Badge } from "../ui/Badge";
import { formatShortDate } from "../../lib/timezone";

export function PackActivityCell({
  timeline,
  year,
  month,
}: {
  timeline: PackTimelineEntry[] | undefined;
  year: number;
  month: number;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!timeline) return <span className="text-slate-400">…</span>;

  const completedIds = new Set(packsCompletedInMonth(timeline, year, month).map((entry) => entry.purchase.id));
  const activatedIds = new Set(packsActivatedInMonth(timeline, year, month).map((entry) => entry.purchase.id));
  // A pack purchased earlier but only touched (and finished) this month is both "activated" and
  // "completed" in the same month — count/show it once (as "completado"), not as two separate packs.
  const startedOnlyIds = new Set([...activatedIds].filter((id) => !completedIds.has(id)));
  const relevantEntries = timeline.filter(
    (entry) => completedIds.has(entry.purchase.id) || activatedIds.has(entry.purchase.id),
  );

  if (relevantEntries.length === 0) {
    return <span className="text-slate-300">—</span>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-slate-600 hover:text-slate-800"
      >
        {completedIds.size > 0 ? (
          <span className="flex items-center gap-1">
            <Badge variant="warning">✓ {completedIds.size}</Badge>
          </span>
        ) : null}
        {startedOnlyIds.size > 0 ? (
          <span className="flex items-center gap-1">
            <Badge variant="brand">▶ {startedOnlyIds.size}</Badge>
          </span>
        ) : null}
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {expanded ? (
        <div className="mt-2 space-y-1 border-l-2 border-slate-100 pl-2">
          {relevantEntries.map((entry) => {
            const wasCompleted = completedIds.has(entry.purchase.id);
            const wasActivated = activatedIds.has(entry.purchase.id);
            return (
              <div key={entry.purchase.id} className="flex items-center gap-1.5 whitespace-nowrap text-xs">
                <Badge variant={wasCompleted ? "warning" : "brand"}>
                  {wasCompleted ? "Completado" : "Iniciado"}
                </Badge>
                <span className="text-slate-500">
                  {entry.purchase.classesAmount} clases
                  {wasActivated ? ` · inicio ${formatShortDate(entry.activatedAt!)}` : ""}
                  {wasCompleted ? ` · fin ${formatShortDate(entry.completedAt!)}` : ""}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

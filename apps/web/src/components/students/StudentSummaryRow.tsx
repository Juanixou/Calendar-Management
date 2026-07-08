import { Link } from "react-router-dom";
import type { MonthlySummary, PackProgress, PackTimelineEntry, Student } from "@gestion-clases/core";
import { getCurrentPack } from "@gestion-clases/core";
import { LevelBadge } from "./LevelBadge";
import { PackProgressBadge } from "./PackProgressBadge";
import { PackActivityCell } from "./PackActivityCell";
import { formatCurrency } from "../../lib/currency";

export function StudentSummaryRow({
  student,
  summary,
  packProgress,
  packTimeline,
  year,
  month,
  pricePerClass,
  linkToDetail = true,
}: {
  student: Student;
  summary: MonthlySummary | undefined;
  packProgress: PackProgress[] | undefined;
  packTimeline: PackTimelineEntry[] | undefined;
  year: number;
  month: number;
  pricePerClass: number;
  /** False for the admin payments table, where there's no /alumnos/:id route for another teacher's student. */
  linkToDetail?: boolean;
}) {
  const income = summary ? summary.billableHours * pricePerClass : undefined;
  const currentPack = packProgress ? getCurrentPack(packProgress) : undefined;

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-3 pr-4">
        {linkToDetail ? (
          <Link to={`/alumnos/${student.id}`} className="font-medium text-slate-800 hover:text-brand-600">
            {student.name}
          </Link>
        ) : (
          <span className="font-medium text-slate-800">{student.name}</span>
        )}
      </td>
      <td className="py-3 pr-4">
        <LevelBadge level={student.level} />
      </td>
      <td className="py-3 pr-4">{packProgress ? <PackProgressBadge pack={currentPack} /> : "…"}</td>
      <td className="py-3 pr-4">
        <PackActivityCell timeline={packTimeline} year={year} month={month} />
      </td>
      <td className="py-3 pr-4 text-right tabular-nums text-slate-700">{summary?.hoursTaught ?? "…"}</td>
      <td className="py-3 pr-4 text-right tabular-nums text-slate-500">{summary?.consumed ?? "…"}</td>
      <td className="py-3 pr-4 text-right tabular-nums text-slate-500">{summary?.cancelled ?? "…"}</td>
      <td className="py-3 text-right tabular-nums text-slate-700">
        {income !== undefined ? formatCurrency(income) : "…"}
      </td>
    </tr>
  );
}

import { useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { useAdminMonthlySummaries, useAdminStudents, useAdminTeacherProfile } from "../../hooks/useAdminTeacherData";
import { LevelBadge } from "../students/LevelBadge";
import { MonthSwitcher, type MonthCursor } from "../shared/MonthSwitcher";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { formatCurrency } from "../../lib/currency";

export function AdminPaymentsSummary({ teacherId }: { teacherId: string }) {
  const { data: allStudents = [] } = useAdminStudents(teacherId);
  const students = allStudents.filter((s) => s.active);
  const { data: profile } = useAdminTeacherProfile(teacherId);
  const pricePerClass = profile?.pricePerClass ?? 0;

  const now = new Date();
  const [monthCursor, setMonthCursor] = useState<MonthCursor>({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });

  const summaries = useAdminMonthlySummaries(teacherId, students, monthCursor.year, monthCursor.month);

  const totals = useMemo(
    () =>
      summaries.reduce(
        (acc, { summary }) => {
          if (!summary) return acc;
          return {
            hoursTaught: acc.hoursTaught + summary.hoursTaught,
            consumed: acc.consumed + summary.consumed,
            cancelled: acc.cancelled + summary.cancelled,
            income: acc.income + summary.billableHours * pricePerClass,
          };
        },
        { hoursTaught: 0, consumed: 0, cancelled: 0, income: 0 },
      ),
    [summaries, pricePerClass],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <MonthSwitcher cursor={monthCursor} onChange={setMonthCursor} />
        <Button variant="secondary" size="sm" onClick={() => window.print()} disabled={students.length === 0}>
          <Printer className="h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      {pricePerClass === 0 ? (
        <p className="text-sm text-slate-500 print:hidden">
          Este profesor todavía no ha configurado su precio por clase, así que los ingresos no se pueden calcular.
        </p>
      ) : null}

      {students.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500">Este profesor todavía no tiene alumnos.</Card>
      ) : (
        <Card className="overflow-x-auto p-5 print:border-none print:shadow-none">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-4 font-medium">Alumno</th>
                <th className="py-2 pr-4 font-medium">Nivel</th>
                <th className="py-2 pr-4 text-right font-medium">Horas impartidas</th>
                <th className="py-2 pr-4 text-right font-medium">Clases agendadas</th>
                <th className="py-2 pr-4 text-right font-medium">Clases canceladas</th>
                <th className="py-2 text-right font-medium">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map(({ student, summary }) => (
                <tr key={student.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 pr-4 font-medium text-slate-800">{student.name}</td>
                  <td className="py-3 pr-4">
                    <LevelBadge level={student.level} />
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-slate-700">{summary?.hoursTaught ?? "…"}</td>
                  <td className="py-3 pr-4 text-right tabular-nums text-slate-500">{summary?.consumed ?? "…"}</td>
                  <td className="py-3 pr-4 text-right tabular-nums text-slate-500">{summary?.cancelled ?? "…"}</td>
                  <td className="py-3 text-right tabular-nums text-slate-700">
                    {summary ? formatCurrency(summary.billableHours * pricePerClass) : "…"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 text-sm font-semibold text-slate-800">
                <td className="py-3 pr-4" colSpan={2}>
                  Total
                </td>
                <td className="py-3 pr-4 text-right tabular-nums">{round2(totals.hoursTaught)}</td>
                <td className="py-3 pr-4 text-right tabular-nums">{round2(totals.consumed)}</td>
                <td className="py-3 pr-4 text-right tabular-nums">{round2(totals.cancelled)}</td>
                <td className="py-3 text-right tabular-nums">{formatCurrency(totals.income)}</td>
              </tr>
            </tfoot>
          </table>
        </Card>
      )}
    </div>
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

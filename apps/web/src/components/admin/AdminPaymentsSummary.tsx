import { useMemo, useState } from "react";
import { Printer } from "lucide-react";
import {
  useAdminMonthlySummaries,
  useAdminPackProgressesForMonth,
  useAdminPackTimelines,
  useAdminStudents,
  useAdminTeacherProfile,
} from "../../hooks/useAdminTeacherData";
import { StudentSummaryRow } from "../students/StudentSummaryRow";
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
  const packProgresses = useAdminPackProgressesForMonth(teacherId, students, monthCursor.year, monthCursor.month);
  const packTimelines = useAdminPackTimelines(teacherId, students);
  const rows = summaries.map(({ student, summary }, index) => ({
    student,
    summary,
    packProgress: packProgresses[index]?.packProgress,
    packTimeline: packTimelines[index]?.timeline,
  }));

  const totals = useMemo(
    () =>
      rows.reduce(
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
    [rows, pricePerClass],
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
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-4 font-medium">Alumno</th>
                <th className="py-2 pr-4 font-medium">Nivel</th>
                <th className="py-2 pr-4 font-medium">Bono actual</th>
                <th className="py-2 pr-4 font-medium">Actividad de bonos</th>
                <th className="py-2 pr-4 text-right font-medium">Horas impartidas</th>
                <th className="py-2 pr-4 text-right font-medium">Clases agendadas</th>
                <th className="py-2 pr-4 text-right font-medium">Clases canceladas</th>
                <th className="py-2 text-right font-medium">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ student, summary, packProgress, packTimeline }) => (
                <StudentSummaryRow
                  key={student.id}
                  student={student}
                  summary={summary}
                  packProgress={packProgress}
                  packTimeline={packTimeline}
                  year={monthCursor.year}
                  month={monthCursor.month}
                  pricePerClass={pricePerClass}
                  linkToDetail={false}
                />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 text-sm font-semibold text-slate-800">
                <td className="py-3 pr-4" colSpan={4}>
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

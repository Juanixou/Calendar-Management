import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Printer } from "lucide-react";
import { useStudents } from "../hooks/useStudents";
import { useMonthlySummaries, usePackProgresses, usePackTimelines, useYearlySummaries } from "../hooks/useMonthlySummary";
import { useTeacherProfile } from "../hooks/useTeacherProfile";
import { StudentSummaryRow } from "../components/students/StudentSummaryRow";
import { MonthSwitcher, type MonthCursor } from "../components/shared/MonthSwitcher";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { MONTH_LABELS } from "../lib/monthLabels";
import { formatCurrency } from "../lib/currency";

export function SummaryPage() {
  const { data: allStudents = [] } = useStudents();
  const students = allStudents.filter((s) => s.active);
  const { data: profile } = useTeacherProfile();
  const pricePerClass = profile?.pricePerClass ?? 0;

  const now = new Date();
  const [monthCursor, setMonthCursor] = useState<MonthCursor>({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });

  const summaries = useMonthlySummaries(students, monthCursor.year, monthCursor.month);
  const packProgresses = usePackProgresses(students, monthCursor.year, monthCursor.month, true);
  const packTimelines = usePackTimelines(students, true);
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

  const yearlySummaries = useYearlySummaries(students, monthCursor.year);
  const yearlyTotals = useMemo(
    () =>
      yearlySummaries.reduce(
        (acc, { summary }) => {
          if (!summary) return acc;
          return {
            hoursTaught: acc.hoursTaught + summary.hoursTaught,
            income: acc.income + summary.billableHours * pricePerClass,
          };
        },
        { hoursTaught: 0, income: 0 },
      ),
    [yearlySummaries, pricePerClass],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Resumen</h1>
          <p className="text-sm text-slate-500">Horas impartidas, actividad de bonos e ingresos por alumno.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Card className="flex items-center gap-4 px-3 py-1.5 text-sm">
            <span className="text-slate-500">
              Total {monthCursor.year}: <span className="font-semibold text-slate-800">{round2(yearlyTotals.hoursTaught)}h</span>
            </span>
            <span className="text-slate-500">
              Ingresos: <span className="font-semibold text-slate-800">{formatCurrency(yearlyTotals.income)}</span>
            </span>
          </Card>
          <MonthSwitcher cursor={monthCursor} onChange={setMonthCursor} />
          <Button variant="secondary" size="sm" onClick={() => window.print()} disabled={students.length === 0}>
            <Printer className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <div className="hidden print:block">
        <h1 className="text-xl font-bold text-slate-900">
          Resumen · {MONTH_LABELS[monthCursor.month - 1]} {monthCursor.year}
        </h1>
        <p className="text-sm text-slate-500">
          Generado el {new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(new Date())}
        </p>
      </div>

      {pricePerClass === 0 ? (
        <p className="text-sm text-slate-500 print:hidden">
          Configura tu{" "}
          <Link to="/perfil" className="font-medium text-brand-600 hover:underline">
            precio por clase
          </Link>{" "}
          para calcular los ingresos.
        </p>
      ) : null}

      {students.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500">Todavía no hay alumnos.</Card>
      ) : (
        <>
          <p className="text-xs text-slate-400 sm:hidden print:hidden">
            Desliza la tabla hacia los lados para ver todas las columnas →
          </p>
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
        </>
      )}
    </div>
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

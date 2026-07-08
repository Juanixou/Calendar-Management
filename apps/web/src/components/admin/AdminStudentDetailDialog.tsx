import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import type { Student } from "@gestion-clases/core";
import { durationHours } from "@gestion-clases/core";
import {
  useAdminClassPacksByStudent,
  useAdminClassSessionsByStudent,
  useAdminCreateClassPack,
  useAdminMonthlySummary,
  useAdminPackTimeline,
  useAdminStudentBalance,
} from "../../hooks/useAdminTeacherData";
import { AddClassPackDialog } from "../students/AddClassPackDialog";
import { LevelBadge } from "../students/LevelBadge";
import { BalanceBadge } from "../students/BalanceBadge";
import { PackProgressBadge } from "../students/PackProgressBadge";
import { Badge } from "../ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { Dialog, DialogContent } from "../ui/Dialog";
import { MonthSwitcher } from "../shared/MonthSwitcher";
import { formatDateTime, timezoneOffsetLabel } from "../../lib/timezone";
import { STATUS_LABEL } from "../../lib/classSessionLabels";

/** Read-only mirror of StudentDetailPage for admins browsing another teacher's student — no
 * edit/archive/delete/schedule actions, only "Añadir bono" which admins are already allowed. */
export function AdminStudentDetailDialog({
  teacherId,
  student,
  onOpenChange,
}: {
  teacherId: string;
  student: Student | null;
  onOpenChange: (open: boolean) => void;
}) {
  const studentId = student?.id;
  const { data: balance } = useAdminStudentBalance(teacherId, studentId);
  const { data: packs = [] } = useAdminClassPacksByStudent(teacherId, studentId);
  const { data: sessions = [] } = useAdminClassSessionsByStudent(teacherId, studentId);
  const { data: packTimeline = [] } = useAdminPackTimeline(teacherId, studentId, true);
  const createPack = useAdminCreateClassPack(teacherId);

  const [packDialogOpen, setPackDialogOpen] = useState(false);
  const now = new Date();
  const [monthCursor, setMonthCursor] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const { data: summary } = useAdminMonthlySummary(teacherId, studentId, monthCursor.year, monthCursor.month);

  const sortedSessions = useMemo(() => [...sessions].sort((a, b) => b.start.localeCompare(a.start)), [sessions]);

  if (!student) return null;

  return (
    <Dialog open={!!student} onOpenChange={onOpenChange}>
      <DialogContent title={student.name} className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <LevelBadge level={student.level} />
                {!student.active ? <Badge variant="neutral">Archivado</Badge> : null}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {student.timezone.replace("_", " ")} · {timezoneOffsetLabel(student.timezone)} respecto a España
              </p>
              {student.notes ? <p className="mt-1 text-sm text-slate-500">{student.notes}</p> : null}
            </div>
            <BalanceBadge balance={balance ?? 0} />
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Bonos de clases</CardTitle>
              <Button size="sm" onClick={() => setPackDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Añadir bono
              </Button>
            </CardHeader>
            <CardContent>
              {packs.length === 0 ? (
                <p className="text-sm text-slate-500">Este alumno todavía no ha comprado ningún bono.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {[...packs].reverse().map((pack) => {
                    const progress = packTimeline.find((p) => p.purchase.id === pack.id);
                    return (
                      <li key={pack.id} className="py-2 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-slate-700">{pack.classesAmount} clases</p>
                          <PackProgressBadge pack={progress} />
                        </div>
                        <p className="text-xs text-slate-500">
                          {formatDateTime(pack.purchasedAt, "Europe/Madrid")}
                          {pack.note ? ` · ${pack.note}` : ""}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Resumen mensual</CardTitle>
              <MonthSwitcher cursor={monthCursor} onChange={setMonthCursor} />
            </CardHeader>
            <CardContent>
              {summary ? (
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <SummaryStat label="Clases compradas" value={summary.purchased} />
                  <SummaryStat label="Clases agendadas" value={summary.consumed} />
                  <SummaryStat label="Horas impartidas" value={summary.hoursTaught} />
                  <SummaryStat label="Clases canceladas" value={summary.cancelled} />
                  <SummaryStat label="Saldo a fin de mes" value={summary.balanceEnd} />
                </dl>
              ) : (
                <p className="text-sm text-slate-500">Sin datos.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historial de clases</CardTitle>
            </CardHeader>
            <CardContent>
              {sortedSessions.length === 0 ? (
                <p className="text-sm text-slate-500">Este alumno todavía no tiene clases.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {sortedSessions.slice(0, 15).map((session) => (
                    <li key={session.id} className="py-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-slate-700">
                          {formatDateTime(session.start, "Europe/Madrid")}
                          {session.type === "group" ? <Badge variant="brand">Grupal</Badge> : null}
                        </span>
                        <span className="text-slate-500">{durationHours(session)}h</span>
                        <span className="text-slate-500">{STATUS_LABEL[session.status]}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <AddClassPackDialog
          open={packDialogOpen}
          onOpenChange={setPackDialogOpen}
          submitting={createPack.isPending}
          onCreate={(input) =>
            createPack.mutate({ ...input, studentId: student.id }, { onSuccess: () => setPackDialogOpen(false) })
          }
        />
      </DialogContent>
    </Dialog>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-lg font-semibold text-slate-800">{value}</dd>
    </div>
  );
}

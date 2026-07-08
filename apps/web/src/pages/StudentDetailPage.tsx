import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Archive, ArchiveRestore, ArrowLeft, CalendarPlus, Pencil, Plus, Trash2 } from "lucide-react";
import { useStudent, useDeleteStudent, useUpdateStudent } from "../hooks/useStudents";
import { useClassPacksByStudent, useCreateClassPack, useDeleteClassPack } from "../hooks/useClassPacks";
import { useClassSessionsByStudent, useScheduleClassOccurrences } from "../hooks/useClassSessions";
import { useMonthlySummary, usePackTimeline, useStudentBalance } from "../hooks/useMonthlySummary";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { LevelBadge } from "../components/students/LevelBadge";
import { BalanceBadge } from "../components/students/BalanceBadge";
import { PackProgressBadge } from "../components/students/PackProgressBadge";
import { Badge } from "../components/ui/Badge";
import { AddClassPackDialog } from "../components/students/AddClassPackDialog";
import { StudentForm } from "../components/students/StudentForm";
import { WeeklyScheduleDialog } from "../components/students/WeeklyScheduleDialog";
import { Dialog, DialogContent } from "../components/ui/Dialog";
import { formatDateTime, formatShortDate, timezoneOffsetLabel } from "../lib/timezone";
import { STATUS_LABEL } from "../lib/classSessionLabels";
import { durationHours, type ClassSessionStatus } from "@gestion-clases/core";
import { MonthSwitcher } from "../components/shared/MonthSwitcher";
import { cn } from "../lib/cn";

type HistoryFilter = "all" | ClassSessionStatus;

const HISTORY_TABS: { value: HistoryFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "scheduled", label: "Programadas" },
  { value: "completed", label: "Completadas" },
  { value: "cancelled", label: "Canceladas" },
];

export function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { data: student } = useStudent(studentId);
  const { data: balance } = useStudentBalance(studentId);
  const { data: packs = [] } = useClassPacksByStudent(studentId);
  const { data: sessions = [] } = useClassSessionsByStudent(studentId);

  const createPack = useCreateClassPack();
  const deletePack = useDeleteClassPack();
  const deleteStudent = useDeleteStudent();
  const updateStudent = useUpdateStudent();
  const scheduleWeekly = useScheduleClassOccurrences();

  const [packDialogOpen, setPackDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [weeklyDialogOpen, setWeeklyDialogOpen] = useState(false);

  const now = new Date();
  const [monthCursor, setMonthCursor] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const { data: summary } = useMonthlySummary(studentId, monthCursor.year, monthCursor.month);
  const { data: packTimeline = [] } = usePackTimeline(studentId, true);

  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [showFullHistory, setShowFullHistory] = useState(false);

  const sortedSessions = useMemo(() => [...sessions].sort((a, b) => b.start.localeCompare(a.start)), [sessions]);
  const filteredSessions = useMemo(
    () => (historyFilter === "all" ? sortedSessions : sortedSessions.filter((s) => s.status === historyFilter)),
    [sortedSessions, historyFilter],
  );
  const visibleSessions = showFullHistory ? filteredSessions : filteredSessions.slice(0, 15);

  if (!student || !studentId) {
    return <p className="text-sm text-slate-500">Cargando alumno...</p>;
  }

  return (
    <div className="space-y-6">
      <Link to="/alumnos" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" />
        Alumnos
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">{student.name}</h1>
            <LevelBadge level={student.level} />
            {!student.active ? <Badge variant="neutral">Archivado</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {student.timezone.replace("_", " ")} · {timezoneOffsetLabel(student.timezone)} respecto a España
          </p>
          {student.notes ? <p className="mt-1 text-sm text-slate-500">{student.notes}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <BalanceBadge balance={balance ?? 0} />
          <Button variant="secondary" size="sm" onClick={() => setWeeklyDialogOpen(true)}>
            <CalendarPlus className="h-4 w-4" />
            Programar horario semanal
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setEditDialogOpen(true)} aria-label="Editar alumno">
            <Pencil className="h-4 w-4 text-slate-400" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => updateStudent.mutate({ id: student.id, patch: { active: !student.active } })}
            aria-label={student.active ? "Archivar alumno" : "Reactivar alumno"}
            title={student.active ? "Archivar alumno" : "Reactivar alumno"}
          >
            {student.active ? (
              <Archive className="h-4 w-4 text-slate-400" />
            ) : (
              <ArchiveRestore className="h-4 w-4 text-slate-400" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (confirm(`¿Eliminar a ${student.name}? Esta acción no se puede deshacer.`)) {
                deleteStudent.mutate(student.id, { onSuccess: () => navigate("/alumnos") });
              }
            }}
          >
            <Trash2 className="h-4 w-4 text-slate-400" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
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
                    <li key={pack.id} className="flex items-center justify-between py-2 text-sm">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-slate-700">{pack.classesAmount} clases</p>
                          <PackProgressBadge pack={progress} />
                        </div>
                        <p className="text-xs text-slate-500">
                          {formatDateTime(pack.purchasedAt, "Europe/Madrid")}
                          {pack.note ? ` · ${pack.note}` : ""}
                        </p>
                        {progress?.activatedAt || progress?.completedAt ? (
                          <p className="text-xs text-slate-400">
                            {progress.activatedAt ? `Iniciado ${formatShortDate(progress.activatedAt)}` : null}
                            {progress.activatedAt && progress.completedAt ? " · " : ""}
                            {progress.completedAt ? `Completado ${formatShortDate(progress.completedAt)}` : null}
                          </p>
                        ) : null}
                      </div>
                      <button
                        onClick={() => deletePack.mutate(pack.id)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                        aria-label="Eliminar bono"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Historial de clases</CardTitle>
          <div className="flex rounded-md border border-slate-200 bg-white p-1">
            {HISTORY_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setHistoryFilter(tab.value)}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-700",
                  historyFilter === tab.value && "bg-brand-50 text-brand-700",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {filteredSessions.length === 0 ? (
            <p className="text-sm text-slate-500">No hay clases que coincidan con este filtro.</p>
          ) : (
            <>
              <ul className="divide-y divide-slate-100">
                {visibleSessions.map((session) => (
                  <li key={session.id} className="py-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-700">
                        {formatDateTime(session.start, "Europe/Madrid")}
                        {session.type === "group" ? <Badge variant="brand">Grupal</Badge> : null}
                      </span>
                      <span className="text-slate-500">{durationHours(session)}h</span>
                      <span className="text-slate-500">{STATUS_LABEL[session.status]}</span>
                    </div>
                    {session.notes ? <p className="mt-1 text-xs text-slate-400">{session.notes}</p> : null}
                  </li>
                ))}
              </ul>
              {filteredSessions.length > 15 ? (
                <button
                  onClick={() => setShowFullHistory((prev) => !prev)}
                  className="mt-3 text-xs font-medium text-brand-600 hover:underline"
                >
                  {showFullHistory ? "Ver solo las más recientes" : `Ver todo el historial (${filteredSessions.length})`}
                </button>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent title="Editar alumno">
          <StudentForm
            initial={student}
            onCancel={() => setEditDialogOpen(false)}
            onSubmit={(input) =>
              updateStudent.mutate(
                { id: student.id, patch: input },
                { onSuccess: () => setEditDialogOpen(false) },
              )
            }
            submitLabel="Guardar cambios"
          />
        </DialogContent>
      </Dialog>

      <AddClassPackDialog
        open={packDialogOpen}
        onOpenChange={setPackDialogOpen}
        submitting={createPack.isPending}
        onCreate={(input) =>
          createPack.mutate({ ...input, studentId }, { onSuccess: () => setPackDialogOpen(false) })
        }
      />

      <WeeklyScheduleDialog
        open={weeklyDialogOpen}
        onOpenChange={setWeeklyDialogOpen}
        studentId={studentId}
        submitting={scheduleWeekly.isPending}
        onCreate={(occurrences) =>
          scheduleWeekly.mutate(occurrences, { onSuccess: () => setWeeklyDialogOpen(false) })
        }
      />
    </div>
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

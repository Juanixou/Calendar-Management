import { useMemo, useState } from "react";
import { CalendarX2, Clock } from "lucide-react";
import { durationHours } from "@gestion-clases/core";
import { useStudents } from "../hooks/useStudents";
import {
  useClassSessionsInRange,
  useCompleteClass,
  useCancelClass,
  useMoveClass,
  useDeleteClass,
  useUpdateSessionNotes,
} from "../hooks/useClassSessions";
import {
  getWeekRange,
  getMonthRange,
  dateKeyInTimeZone,
  formatTime,
  timezoneOffsetLabel,
  TEACHER_TIMEZONE,
} from "../lib/timezone";
import { GROUP_CLASS_COLOR, resolveStudentColor } from "../lib/studentColor";
import { STATUS_LABEL } from "../lib/classSessionLabels";
import { groupSessions, type SessionGroup } from "../lib/sessionGrouping";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { LevelBadge } from "../components/students/LevelBadge";
import { SessionDetailsDialog, type SessionEntry } from "../components/calendar/SessionDetailsDialog";
import { LowBalanceAlert } from "../components/students/LowBalanceAlert";
import { cn } from "../lib/cn";

type ViewMode = "today" | "week";

export function DashboardPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("today");
  const todayKey = useMemo(() => dateKeyInTimeZone(new Date().toISOString()), []);
  const weekRange = useMemo(() => getWeekRange(TEACHER_TIMEZONE), []);
  const monthRange = useMemo(() => getMonthRange(TEACHER_TIMEZONE), []);

  const { data: students = [] } = useStudents();
  const { data: weekSessions = [] } = useClassSessionsInRange(weekRange.start, weekRange.end);
  const { data: monthSessions = [] } = useClassSessionsInRange(monthRange.start, monthRange.end);

  const completeClass = useCompleteClass();
  const cancelClass = useCancelClass();
  const moveClass = useMoveClass();
  const deleteClass = useDeleteClass();
  const updateSessionNotes = useUpdateSessionNotes();

  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
  const studentsById = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  const weekGroups = useMemo(() => {
    const groups = groupSessions(weekSessions, studentsById);
    return [...groups].sort((a, b) => a.sessions[0]!.start.localeCompare(b.sessions[0]!.start));
  }, [weekSessions, studentsById]);

  const todayGroups = useMemo(
    () => weekGroups.filter((g) => dateKeyInTimeZone(g.sessions[0]!.start) === todayKey),
    [weekGroups, todayKey],
  );

  const groupsByDay = useMemo(() => {
    const byDay = new Map<string, SessionGroup[]>();
    for (const group of weekGroups) {
      const key = dateKeyInTimeZone(group.sessions[0]!.start);
      const list = byDay.get(key) ?? [];
      list.push(group);
      byDay.set(key, list);
    }
    return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [weekGroups]);

  const workloadHours = (sessions: typeof weekSessions) =>
    round1(sessions.filter((s) => s.status !== "cancelled").reduce((sum, s) => sum + durationHours(s), 0));
  const weekWorkload = workloadHours(weekSessions);
  const monthWorkload = workloadHours(monthSessions);

  const visibleGroups = viewMode === "today" ? todayGroups : weekGroups;
  const selectedGroup = visibleGroups.find((g) => g.key === selectedGroupKey);
  const selectedEntries: SessionEntry[] = selectedGroup
    ? selectedGroup.sessions
        .map((session) => {
          const student = studentsById.get(session.studentId);
          return student ? { session, student } : undefined;
        })
        .filter((entry): entry is SessionEntry => !!entry)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{viewMode === "today" ? "Hoy" : "Esta semana"}</h1>
          <p className="text-sm text-slate-500">
            {new Intl.DateTimeFormat("es-ES", { dateStyle: "full" }).format(new Date())}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-md border border-slate-200 bg-white p-1">
            {(["today", "week"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "rounded px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700",
                  viewMode === mode && "bg-brand-50 text-brand-700",
                )}
              >
                {mode === "today" ? "Hoy" : "Esta semana"}
              </button>
            ))}
          </div>
          <Card className="flex items-center gap-4 px-3 py-1.5 text-sm">
            <span className="text-slate-500">
              Semana: <span className="font-semibold text-slate-800">{weekWorkload}h</span>
            </span>
            <span className="text-slate-500">
              Mes: <span className="font-semibold text-slate-800">{monthWorkload}h</span>
            </span>
          </Card>
        </div>
      </div>

      <LowBalanceAlert students={students} />

      {visibleGroups.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-10 text-center text-slate-500">
          <CalendarX2 className="h-8 w-8 text-slate-300" />
          <p className="text-sm">
            {viewMode === "today" ? "No tienes clases programadas para hoy." : "No tienes clases programadas esta semana."}
          </p>
        </Card>
      ) : viewMode === "today" ? (
        <div className="space-y-3">
          {todayGroups.map((group) => (
            <TodaySessionCard
              key={group.key}
              group={group}
              onOpen={() => setSelectedGroupKey(group.key)}
              onComplete={(id) => completeClass.mutate(id)}
              onCancel={(id) => cancelClass.mutate(id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {groupsByDay.map(([dayKey, groups]) => (
            <div key={dayKey}>
              <h2 className="mb-2 text-sm font-semibold capitalize text-slate-600">{formatDayHeading(dayKey)}</h2>
              <div className="space-y-3">
                {groups.map((group) => (
                  <TodaySessionCard
                    key={group.key}
                    group={group}
                    onOpen={() => setSelectedGroupKey(group.key)}
                    onComplete={(id) => completeClass.mutate(id)}
                    onCancel={(id) => cancelClass.mutate(id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <SessionDetailsDialog
        entries={selectedEntries}
        onOpenChange={(open) => !open && setSelectedGroupKey(null)}
        onComplete={(id) => completeClass.mutate(id)}
        onCancel={(id) => cancelClass.mutate(id)}
        onMove={(id, start, end) => moveClass.mutate({ sessionId: id, start, end })}
        onDelete={(id) => deleteClass.mutate(id)}
        onSaveNotes={(id, notes) => updateSessionNotes.mutate({ sessionId: id, notes })}
      />
    </div>
  );
}

function formatDayHeading(dayKey: string): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  const date = new Date(year!, month! - 1, day!);
  return new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" }).format(date);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function TodaySessionCard({
  group,
  onOpen,
  onComplete,
  onCancel,
}: {
  group: SessionGroup;
  onOpen: () => void;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const isGroup = group.students.length > 1;
  const representative = group.sessions[0]!;
  const color = isGroup ? GROUP_CLASS_COLOR : group.students[0] ? resolveStudentColor(group.students[0]) : "#94a3b8";

  if (!isGroup) {
    const student = group.students[0];
    if (!student) return null;
    return (
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <button onClick={onOpen} className="flex flex-1 items-center gap-3 text-left">
            <span className="h-10 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-slate-800">{student.name}</p>
                <LevelBadge level={student.level} />
                <Badge
                  variant={representative.status === "cancelled" ? "danger" : representative.status === "completed" ? "success" : "neutral"}
                >
                  {STATUS_LABEL[representative.status]}
                </Badge>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(representative.start, TEACHER_TIMEZONE)} – {formatTime(representative.end, TEACHER_TIMEZONE)} (España) ·{" "}
                {formatTime(representative.start, student.timezone)} ({timezoneOffsetLabel(student.timezone)}) ·{" "}
                {durationHours(representative)}h
              </p>
            </div>
          </button>

          {representative.status === "scheduled" ? (
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => onCancel(representative.id)}>
                Cancelar
              </Button>
              <Button size="sm" variant="success" onClick={() => onComplete(representative.id)}>
                Completada
              </Button>
            </div>
          ) : null}
        </div>
      </Card>
    );
  }

  const anyScheduled = group.sessions.some((session) => session.status === "scheduled");

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button onClick={onOpen} className="flex items-center gap-3 text-left">
            <span className="h-10 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <div>
              <p className="font-semibold text-slate-800">Clase grupal · {group.students.length} alumnos</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(representative.start, TEACHER_TIMEZONE)} – {formatTime(representative.end, TEACHER_TIMEZONE)} (España) ·{" "}
                {durationHours(representative)}h
              </p>
            </div>
          </button>

          {anyScheduled ? (
            <Button
              size="sm"
              variant="success"
              onClick={() => {
                for (const session of group.sessions) {
                  if (session.status === "scheduled") onComplete(session.id);
                }
              }}
            >
              Completar todos
            </Button>
          ) : null}
        </div>

        <div className="space-y-2 border-t border-slate-100 pt-3">
          {group.sessions.map((session) => {
            const student = group.students.find((s) => s.id === session.studentId);
            if (!student) return null;
            return (
              <div key={session.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-700">{student.name}</span>
                  <LevelBadge level={student.level} />
                  <Badge variant={session.status === "cancelled" ? "danger" : session.status === "completed" ? "success" : "neutral"}>
                    {STATUS_LABEL[session.status]}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {formatTime(session.start, student.timezone)} ({timezoneOffsetLabel(student.timezone)})
                  </span>
                </div>
                {session.status === "scheduled" ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => onCancel(session.id)}>
                      Cancelar
                    </Button>
                    <Button size="sm" variant="success" onClick={() => onComplete(session.id)}>
                      Completada
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

import { Link } from "react-router-dom";
import { CalendarClock } from "lucide-react";
import type { ClassSession, Student } from "@gestion-clases/core";
import { getCurrentPack } from "@gestion-clases/core";
import { usePackProgress } from "../../hooks/useMonthlySummary";
import { useNextSessionByStudent } from "../../hooks/useClassSessions";
import { LevelBadge } from "./LevelBadge";
import { PackProgressBadge } from "./PackProgressBadge";
import { Badge } from "../ui/Badge";
import { formatDateTime, TEACHER_TIMEZONE, timezoneOffsetLabel } from "../../lib/timezone";
import { Card } from "../ui/Card";
import { cn } from "../../lib/cn";

export function StudentList({
  students,
  emptyMessage = "Todavía no hay alumnos. Añade el primero para empezar a programar clases.",
}: {
  students: Student[];
  emptyMessage?: string;
}) {
  const nextSessionByStudent = useNextSessionByStudent();

  if (students.length === 0) {
    return <Card className="p-8 text-center text-sm text-slate-500">{emptyMessage}</Card>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {students.map((student) => (
        <StudentRow key={student.id} student={student} nextSession={nextSessionByStudent.get(student.id)} />
      ))}
    </div>
  );
}

function StudentRow({ student, nextSession }: { student: Student; nextSession: ClassSession | undefined }) {
  const { data: packProgress } = usePackProgress(student.id, undefined, undefined, true);
  const currentPack = packProgress ? getCurrentPack(packProgress) : undefined;
  const needsRenewal = currentPack?.status === "completed";

  return (
    <Link to={`/alumnos/${student.id}`}>
      <Card className={cn("h-full p-4 transition hover:border-brand-300 hover:shadow-md", !student.active && "opacity-60")}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="font-semibold text-slate-800">{student.name}</p>
              {!student.active ? <Badge variant="neutral">Archivado</Badge> : null}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {student.timezone.replace("_", " ")} · {timezoneOffsetLabel(student.timezone)} vs España
            </p>
          </div>
          <LevelBadge level={student.level} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <PackProgressBadge pack={currentPack} />
          {nextSession ? (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <CalendarClock className="h-3.5 w-3.5" />
              {formatDateTime(nextSession.start, TEACHER_TIMEZONE)}
            </span>
          ) : null}
        </div>
        {needsRenewal ? <p className="mt-1.5 text-xs font-medium text-amber-600">Debe renovar el bono</p> : null}
      </Card>
    </Link>
  );
}

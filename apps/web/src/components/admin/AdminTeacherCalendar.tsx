import { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import type { DatesSetArg, EventContentArg } from "@fullcalendar/core";
import { GROUP_CLASS_COLOR, resolveStudentColor } from "../../lib/studentColor";
import { groupSessions } from "../../lib/sessionGrouping";
import { useAdminClassSessionsInRange, useAdminSessionPackLabels, useAdminStudents } from "../../hooks/useAdminTeacherData";

/** Read-only calendar for admins checking a teacher's availability — no drag/drop, no click-to-edit. */
export function AdminTeacherCalendar({ teacherId }: { teacherId: string }) {
  const [range, setRange] = useState<{ start: string; end: string }>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { start: start.toISOString(), end: end.toISOString() };
  });

  const { data: students = [] } = useAdminStudents(teacherId);
  const { data: sessions = [] } = useAdminClassSessionsInRange(teacherId, range.start, range.end);
  const sessionPackLabels = useAdminSessionPackLabels(teacherId, students);

  const studentsById = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);
  const groups = useMemo(() => groupSessions(sessions, studentsById), [sessions, studentsById]);

  const events = useMemo(
    () =>
      groups.map((group) => {
        const isGroup = group.students.length > 1;
        const anyCancelled = group.sessions.every((s) => s.status === "cancelled");
        const soleStudent = !isGroup ? group.students[0] : undefined;
        const title = isGroup
          ? `Grupo: ${group.students.map((s) => s.name).join(", ")}`
          : (soleStudent?.name ?? "Alumno eliminado");
        const color = isGroup ? GROUP_CLASS_COLOR : soleStudent ? resolveStudentColor(soleStudent) : "#94a3b8";
        return {
          id: group.key,
          title,
          start: group.sessions[0]!.start,
          end: group.sessions[0]!.end,
          backgroundColor: anyCancelled ? "#cbd5e1" : color,
          borderColor: "transparent",
          textColor: "#fff",
          classNames: anyCancelled ? ["opacity-60", "line-through"] : [],
          extendedProps: soleStudent
            ? { level: soleStudent.level, bonoLabel: sessionPackLabels.get(group.sessions[0]!.id) }
            : {},
        };
      }),
    [groups, sessionPackLabels],
  );

  function handleDatesSet(arg: DatesSetArg) {
    setRange({ start: arg.start.toISOString(), end: arg.end.toISOString() });
  }

  function renderEventContent(arg: EventContentArg) {
    const { level, bonoLabel } = arg.event.extendedProps as { level?: string; bonoLabel?: string };
    return (
      <div className="overflow-hidden px-1 py-0.5 text-[11px] leading-tight">
        <div className="truncate font-medium">{arg.event.title}</div>
        {level ? (
          <div className="truncate opacity-90">
            {level} · {bonoLabel ?? "Fuera de bono"}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2 sm:p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
        locale="es"
        firstDay={1}
        height="auto"
        allDaySlot={false}
        nowIndicator
        editable={false}
        selectable={false}
        datesSet={handleDatesSet}
        events={events}
        eventContent={renderEventContent}
        slotMinTime="07:00:00"
        slotMaxTime="23:00:00"
        buttonText={{ today: "Hoy", month: "Mes", week: "Semana", day: "Día" }}
      />
    </div>
  );
}

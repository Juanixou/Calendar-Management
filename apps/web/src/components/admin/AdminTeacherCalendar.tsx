import { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import type { DatesSetArg } from "@fullcalendar/core";
import { GROUP_CLASS_COLOR, resolveStudentColor } from "../../lib/studentColor";
import { groupSessions } from "../../lib/sessionGrouping";
import { useAdminClassSessionsInRange, useAdminStudents } from "../../hooks/useAdminTeacherData";

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

  const studentsById = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);
  const groups = useMemo(() => groupSessions(sessions, studentsById), [sessions, studentsById]);

  const events = useMemo(
    () =>
      groups.map((group) => {
        const isGroup = group.students.length > 1;
        const anyCancelled = group.sessions.every((s) => s.status === "cancelled");
        const title = isGroup
          ? `Grupo: ${group.students.map((s) => s.name).join(", ")}`
          : (group.students[0]?.name ?? "Alumno eliminado");
        const color = isGroup ? GROUP_CLASS_COLOR : group.students[0] ? resolveStudentColor(group.students[0]) : "#94a3b8";
        return {
          id: group.key,
          title,
          start: group.sessions[0]!.start,
          end: group.sessions[0]!.end,
          backgroundColor: anyCancelled ? "#cbd5e1" : color,
          borderColor: "transparent",
          textColor: "#fff",
          classNames: anyCancelled ? ["opacity-60", "line-through"] : [],
        };
      }),
    [groups],
  );

  function handleDatesSet(arg: DatesSetArg) {
    setRange({ start: arg.start.toISOString(), end: arg.end.toISOString() });
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
        slotMinTime="07:00:00"
        slotMaxTime="23:00:00"
        buttonText={{ today: "Hoy", month: "Mes", week: "Semana", day: "Día" }}
      />
    </div>
  );
}

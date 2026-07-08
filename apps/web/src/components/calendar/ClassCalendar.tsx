import { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { type DateClickArg } from "@fullcalendar/interaction";
import type { EventContentArg, EventDropArg, EventClickArg, DatesSetArg } from "@fullcalendar/core";
import { GROUP_CLASS_COLOR, resolveStudentColor } from "../../lib/studentColor";
import { groupSessions } from "../../lib/sessionGrouping";
import { useStudents } from "../../hooks/useStudents";
import { useClassSessionsInRange, useScheduleClassOccurrences, useMoveClass, useCompleteClass, useCancelClass, useDeleteClass, useUpdateSessionNotes } from "../../hooks/useClassSessions";
import { useSessionPackLabels } from "../../hooks/useMonthlySummary";
import { NewSessionDialog } from "./NewSessionDialog";
import { SessionDetailsDialog, type SessionEntry } from "./SessionDetailsDialog";

export function ClassCalendar() {
  const calendarRef = useRef<FullCalendar | null>(null);
  const [range, setRange] = useState<{ start: string; end: string }>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { start: start.toISOString(), end: end.toISOString() };
  });

  const { data: students = [] } = useStudents();
  const { data: sessions = [] } = useClassSessionsInRange(range.start, range.end);
  const sessionPackLabels = useSessionPackLabels(students);

  const scheduleClass = useScheduleClassOccurrences();
  const moveClass = useMoveClass();
  const completeClass = useCompleteClass();
  const cancelClass = useCancelClass();
  const deleteClass = useDeleteClass();
  const updateSessionNotes = useUpdateSessionNotes();

  const [newSessionSlot, setNewSessionSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);

  // On narrow screens the header toolbar (nav + title + view buttons) doesn't fit on one line and
  // wraps the title text mid-phrase; move the view buttons to their own row below instead.
  const [isCompactHeader, setIsCompactHeader] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 640,
  );
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const handleChange = (event: MediaQueryList | MediaQueryListEvent) => setIsCompactHeader(event.matches);
    handleChange(mediaQuery);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const studentsById = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);
  const activeStudents = useMemo(() => students.filter((s) => s.active), [students]);
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

  function handleDatesSet(arg: DatesSetArg) {
    setRange({ start: arg.start.toISOString(), end: arg.end.toISOString() });
  }

  function handleDateClick(arg: DateClickArg) {
    const start = arg.date;
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    setNewSessionSlot({ start, end });
  }

  function handleEventClick(arg: EventClickArg) {
    setSelectedGroupKey(arg.event.id);
  }

  function handleEventDrop(arg: EventDropArg) {
    const { event } = arg;
    if (!event.start || !event.end) return;
    const group = groups.find((g) => g.key === event.id);
    if (!group) return;
    for (const session of group.sessions) {
      moveClass.mutate({ sessionId: session.id, start: event.start!.toISOString(), end: event.end!.toISOString() });
    }
  }

  const selectedGroup = groups.find((g) => g.key === selectedGroupKey);
  const selectedEntries: SessionEntry[] = selectedGroup
    ? selectedGroup.sessions
        .map((session) => {
          const student = studentsById.get(session.studentId);
          return student ? { session, student } : undefined;
        })
        .filter((entry): entry is SessionEntry => !!entry)
    : [];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2 sm:p-4">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={
          isCompactHeader
            ? { left: "prev,next", center: "title", right: "today" }
            : { left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }
        }
        footerToolbar={isCompactHeader ? { center: "dayGridMonth,timeGridWeek,timeGridDay" } : undefined}
        locale="es"
        firstDay={1}
        height="auto"
        allDaySlot={false}
        nowIndicator
        editable
        selectable
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        datesSet={handleDatesSet}
        events={events}
        eventContent={renderEventContent}
        slotMinTime="07:00:00"
        slotMaxTime="23:00:00"
        buttonText={{ today: "Hoy", month: "Mes", week: "Semana", day: "Día" }}
      />

      {newSessionSlot ? (
        <NewSessionDialog
          open={!!newSessionSlot}
          onOpenChange={(open) => !open && setNewSessionSlot(null)}
          students={activeStudents}
          defaultStart={newSessionSlot.start}
          defaultEnd={newSessionSlot.end}
          submitting={scheduleClass.isPending}
          onCreate={(occurrences) => {
            scheduleClass.mutate(occurrences, { onSuccess: () => setNewSessionSlot(null) });
          }}
        />
      ) : null}

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

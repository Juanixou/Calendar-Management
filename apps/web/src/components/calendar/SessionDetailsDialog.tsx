import { useEffect, useState } from "react";
import type { ClassSession, Student } from "@gestion-clases/core";
import { durationHours } from "@gestion-clases/core";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { Dialog, DialogContent } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Label } from "../ui/Label";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { formatTime, TEACHER_TIMEZONE, timezoneOffsetLabel } from "../../lib/timezone";
import { STATUS_LABEL } from "../../lib/classSessionLabels";

const STATUS_VARIANT: Record<ClassSession["status"], "brand" | "success" | "danger"> = {
  scheduled: "brand",
  completed: "success",
  cancelled: "danger",
};

export interface SessionEntry {
  session: ClassSession;
  student: Student;
}

export function SessionDetailsDialog({
  entries,
  onOpenChange,
  onComplete,
  onCancel,
  onMove,
  onDelete,
  onSaveNotes,
}: {
  entries: SessionEntry[];
  onOpenChange: (open: boolean) => void;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onMove: (id: string, start: string, end: string) => void;
  onDelete: (id: string) => void;
  onSaveNotes: (id: string, notes: string) => void;
}) {
  const [editingTime, setEditingTime] = useState(false);
  const [dateValue, setDateValue] = useState("");
  const [startValue, setStartValue] = useState("");
  const [endValue, setEndValue] = useState("");
  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>({});

  const entryIdsKey = entries
    .map((e) => e.session.id)
    .sort()
    .join(",");

  useEffect(() => {
    const first = entries[0];
    if (!first) return;
    setEditingTime(false);
    setDateValue(formatInTimeZone(new Date(first.session.start), TEACHER_TIMEZONE, "yyyy-MM-dd"));
    setStartValue(formatInTimeZone(new Date(first.session.start), TEACHER_TIMEZONE, "HH:mm"));
    setEndValue(formatInTimeZone(new Date(first.session.end), TEACHER_TIMEZONE, "HH:mm"));
    const drafts: Record<string, string> = {};
    for (const { session } of entries) drafts[session.id] = session.notes ?? "";
    setNotesDrafts(drafts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryIdsKey]);

  if (entries.length === 0) return null;

  const isGroup = entries.length > 1;
  const first = entries[0]!;
  const hours = durationHours(first.session);

  function saveMove() {
    const start = new Date(`${dateValue}T${startValue}:00`);
    const end = new Date(`${dateValue}T${endValue}:00`);
    for (const { session } of entries) {
      onMove(session.id, start.toISOString(), end.toISOString());
    }
    setEditingTime(false);
  }

  return (
    <Dialog open={entries.length > 0} onOpenChange={onOpenChange}>
      <DialogContent
        title={isGroup ? `Clase grupal · ${entries.length} alumnos` : first.student.name}
        description={isGroup ? `${hours}h` : `${hours}h · ${first.student.level}`}
      >
        <div className="space-y-4">
          {!editingTime ? (
            <div className="space-y-1 rounded-md bg-slate-50 px-3 py-2 text-sm">
              <p className="text-slate-700">
                <span className="font-medium">España:</span>{" "}
                {formatInTimeZone(new Date(first.session.start), TEACHER_TIMEZONE, "EEEE d MMM, HH:mm", { locale: es })} –{" "}
                {formatTime(first.session.end, TEACHER_TIMEZONE)}
              </p>
              {!isGroup ? (
                <p className="text-slate-500">
                  <span className="font-medium">
                    {first.student.name} ({timezoneOffsetLabel(first.student.timezone)}):
                  </span>{" "}
                  {formatInTimeZone(new Date(first.session.start), first.student.timezone, "EEEE d MMM, HH:mm", { locale: es })} –{" "}
                  {formatTime(first.session.end, first.student.timezone)}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => setEditingTime(true)}
                className="mt-1 text-xs font-medium text-brand-600 hover:underline"
              >
                {isGroup ? "Mover toda la clase a otro día/hora" : "Mover a otro día/hora"}
              </button>
            </div>
          ) : (
            <div className="space-y-3 rounded-md border border-slate-200 p-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="move-date">Fecha</Label>
                  <Input id="move-date" type="date" value={dateValue} onChange={(e) => setDateValue(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="move-start">Inicio</Label>
                  <Input id="move-start" type="time" value={startValue} onChange={(e) => setStartValue(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="move-end">Fin</Label>
                  <Input id="move-end" type="time" value={endValue} onChange={(e) => setEndValue(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={() => setEditingTime(false)}>
                  Cancelar
                </Button>
                <Button type="button" size="sm" onClick={saveMove}>
                  Guardar nuevo horario
                </Button>
              </div>
            </div>
          )}

          {isGroup && entries.some(({ session }) => session.status === "scheduled") ? (
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="success"
                onClick={() => {
                  for (const { session } of entries) {
                    if (session.status === "scheduled") onComplete(session.id);
                  }
                }}
              >
                Marcar todos completados
              </Button>
            </div>
          ) : null}

          <div className="space-y-3">
            {entries.map(({ session, student }) => (
              <div key={session.id} className="rounded-md border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-800">{student.name}</p>
                    <Badge variant="neutral">{student.level}</Badge>
                    <Badge variant={STATUS_VARIANT[session.status]}>{STATUS_LABEL[session.status]}</Badge>
                  </div>
                  {isGroup ? (
                    <p className="text-xs text-slate-500">
                      {student.name.split(" ")[0]} ({timezoneOffsetLabel(student.timezone)}):{" "}
                      {formatTime(session.start, student.timezone)} – {formatTime(session.end, student.timezone)}
                    </p>
                  ) : null}
                </div>

                <div className="mt-2">
                  <Textarea
                    value={notesDrafts[session.id] ?? ""}
                    onChange={(e) => setNotesDrafts((prev) => ({ ...prev, [session.id]: e.target.value }))}
                    rows={2}
                    placeholder="Temario visto, deberes, observaciones..."
                  />
                  {(notesDrafts[session.id] ?? "") !== (session.notes ?? "") ? (
                    <div className="mt-1 flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => onSaveNotes(session.id, notesDrafts[session.id] ?? "")}
                      >
                        Guardar nota
                      </Button>
                    </div>
                  ) : null}
                </div>

                <div className="mt-2 flex flex-wrap justify-end gap-2">
                  <Button variant="danger" size="sm" onClick={() => onDelete(session.id)}>
                    Eliminar
                  </Button>
                  {session.status !== "cancelled" ? (
                    <Button variant="secondary" size="sm" onClick={() => onCancel(session.id)}>
                      Marcar cancelada
                    </Button>
                  ) : null}
                  {session.status !== "completed" ? (
                    <Button variant="success" size="sm" onClick={() => onComplete(session.id)}>
                      Marcar completada
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

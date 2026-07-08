import { useEffect, useState } from "react";
import type { NewClassSession, Student } from "@gestion-clases/core";
import { Dialog, DialogContent } from "../ui/Dialog";
import { Label } from "../ui/Label";
import { Select, SelectItem } from "../ui/Select";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Button } from "../ui/Button";
import { formatTime, TEACHER_TIMEZONE, timezoneOffsetLabel } from "../../lib/timezone";
import { MAX_REPEAT_WEEKS, weeklyOccurrences } from "../../lib/recurrence";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { cn } from "../../lib/cn";

const MIN_GROUP_SIZE = 2;

type SessionMode = "individual" | "group";

export function NewSessionDialog({
  open,
  onOpenChange,
  students,
  defaultStart,
  defaultEnd,
  onCreate,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: Student[];
  defaultStart: Date;
  defaultEnd: Date;
  onCreate: (occurrences: NewClassSession[]) => void;
  submitting: boolean;
}) {
  const [mode, setMode] = useState<SessionMode>("individual");
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [groupStudentIds, setGroupStudentIds] = useState<string[]>([]);
  const [durationHours, setDurationHours] = useState(1);
  const [notes, setNotes] = useState("");
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatWeeks, setRepeatWeeks] = useState(8);

  useEffect(() => {
    if (open) {
      setMode("individual");
      setStudentId(students[0]?.id ?? "");
      setGroupStudentIds([]);
      const initialHours = Math.max(
        1,
        Math.round(((defaultEnd.getTime() - defaultStart.getTime()) / 3_600_000) * 2) / 2,
      );
      setDurationHours(initialHours);
      setNotes("");
      setRepeatWeekly(false);
      setRepeatWeeks(8);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const student = students.find((s) => s.id === studentId);
  const end = new Date(defaultStart.getTime() + durationHours * 3_600_000);
  const canSubmit = mode === "individual" ? !!studentId : groupStudentIds.length >= MIN_GROUP_SIZE;

  function toggleGroupStudent(id: string) {
    setGroupStudentIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Nueva clase"
        description={formatInTimeZone(defaultStart, TEACHER_TIMEZONE, "EEEE d MMMM, HH:mm", { locale: es })}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            const weeks = repeatWeekly ? Math.max(1, Math.min(MAX_REPEAT_WEEKS, repeatWeeks)) : 1;
            const timeOccurrences = weeklyOccurrences(defaultStart.toISOString(), end.toISOString(), weeks);
            const trimmedNotes = notes.trim() || undefined;

            const occurrences: NewClassSession[] =
              mode === "individual"
                ? timeOccurrences.map((occurrence) => ({
                    studentId,
                    notes: trimmedNotes,
                    type: "individual",
                    ...occurrence,
                  }))
                : timeOccurrences.flatMap((occurrence) => {
                    const groupId = crypto.randomUUID();
                    return groupStudentIds.map((id) => ({
                      studentId: id,
                      notes: trimmedNotes,
                      type: "group" as const,
                      groupId,
                      ...occurrence,
                    }));
                  });

            onCreate(occurrences);
          }}
          className="space-y-4"
        >
          <div className="flex rounded-md border border-slate-200 bg-white p-1">
            {(["individual", "group"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "flex-1 rounded px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700",
                  mode === m && "bg-brand-50 text-brand-700",
                )}
              >
                {m === "individual" ? "Individual" : "Grupal"}
              </button>
            ))}
          </div>

          {mode === "individual" ? (
            <div>
              <Label>Alumno</Label>
              {students.length === 0 ? (
                <p className="text-sm text-slate-500">Primero crea un alumno en la sección "Alumnos".</p>
              ) : (
                <Select value={studentId} onValueChange={setStudentId} placeholder="Selecciona un alumno">
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </Select>
              )}
            </div>
          ) : (
            <div>
              <Label>Alumnos del grupo (mínimo {MIN_GROUP_SIZE})</Label>
              {students.length < MIN_GROUP_SIZE ? (
                <p className="text-sm text-slate-500">
                  Necesitas al menos {MIN_GROUP_SIZE} alumnos activos para crear una clase grupal.
                </p>
              ) : (
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2">
                  {students.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={groupStudentIds.includes(s.id)}
                        onChange={() => toggleGroupStudent(s.id)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      {s.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="duration">Duración (horas = clases del bono)</Label>
            <Input
              id="duration"
              type="number"
              min={0.5}
              step={0.5}
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
            />
          </div>

          {mode === "individual" && student ? (
            <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Hora del alumno ({student.timezone.replace("_", " ")},{" "}
              {timezoneOffsetLabel(student.timezone)}): {formatTime(defaultStart.toISOString(), student.timezone)}
              {" – "}
              {formatTime(end.toISOString(), student.timezone)}
            </p>
          ) : null}

          <div>
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Temario a ver, deberes pendientes..."
            />
          </div>

          <div className="rounded-md border border-slate-200 p-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={repeatWeekly}
                onChange={(e) => setRepeatWeekly(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Repetir cada semana
            </label>
            {repeatWeekly ? (
              <div className="mt-2 flex items-center gap-2">
                <Input
                  type="number"
                  min={2}
                  max={MAX_REPEAT_WEEKS}
                  value={repeatWeeks}
                  onChange={(e) => setRepeatWeeks(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-sm text-slate-500">semanas seguidas (incluida esta)</span>
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit || submitting}>
              {repeatWeekly ? `Crear ${repeatWeeks} clases` : "Crear clase"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

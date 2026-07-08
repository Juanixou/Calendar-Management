import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { NewClassSession } from "@gestion-clases/core";
import { Dialog, DialogContent } from "../ui/Dialog";
import { Label } from "../ui/Label";
import { Select, SelectItem } from "../ui/Select";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { MAX_REPEAT_WEEKS, WEEKDAY_LABELS, weeklyOccurrencesForWeekday } from "../../lib/recurrence";

interface ScheduleRow {
  id: string;
  isoWeekday: number;
  hour: number;
  minute: number;
}

function newRow(): ScheduleRow {
  return { id: crypto.randomUUID(), isoWeekday: 1, hour: 15, minute: 0 };
}

/** Bulk-fills a student's recurring weekly schedule (e.g. Tuesdays 15:00 + Thursdays 20:00) without
 * needing to click each day on the calendar — starts from each weekday's next occurrence. */
export function WeeklyScheduleDialog({
  open,
  onOpenChange,
  studentId,
  onCreate,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  onCreate: (occurrences: NewClassSession[]) => void;
  submitting: boolean;
}) {
  const [rows, setRows] = useState<ScheduleRow[]>([newRow()]);
  const [durationHours, setDurationHours] = useState(1);
  const [weeks, setWeeks] = useState(8);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setRows([newRow()]);
      setDurationHours(1);
      setWeeks(8);
      setNotes("");
    }
  }, [open]);

  function updateRow(id: string, patch: Partial<ScheduleRow>) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((row) => row.id !== id));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Programar horario semanal">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (rows.length === 0) return;
            const trimmedNotes = notes.trim() || undefined;
            const clampedWeeks = Math.max(1, Math.min(MAX_REPEAT_WEEKS, weeks));

            const occurrences: NewClassSession[] = rows.flatMap((row) =>
              weeklyOccurrencesForWeekday(row.isoWeekday, row.hour, row.minute, durationHours, clampedWeeks).map(
                (occurrence) => ({
                  studentId,
                  notes: trimmedNotes,
                  type: "individual" as const,
                  ...occurrence,
                }),
              ),
            );

            onCreate(occurrences);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label>Días y horas</Label>
            {rows.map((row) => (
              <div key={row.id} className="flex items-center gap-2">
                <div className="w-40">
                  <Select
                    value={String(row.isoWeekday)}
                    onValueChange={(value) => updateRow(row.id, { isoWeekday: Number(value) })}
                  >
                    {WEEKDAY_LABELS.map((label, index) => (
                      <SelectItem key={label} value={String(index + 1)}>
                        {label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <Input
                  type="time"
                  value={`${String(row.hour).padStart(2, "0")}:${String(row.minute).padStart(2, "0")}`}
                  onChange={(e) => {
                    const [hour, minute] = e.target.value.split(":").map(Number);
                    updateRow(row.id, { hour: hour ?? 0, minute: minute ?? 0 });
                  }}
                  className="w-32"
                />
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length === 1}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                  aria-label="Quitar día"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setRows((prev) => [...prev, newRow()])}
              className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Añadir día
            </button>
          </div>

          <div>
            <Label htmlFor="weekly-duration">Duración (horas = clases del bono)</Label>
            <Input
              id="weekly-duration"
              type="number"
              min={0.5}
              step={0.5}
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
            />
          </div>

          <div>
            <Label htmlFor="weekly-weeks">Número de semanas a rellenar</Label>
            <Input
              id="weekly-weeks"
              type="number"
              min={1}
              max={MAX_REPEAT_WEEKS}
              value={weeks}
              onChange={(e) => setWeeks(Number(e.target.value))}
            />
          </div>

          <div>
            <Label htmlFor="weekly-notes">Notas (opcional, se aplican a todas las clases)</Label>
            <Input id="weekly-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={rows.length === 0 || submitting}>
              Crear {rows.length * Math.max(1, Math.min(MAX_REPEAT_WEEKS, weeks))} clases
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

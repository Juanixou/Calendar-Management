import { useState } from "react";
import { Shuffle } from "lucide-react";
import type { Level, NewStudent, Student } from "@gestion-clases/core";
import { LEVELS, LEVEL_LABELS } from "@gestion-clases/core";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Textarea } from "../ui/Textarea";
import { Select, SelectItem } from "../ui/Select";
import { COMMON_STUDENT_TIMEZONES } from "../../lib/timezone";
import { PALETTE } from "../../lib/studentColor";
import { cn } from "../../lib/cn";

export function StudentForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}: {
  initial?: Student;
  onSubmit: (input: NewStudent) => void;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [level, setLevel] = useState<Level>(initial?.level ?? "A1");
  const [timezone, setTimezone] = useState(initial?.timezone ?? "Asia/Shanghai");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [color, setColor] = useState<string | undefined>(initial?.color);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({ name: name.trim(), level, timezone, notes: notes.trim() || undefined, color });
      }}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="student-name">Nombre</Label>
        <Input id="student-name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Nivel</Label>
          <Select value={level} onValueChange={(v) => setLevel(v as Level)}>
            {LEVELS.map((l) => (
              <SelectItem key={l} value={l}>
                {LEVEL_LABELS[l]}
              </SelectItem>
            ))}
          </Select>
        </div>

        <div>
          <Label>Zona horaria del alumno</Label>
          <Select value={timezone} onValueChange={setTimezone}>
            {COMMON_STUDENT_TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label>Color en el calendario</Label>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setColor(undefined)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-slate-300 text-slate-400 hover:border-slate-400",
              color === undefined && "border-solid border-brand-500 text-brand-500 ring-2 ring-brand-200",
            )}
            title="Automático"
            aria-label="Color automático"
          >
            <Shuffle className="h-3.5 w-3.5" />
          </button>
          {PALETTE.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => setColor(hex)}
              className={cn("h-8 w-8 rounded-full", color === hex && "ring-2 ring-offset-2 ring-brand-500")}
              style={{ backgroundColor: hex }}
              title={hex}
              aria-label={`Color ${hex}`}
            />
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="student-notes">Notas (opcional)</Label>
        <Textarea id="student-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}

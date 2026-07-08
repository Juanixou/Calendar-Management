import { useEffect, useState } from "react";
import type { NewNote, Note, Student } from "@gestion-clases/core";
import { useClassSessionsByStudent } from "../../hooks/useClassSessions";
import { Dialog, DialogContent } from "../ui/Dialog";
import { Label } from "../ui/Label";
import { Textarea } from "../ui/Textarea";
import { Select, SelectItem } from "../ui/Select";
import { Button } from "../ui/Button";
import { formatDateTime, TEACHER_TIMEZONE } from "../../lib/timezone";
import { STATUS_LABEL } from "../../lib/classSessionLabels";

const NO_STUDENT = "__none__";
const NO_SESSION = "__none__";

export function NoteDialog({
  open,
  onOpenChange,
  initial,
  students,
  submitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: Note | null;
  students: Student[];
  submitting: boolean;
  onSubmit: (input: NewNote) => void;
}) {
  const [text, setText] = useState("");
  const [studentId, setStudentId] = useState(NO_STUDENT);
  const [sessionId, setSessionId] = useState(NO_SESSION);

  useEffect(() => {
    if (open) {
      setText(initial?.text ?? "");
      setStudentId(initial?.studentId ?? NO_STUDENT);
      setSessionId(initial?.classSessionId ?? NO_SESSION);
    }
  }, [open, initial]);

  const { data: sessions = [] } = useClassSessionsByStudent(studentId === NO_STUDENT ? undefined : studentId);
  const sortedSessions = [...sessions].sort((a, b) => a.start.localeCompare(b.start));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={initial ? "Editar nota" : "Nueva nota"}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            onSubmit({
              text: text.trim(),
              studentId: studentId === NO_STUDENT ? undefined : studentId,
              classSessionId: studentId === NO_STUDENT || sessionId === NO_SESSION ? undefined : sessionId,
            });
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="note-text">Nota</Label>
            <Textarea
              id="note-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              autoFocus
              required
            />
          </div>

          <div>
            <Label>Alumno (opcional)</Label>
            <Select
              value={studentId}
              onValueChange={(value) => {
                setStudentId(value);
                setSessionId(NO_SESSION);
              }}
            >
              <SelectItem value={NO_STUDENT}>Sin alumno</SelectItem>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </Select>
          </div>

          {studentId !== NO_STUDENT ? (
            <div>
              <Label>Clase concreta (opcional)</Label>
              <Select value={sessionId} onValueChange={setSessionId}>
                <SelectItem value={NO_SESSION}>Sin clase concreta</SelectItem>
                {sortedSessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {formatDateTime(session.start, TEACHER_TIMEZONE)} · {STATUS_LABEL[session.status]}
                  </SelectItem>
                ))}
              </Select>
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {initial ? "Guardar cambios" : "Crear nota"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

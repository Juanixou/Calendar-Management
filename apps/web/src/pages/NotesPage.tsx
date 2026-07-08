import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Note } from "@gestion-clases/core";
import { useCreateNote, useDeleteNote, useNotes, useUpdateNote } from "../hooks/useNotes";
import { useStudents } from "../hooks/useStudents";
import { useClassSessionsByStudent } from "../hooks/useClassSessions";
import { NoteDialog } from "../components/notes/NoteDialog";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { formatDateTime, TEACHER_TIMEZONE } from "../lib/timezone";
import { STATUS_LABEL } from "../lib/classSessionLabels";

export function NotesPage() {
  const { data: notes = [], isLoading } = useNotes();
  const { data: students = [] } = useStudents();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const studentsById = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  function openCreate() {
    setEditingNote(null);
    setDialogOpen(true);
  }

  function openEdit(note: Note) {
    setEditingNote(note);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Notas</h1>
          <p className="text-sm text-slate-500">
            Apuntes privados. Puedes enlazarlas a un alumno y, si quieres, a una clase suya concreta.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nueva nota
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : notes.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500">Todavía no tienes notas.</Card>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              student={note.studentId ? studentsById.get(note.studentId) : undefined}
              onEdit={() => openEdit(note)}
              onDelete={() => {
                if (confirm("¿Eliminar esta nota?")) deleteNote.mutate(note.id);
              }}
            />
          ))}
        </div>
      )}

      <NoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editingNote}
        students={students}
        submitting={createNote.isPending || updateNote.isPending}
        onSubmit={(input) => {
          if (editingNote) {
            updateNote.mutate({ id: editingNote.id, patch: input }, { onSuccess: () => setDialogOpen(false) });
          } else {
            createNote.mutate(input, { onSuccess: () => setDialogOpen(false) });
          }
        }}
      />
    </div>
  );
}

function NoteCard({
  note,
  student,
  onEdit,
  onDelete,
}: {
  note: Note;
  student: { id: string; name: string } | undefined;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="whitespace-pre-wrap text-sm text-slate-700">{note.text}</p>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Editar nota">
            <Pencil className="h-4 w-4 text-slate-400" />
          </Button>
          <button
            onClick={onDelete}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500"
            aria-label="Eliminar nota"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {student || note.classSessionId ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {student ? (
            <Link to={`/alumnos/${student.id}`}>
              <Badge variant="brand">{student.name}</Badge>
            </Link>
          ) : null}
          {note.classSessionId && note.studentId ? (
            <SessionBadge studentId={note.studentId} sessionId={note.classSessionId} />
          ) : null}
        </div>
      ) : null}

      <p className="mt-2 text-xs text-slate-400">{formatDateTime(note.createdAt, TEACHER_TIMEZONE)}</p>
    </Card>
  );
}

function SessionBadge({ studentId, sessionId }: { studentId: string; sessionId: string }) {
  const { data: sessions = [] } = useClassSessionsByStudent(studentId);
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return null;
  return (
    <Badge variant="neutral">
      {formatDateTime(session.start, TEACHER_TIMEZONE)} · {STATUS_LABEL[session.status]}
    </Badge>
  );
}

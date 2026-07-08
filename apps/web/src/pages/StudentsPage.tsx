import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useCreateStudent, useStudents } from "../hooks/useStudents";
import { StudentList } from "../components/students/StudentList";
import { StudentForm } from "../components/students/StudentForm";
import { Dialog, DialogContent } from "../components/ui/Dialog";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../lib/cn";

type StatusFilter = "active" | "archived" | "all";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "active", label: "Activos" },
  { value: "archived", label: "Archivados" },
  { value: "all", label: "Todos" },
];

export function StudentsPage() {
  const { data: students = [], isLoading } = useStudents();
  const createStudent = useCreateStudent();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [query, setQuery] = useState("");

  const filteredStudents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return students.filter((student) => {
      const matchesStatus = statusFilter === "all" || student.active === (statusFilter === "active");
      const matchesQuery = !normalizedQuery || student.name.toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [students, statusFilter, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Alumnos</h1>
          <p className="text-sm text-slate-500">Nivel, zona horaria y saldo de clases de cada alumno.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Añadir alumno
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-md border border-slate-200 bg-white p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "rounded px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700",
                statusFilter === tab.value && "bg-brand-50 text-brand-700",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar alumno por nombre..."
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : (
        <StudentList
          students={filteredStudents}
          emptyMessage={
            statusFilter === "archived"
              ? "No tienes alumnos archivados."
              : query
                ? "Ningún alumno coincide con la búsqueda."
                : undefined
          }
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent title="Nuevo alumno">
          <StudentForm
            onCancel={() => setDialogOpen(false)}
            onSubmit={(input) => createStudent.mutate(input, { onSuccess: () => setDialogOpen(false) })}
            submitLabel="Crear alumno"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

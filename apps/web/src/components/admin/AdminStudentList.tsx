import { useState } from "react";
import { Plus } from "lucide-react";
import type { Student } from "@gestion-clases/core";
import { getCurrentPack } from "@gestion-clases/core";
import { useAdminCreateClassPack, useAdminPackProgresses, useAdminStudents } from "../../hooks/useAdminTeacherData";
import { AddClassPackDialog } from "../students/AddClassPackDialog";
import { AdminStudentDetailDialog } from "./AdminStudentDetailDialog";
import { LevelBadge } from "../students/LevelBadge";
import { PackProgressBadge } from "../students/PackProgressBadge";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { timezoneOffsetLabel } from "../../lib/timezone";

export function AdminStudentList({ teacherId }: { teacherId: string }) {
  const { data: students = [], isLoading } = useAdminStudents(teacherId);
  const packProgresses = useAdminPackProgresses(teacherId, students, true);
  const createPack = useAdminCreateClassPack(teacherId);
  const [packDialogStudent, setPackDialogStudent] = useState<Student | null>(null);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);

  if (isLoading) return <p className="text-sm text-slate-500">Cargando...</p>;
  if (students.length === 0) {
    return <Card className="p-8 text-center text-sm text-slate-500">Este profesor todavía no tiene alumnos.</Card>;
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {students.map((student) => {
          const progress = packProgresses.find((p) => p.student.id === student.id)?.packProgress;
          const currentPack = progress ? getCurrentPack(progress) : undefined;
          const needsRenewal = currentPack?.status === "completed";
          return (
            <Card
              key={student.id}
              onClick={() => setDetailStudent(student)}
              className={`cursor-pointer transition hover:border-brand-300 hover:shadow-md ${student.active ? "p-4" : "p-4 opacity-60"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="font-semibold text-slate-800">{student.name}</p>
                    {!student.active ? <Badge variant="neutral">Archivado</Badge> : null}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {student.timezone.replace("_", " ")} · {timezoneOffsetLabel(student.timezone)} vs España
                  </p>
                </div>
                <LevelBadge level={student.level} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <PackProgressBadge pack={currentPack} />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPackDialogStudent(student);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Bono
                </Button>
              </div>
              {needsRenewal ? <p className="mt-1.5 text-xs font-medium text-amber-600">Debe renovar el bono</p> : null}
            </Card>
          );
        })}
      </div>

      <AddClassPackDialog
        open={!!packDialogStudent}
        onOpenChange={(open) => !open && setPackDialogStudent(null)}
        submitting={createPack.isPending}
        onCreate={(input) => {
          if (!packDialogStudent) return;
          createPack.mutate(
            { ...input, studentId: packDialogStudent.id },
            { onSuccess: () => setPackDialogStudent(null) },
          );
        }}
      />

      <AdminStudentDetailDialog
        teacherId={teacherId}
        student={detailStudent}
        onOpenChange={(open) => !open && setDetailStudent(null)}
      />
    </div>
  );
}

import { useState } from "react";
import { X } from "lucide-react";
import { useAdminTeacherProfile } from "../../hooks/useAdminTeacherData";
import { AdminStudentList } from "./AdminStudentList";
import { AdminTeacherCalendar } from "./AdminTeacherCalendar";
import { AdminPaymentsSummary } from "./AdminPaymentsSummary";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { cn } from "../../lib/cn";

type Tab = "alumnos" | "calendario" | "pagos";

const TABS: { value: Tab; label: string }[] = [
  { value: "alumnos", label: "Alumnos" },
  { value: "calendario", label: "Calendario" },
  { value: "pagos", label: "Pagos" },
];

export function AdminTeacherDetail({ teacherId, onClose }: { teacherId: string; onClose: () => void }) {
  const { data: profile } = useAdminTeacherProfile(teacherId);
  const [tab, setTab] = useState<Tab>("alumnos");

  const name = profile ? `${profile.firstName} ${profile.lastName}`.trim() : "";

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{name || "Profesor"}</h2>
          <p className="text-sm text-slate-500">
            Alumnos y clases de solo lectura, salvo añadir bonos. Vista informativa para revisar horas y pagos.
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar detalle">
          <X className="h-4 w-4 text-slate-400" />
        </Button>
      </div>

      <div className="flex rounded-md border border-slate-200 bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "rounded px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700",
              tab === t.value && "bg-brand-50 text-brand-700",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "alumnos" ? <AdminStudentList teacherId={teacherId} /> : null}
      {tab === "calendario" ? <AdminTeacherCalendar teacherId={teacherId} /> : null}
      {tab === "pagos" ? <AdminPaymentsSummary teacherId={teacherId} /> : null}
    </Card>
  );
}

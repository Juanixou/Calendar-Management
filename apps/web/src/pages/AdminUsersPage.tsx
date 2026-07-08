import { useState } from "react";
import { useAuthContext } from "../components/auth/AuthGate";
import { useUsers, useUpdateUserRole } from "../hooks/useUsers";
import { useAdminTeacherProfiles } from "../hooks/useAdminTeacherData";
import { AdminTeacherDetail } from "../components/admin/AdminTeacherDetail";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { formatDateTime, TEACHER_TIMEZONE } from "../lib/timezone";

export function AdminUsersPage() {
  const { user, role } = useAuthContext();
  const { data: users = [], isLoading } = useUsers();
  const updateRole = useUpdateUserRole();
  const profiles = useAdminTeacherProfiles(users.map((u) => u.uid));
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  if (role !== "admin") {
    return (
      <Card className="p-8 text-center text-sm text-slate-500">No tienes permisos para ver esta página.</Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Profesores</h1>
        <p className="text-sm text-slate-500">
          Gestiona qué profesores tienen rol de administrador, y consulta los alumnos, el calendario
          y los pagos de cualquier profesor. Para dar de alta un profesor nuevo, créalo en Firebase
          Console → Authentication; en cuanto inicie sesión por primera vez aparecerá aquí
          automáticamente.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profesores registrados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-slate-500">Cargando...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-slate-500">Todavía no hay usuarios registrados.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {users.map((u) => {
                const isSelf = u.uid === user.uid;
                const profile = profiles.find((p) => p.teacherId === u.uid)?.profile;
                const displayName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : "";
                return (
                  <li key={u.uid} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-800">
                        {displayName || u.email || u.uid}
                        {isSelf ? <span className="ml-2 text-xs text-slate-400">(tú)</span> : null}
                      </p>
                      {displayName && u.email ? <p className="text-xs text-slate-400">{u.email}</p> : null}
                      {u.createdAt ? (
                        <p className="text-xs text-slate-400">
                          Alta: {formatDateTime(u.createdAt, TEACHER_TIMEZONE)}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={u.role === "admin" ? "brand" : "neutral"}>
                        {u.role === "admin" ? "Administrador" : "Profesor"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedTeacherId(u.uid)}
                      >
                        Ver detalle
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={isSelf || updateRole.isPending}
                        title={isSelf ? "No puedes cambiar tu propio rol" : undefined}
                        onClick={() =>
                          updateRole.mutate({ uid: u.uid, role: u.role === "admin" ? "teacher" : "admin" })
                        }
                      >
                        {u.role === "admin" ? "Quitar admin" : "Hacer admin"}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {selectedTeacherId ? (
        <AdminTeacherDetail teacherId={selectedTeacherId} onClose={() => setSelectedTeacherId(null)} />
      ) : null}
    </div>
  );
}

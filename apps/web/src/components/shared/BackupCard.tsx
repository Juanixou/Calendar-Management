import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Upload } from "lucide-react";
import { createBackup, restoreBackup } from "@gestion-clases/core";
import { container } from "../../lib/repositories";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";

export function BackupCard() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      const data = await createBackup(container.repositories);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `gestion-clases-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus("Copia de seguridad descargada.");
    } finally {
      setBusy(false);
    }
  }

  async function handleFileSelected(file: File) {
    if (
      !confirm(
        "Esto reemplazará todos los alumnos, bonos, clases y tu perfil actuales por los del archivo. ¿Continuar?",
      )
    ) {
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await restoreBackup(container.repositories, data);
      await queryClient.invalidateQueries();
      setStatus("Datos restaurados correctamente.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo restaurar el archivo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Copia de seguridad</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-500">
          Todos los datos viven en este navegador. Descarga una copia de vez en cuando por si se borra el
          historial del navegador o cambias de ordenador.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={handleExport} disabled={busy}>
            <Download className="h-4 w-4" />
            Descargar copia de seguridad
          </Button>
          <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={busy}>
            <Upload className="h-4 w-4" />
            Restaurar desde archivo
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) handleFileSelected(file);
            }}
          />
        </div>
        {status ? <p className="text-sm text-slate-600">{status}</p> : null}
      </CardContent>
    </Card>
  );
}

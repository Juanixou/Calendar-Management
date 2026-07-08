import type { ClassSessionStatus } from "@gestion-clases/core";

export const STATUS_LABEL: Record<ClassSessionStatus, string> = {
  scheduled: "Programada",
  completed: "Completada",
  cancelled: "Cancelada",
};

import type { PackProgress } from "@gestion-clases/core";
import { Badge } from "../ui/Badge";

export function PackProgressBadge({ pack }: { pack: PackProgress | undefined }) {
  if (!pack) return <Badge variant="neutral">Sin bono</Badge>;
  const variant = pack.status === "completed" ? "warning" : pack.status === "in_progress" ? "brand" : "neutral";
  return (
    <Badge variant={variant}>
      {pack.used}/{pack.purchase.classesAmount}
    </Badge>
  );
}

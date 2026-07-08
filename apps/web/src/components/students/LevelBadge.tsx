import type { Level } from "@gestion-clases/core";
import { Badge } from "../ui/Badge";

export function LevelBadge({ level }: { level: Level }) {
  return <Badge variant="brand">{level}</Badge>;
}

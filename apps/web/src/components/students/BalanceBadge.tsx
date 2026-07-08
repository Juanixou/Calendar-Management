import { Badge } from "../ui/Badge";

/** At or below this many remaining classes, a student is flagged as running low on their bono. */
export const LOW_BALANCE_THRESHOLD = 2;

export function BalanceBadge({ balance }: { balance: number }) {
  const variant = balance <= 0 ? "danger" : balance <= LOW_BALANCE_THRESHOLD ? "warning" : "success";
  const label = balance === 1 ? "1 clase" : `${balance} clases`;
  return <Badge variant={variant}>{label}</Badge>;
}

import { MONTH_LABELS } from "../../lib/monthLabels";

export interface MonthCursor {
  year: number;
  /** 1-12 */
  month: number;
}

export function shiftMonthCursor({ year, month }: MonthCursor, delta: number): MonthCursor {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function MonthSwitcher({
  cursor,
  onChange,
}: {
  cursor: MonthCursor;
  onChange: (cursor: MonthCursor) => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        onClick={() => onChange(shiftMonthCursor(cursor, -1))}
        className="rounded-md px-2 py-1 hover:bg-slate-100"
        aria-label="Mes anterior"
      >
        ‹
      </button>
      <span className="font-medium text-slate-700">
        {MONTH_LABELS[cursor.month - 1]} {cursor.year}
      </span>
      <button
        onClick={() => onChange(shiftMonthCursor(cursor, 1))}
        className="rounded-md px-2 py-1 hover:bg-slate-100"
        aria-label="Mes siguiente"
      >
        ›
      </button>
    </div>
  );
}

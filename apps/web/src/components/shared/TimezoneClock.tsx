import { useEffect, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { TEACHER_TIMEZONE } from "../../lib/timezone";

export function TimezoneClock({ studentTimezone }: { studentTimezone?: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-4 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
      <ClockCell label="España" timezone={TEACHER_TIMEZONE} now={now} />
      {studentTimezone && studentTimezone !== TEACHER_TIMEZONE ? (
        <>
          <span className="text-slate-300">|</span>
          <ClockCell label="Alumno" timezone={studentTimezone} now={now} />
        </>
      ) : null}
    </div>
  );
}

function ClockCell({ label, timezone, now }: { label: string; timezone: string; now: Date }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="font-mono text-sm font-semibold text-slate-800">
        {formatInTimeZone(now, timezone, "HH:mm")}
      </span>
    </div>
  );
}

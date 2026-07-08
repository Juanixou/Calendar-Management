import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";

/** The teacher always teaches from Spain. */
export const TEACHER_TIMEZONE = "Europe/Madrid";

export const COMMON_STUDENT_TIMEZONES = [
  { value: "Asia/Shanghai", label: "China continental (Pekín/Shanghái)" },
  { value: "Asia/Hong_Kong", label: "Hong Kong" },
  { value: "Asia/Taipei", label: "Taiwán" },
  { value: "Asia/Macau", label: "Macao" },
  { value: "Europe/Madrid", label: "España" },
] as const;

export function formatTime(isoDate: string, timeZone: string): string {
  return formatInTimeZone(new Date(isoDate), timeZone, "HH:mm");
}

export function formatDateTime(isoDate: string, timeZone: string): string {
  return formatInTimeZone(new Date(isoDate), timeZone, "d MMM yyyy, HH:mm", { locale: es });
}

/** Short date (e.g. "15 jul"), used for compact pack-activity indicators. Always in the teacher's timezone. */
export function formatShortDate(isoDate: string): string {
  return formatInTimeZone(new Date(isoDate), TEACHER_TIMEZONE, "d MMM", { locale: es });
}

/** Hours of difference between the student's timezone and the teacher's (Spain), e.g. "+6h" */
export function timezoneOffsetLabel(studentTimeZone: string, at: Date = new Date()): string {
  const teacherOffset = getOffsetMinutes(TEACHER_TIMEZONE, at);
  const studentOffset = getOffsetMinutes(studentTimeZone, at);
  const diffHours = (studentOffset - teacherOffset) / 60;
  const sign = diffHours >= 0 ? "+" : "";
  return `${sign}${diffHours}h`;
}

/** ISO start/end of "today" as a calendar day in the given timezone (defaults to the teacher's). */
export function getDayRange(timeZone: string = TEACHER_TIMEZONE, at: Date = new Date()): { start: string; end: string } {
  const dayString = formatInTimeZone(at, timeZone, "yyyy-MM-dd");
  const start = fromZonedTime(`${dayString}T00:00:00`, timeZone);
  const end = fromZonedTime(`${dayString}T23:59:59.999`, timeZone);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** ISO start/end of the Mon-Sun calendar week containing `at`, in the given timezone. */
export function getWeekRange(timeZone: string = TEACHER_TIMEZONE, at: Date = new Date()): { start: string; end: string } {
  const dayString = formatInTimeZone(at, timeZone, "yyyy-MM-dd");
  const isoWeekday = Number(formatInTimeZone(at, timeZone, "i")); // 1 (Mon) .. 7 (Sun)
  const [year, month, day] = dayString.split("-").map(Number) as [number, number, number];
  const monday = new Date(Date.UTC(year, month - 1, day - (isoWeekday - 1)));
  const sunday = new Date(Date.UTC(year, month - 1, day - (isoWeekday - 1) + 6));
  const start = fromZonedTime(`${toDateString(monday)}T00:00:00`, timeZone);
  const end = fromZonedTime(`${toDateString(sunday)}T23:59:59.999`, timeZone);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** ISO start/end of the calendar month containing `at`, in the given timezone. */
export function getMonthRange(timeZone: string = TEACHER_TIMEZONE, at: Date = new Date()): { start: string; end: string } {
  const [year, month] = formatInTimeZone(at, timeZone, "yyyy-MM").split("-").map(Number) as [number, number];
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const start = fromZonedTime(`${year}-${pad(month)}-01T00:00:00`, timeZone);
  const end = fromZonedTime(`${year}-${pad(month)}-${pad(lastDay)}T23:59:59.999`, timeZone);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** Calendar date (e.g. "2026-07-15") of `isoDate` as observed in the given timezone. */
export function dateKeyInTimeZone(isoDate: string, timeZone: string = TEACHER_TIMEZONE): string {
  return formatInTimeZone(new Date(isoDate), timeZone, "yyyy-MM-dd");
}

function toDateString(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function getOffsetMinutes(timeZone: string, at: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(at).reduce<Record<string, string>>((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return (asUTC - at.getTime()) / 60000;
}

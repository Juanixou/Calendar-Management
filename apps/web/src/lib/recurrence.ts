import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { TEACHER_TIMEZONE } from "./timezone";

/** Highest number of weekly occurrences a teacher can generate in one go, in either scheduling dialog. */
export const MAX_REPEAT_WEEKS = 26;

/** ISO weekday order (1=Monday..7=Sunday), matching the calendar's `firstDay={1}` convention. */
export const WEEKDAY_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

/**
 * Builds `count` weekly occurrences of a class, preserving the teacher's local wall-clock
 * time (e.g. "10:00 Spain time") even across the Spain DST transitions, which China doesn't
 * observe. Adding a fixed number of milliseconds instead would shift the local start time by
 * an hour on the week that crosses a DST change.
 */
export function weeklyOccurrences(startIso: string, endIso: string, count: number): { start: string; end: string }[] {
  const occurrences: { start: string; end: string }[] = [];
  for (let i = 0; i < count; i++) {
    occurrences.push({
      start: shiftByWeeksPreservingWallClock(startIso, i),
      end: shiftByWeeksPreservingWallClock(endIso, i),
    });
  }
  return occurrences;
}

function shiftByWeeksPreservingWallClock(iso: string, weeks: number): string {
  if (weeks === 0) return new Date(iso).toISOString();

  const wallClock = formatInTimeZone(new Date(iso), TEACHER_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
  const [datePart, timePart] = wallClock.split("T") as [string, string];
  const [year, month, day] = datePart.split("-").map(Number) as [number, number, number];
  const [hour, minute, second] = timePart.split(":").map(Number) as [number, number, number];

  // Pure calendar-date arithmetic (Date.UTC used as a neutral calculator, not a real instant).
  const shifted = new Date(Date.UTC(year, month - 1, day + weeks * 7, hour, minute, second));
  const shiftedWallClock = [
    shifted.getUTCFullYear(),
    "-",
    pad(shifted.getUTCMonth() + 1),
    "-",
    pad(shifted.getUTCDate()),
    "T",
    pad(shifted.getUTCHours()),
    ":",
    pad(shifted.getUTCMinutes()),
    ":",
    pad(shifted.getUTCSeconds()),
  ].join("");

  return fromZonedTime(shiftedWallClock, TEACHER_TIMEZONE).toISOString();
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Builds `count` weekly occurrences for a given ISO weekday (1=Monday..7=Sunday) and local
 * time-of-day, anchored to that weekday's next occurrence — today, if today already is that
 * weekday, otherwise the coming one. Used to bulk-fill a student's recurring schedule (e.g.
 * "Tuesdays at 15:00, Thursdays at 20:00") without requiring the teacher to click a specific day
 * on the calendar first.
 */
export function weeklyOccurrencesForWeekday(
  isoWeekday: number,
  hour: number,
  minute: number,
  durationHours: number,
  count: number,
): { start: string; end: string }[] {
  const todayWallClock = formatInTimeZone(new Date(), TEACHER_TIMEZONE, "yyyy-MM-dd");
  const [year, month, day] = todayWallClock.split("-").map(Number) as [number, number, number];
  const todayIsoWeekday = isoWeekdayOf(year, month, day);
  const daysAhead = (isoWeekday - todayIsoWeekday + 7) % 7;

  // Pure calendar-date arithmetic (Date.UTC used as a neutral calculator, not a real instant).
  const anchor = new Date(Date.UTC(year, month - 1, day + daysAhead));
  const anchorWallClock = `${anchor.getUTCFullYear()}-${pad(anchor.getUTCMonth() + 1)}-${pad(anchor.getUTCDate())}T${pad(hour)}:${pad(minute)}:00`;
  const startIso = fromZonedTime(anchorWallClock, TEACHER_TIMEZONE).toISOString();
  const endIso = new Date(new Date(startIso).getTime() + durationHours * 3_600_000).toISOString();

  return weeklyOccurrences(startIso, endIso, count);
}

function isoWeekdayOf(year: number, month: number, day: number): number {
  const jsWeekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0=Sunday..6=Saturday
  return jsWeekday === 0 ? 7 : jsWeekday;
}

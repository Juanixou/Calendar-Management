import { useQueries, useQuery } from "@tanstack/react-query";
import type { MonthlySummary, PackProgress, PackTimelineEntry, Student, YearlySummary } from "@gestion-clases/core";
import { services } from "../lib/repositories";

export function useStudentBalance(studentId: string | undefined) {
  return useQuery({
    queryKey: ["studentBalance", studentId],
    queryFn: () => services.monthlySummary.getStudentBalance(studentId!),
    enabled: !!studentId,
  });
}

/** Fetches the balance for every given student in one go (shares cache with useStudentBalance). */
export function useStudentBalances(students: Student[]): { student: Student; balance: number | undefined }[] {
  const results = useQueries({
    queries: students.map((student) => ({
      queryKey: ["studentBalance", student.id],
      queryFn: () => services.monthlySummary.getStudentBalance(student.id),
    })),
  });

  return students.map((student, index) => ({ student, balance: results[index]?.data }));
}

export function useMonthlySummary(studentId: string | undefined, year: number, month: number) {
  return useQuery({
    queryKey: ["monthlySummary", studentId, year, month],
    queryFn: () => services.monthlySummary.getMonthlySummary(studentId!, year, month),
    enabled: !!studentId,
  });
}

/** Fetches the monthly summary for every given student in one go (shares cache with useMonthlySummary). */
export function useMonthlySummaries(
  students: Student[],
  year: number,
  month: number,
): { student: Student; summary: MonthlySummary | undefined }[] {
  const results = useQueries({
    queries: students.map((student) => ({
      queryKey: ["monthlySummary", student.id, year, month],
      queryFn: () => services.monthlySummary.getMonthlySummary(student.id, year, month),
    })),
  });

  return students.map((student, index) => ({ student, summary: results[index]?.data }));
}

/** Fetches the yearly summary for every given student in one go. */
export function useYearlySummaries(
  students: Student[],
  year: number,
): { student: Student; summary: YearlySummary | undefined }[] {
  const results = useQueries({
    queries: students.map((student) => ({
      queryKey: ["yearlySummary", student.id, year],
      queryFn: () => services.monthlySummary.getYearlySummary(student.id, year),
    })),
  });

  return students.map((student, index) => ({ student, summary: results[index]?.data }));
}

/**
 * Omit year/month to get every pack's up-to-date progress regardless of when it was purchased.
 * Pass `resolvedOnly: true` to count only completed/cancelled classes, not merely scheduled ones —
 * see `MonthlySummaryService.getPackProgress` for why that matters.
 */
export function usePackProgress(studentId: string | undefined, year?: number, month?: number, resolvedOnly?: boolean) {
  return useQuery({
    queryKey: ["packProgress", studentId, year, month, resolvedOnly ?? false],
    queryFn: () => services.monthlySummary.getPackProgress(studentId!, year, month, { resolvedOnly }),
    enabled: !!studentId,
  });
}

/** Fetches pack progress for every given student in one go (shares cache with usePackProgress). */
export function usePackProgresses(
  students: Student[],
  year: number,
  month: number,
  resolvedOnly?: boolean,
): { student: Student; packProgress: PackProgress[] | undefined }[] {
  const results = useQueries({
    queries: students.map((student) => ({
      queryKey: ["packProgress", student.id, year, month, resolvedOnly ?? false],
      queryFn: () => services.monthlySummary.getPackProgress(student.id, year, month, { resolvedOnly }),
    })),
  });

  return students.map((student, index) => ({ student, packProgress: results[index]?.data }));
}

/** Full pack history (activation/completion dates included) for one student. */
export function usePackTimeline(studentId: string | undefined, resolvedOnly?: boolean) {
  return useQuery({
    queryKey: ["packTimeline", studentId, resolvedOnly ?? false],
    queryFn: () => services.monthlySummary.getPackTimeline(studentId!, { resolvedOnly }),
    enabled: !!studentId,
  });
}

/** Fetches pack timelines for every given student in one go (shares cache with usePackTimeline). */
export function usePackTimelines(
  students: Student[],
  resolvedOnly?: boolean,
): { student: Student; timeline: PackTimelineEntry[] | undefined }[] {
  const results = useQueries({
    queries: students.map((student) => ({
      queryKey: ["packTimeline", student.id, resolvedOnly ?? false],
      queryFn: () => services.monthlySummary.getPackTimeline(student.id, { resolvedOnly }),
    })),
  });

  return students.map((student, index) => ({ student, timeline: results[index]?.data }));
}

/**
 * Merges every given student's session→bono-label map into one (sessionId -> "4/10", or undefined
 * for "Fuera de bono"). Meant for calendar cards, which show many students' sessions at once.
 */
export function useSessionPackLabels(students: Student[]): Map<string, string | undefined> {
  const results = useQueries({
    queries: students.map((student) => ({
      queryKey: ["sessionPackLabels", student.id],
      queryFn: () => services.monthlySummary.getSessionPackLabels(student.id),
    })),
  });

  const merged = new Map<string, string | undefined>();
  for (const result of results) {
    if (!result.data) continue;
    for (const [sessionId, label] of result.data) merged.set(sessionId, label);
  }
  return merged;
}

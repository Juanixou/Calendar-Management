import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MonthlySummary, NewClassPackPurchase, PackProgress, PackTimelineEntry, Student, TeacherProfile } from "@gestion-clases/core";
import { getAdminContainer } from "../lib/adminContainer";

export function useAdminTeacherProfile(teacherId: string | undefined) {
  return useQuery({
    queryKey: ["admin", "teacherProfile", teacherId],
    queryFn: () => getAdminContainer(teacherId!).repositories.teacherProfile.get(),
    enabled: !!teacherId,
  });
}

/** Batch-fetches teacher profiles for a picker/list (shares cache with useAdminTeacherProfile). */
export function useAdminTeacherProfiles(teacherIds: string[]): { teacherId: string; profile: TeacherProfile | undefined }[] {
  const results = useQueries({
    queries: teacherIds.map((teacherId) => ({
      queryKey: ["admin", "teacherProfile", teacherId],
      queryFn: () => getAdminContainer(teacherId).repositories.teacherProfile.get(),
    })),
  });

  return teacherIds.map((teacherId, index) => ({ teacherId, profile: results[index]?.data }));
}

export function useAdminStudents(teacherId: string | undefined) {
  return useQuery({
    queryKey: ["admin", "students", teacherId],
    queryFn: () => getAdminContainer(teacherId!).repositories.students.list(),
    enabled: !!teacherId,
  });
}

/**
 * Current (unbounded) pack progress per student — which pack is in play right now, not tied to a
 * month. `resolvedOnly` counts only completed/cancelled classes, not merely scheduled ones — see
 * `MonthlySummaryService.getPackProgress` for why that matters.
 */
export function useAdminPackProgresses(
  teacherId: string,
  students: Student[],
  resolvedOnly?: boolean,
): { student: Student; packProgress: PackProgress[] | undefined }[] {
  const results = useQueries({
    queries: students.map((student) => ({
      queryKey: ["admin", "packProgress", teacherId, student.id, undefined, undefined, resolvedOnly ?? false],
      queryFn: () =>
        getAdminContainer(teacherId).services.monthlySummary.getPackProgress(student.id, undefined, undefined, {
          resolvedOnly,
        }),
    })),
  });

  return students.map((student, index) => ({ student, packProgress: results[index]?.data }));
}

export function useAdminClassSessionsInRange(teacherId: string | undefined, rangeStart: string, rangeEnd: string) {
  return useQuery({
    queryKey: ["admin", "classSessions", teacherId, "range", rangeStart, rangeEnd],
    queryFn: () => getAdminContainer(teacherId!).repositories.classSessions.listInRange(rangeStart, rangeEnd),
    enabled: !!teacherId,
  });
}

export function useAdminStudentBalance(teacherId: string, studentId: string | undefined) {
  return useQuery({
    queryKey: ["admin", "studentBalance", teacherId, studentId],
    queryFn: () => getAdminContainer(teacherId).services.monthlySummary.getStudentBalance(studentId!),
    enabled: !!studentId,
  });
}

export function useAdminClassPacksByStudent(teacherId: string, studentId: string | undefined) {
  return useQuery({
    queryKey: ["admin", "classPacks", teacherId, "student", studentId],
    queryFn: () => getAdminContainer(teacherId).repositories.classPacks.listByStudent(studentId!),
    enabled: !!studentId,
  });
}

export function useAdminClassSessionsByStudent(teacherId: string, studentId: string | undefined) {
  return useQuery({
    queryKey: ["admin", "classSessions", teacherId, "student", studentId],
    queryFn: () => getAdminContainer(teacherId).repositories.classSessions.listByStudent(studentId!),
    enabled: !!studentId,
  });
}

export function useAdminMonthlySummary(teacherId: string, studentId: string | undefined, year: number, month: number) {
  return useQuery({
    queryKey: ["admin", "monthlySummary", teacherId, studentId, year, month],
    queryFn: () => getAdminContainer(teacherId).services.monthlySummary.getMonthlySummary(studentId!, year, month),
    enabled: !!studentId,
  });
}

export function useAdminPackTimeline(teacherId: string, studentId: string | undefined, resolvedOnly?: boolean) {
  return useQuery({
    queryKey: ["admin", "packTimeline", teacherId, studentId, resolvedOnly ?? false],
    queryFn: () => getAdminContainer(teacherId).services.monthlySummary.getPackTimeline(studentId!, { resolvedOnly }),
    enabled: !!studentId,
  });
}

/** Full (non-resolvedOnly) pack timeline for every given student — shares cache with useAdminPackTimeline. */
export function useAdminPackTimelines(
  teacherId: string,
  students: Student[],
): { student: Student; timeline: PackTimelineEntry[] | undefined }[] {
  const results = useQueries({
    queries: students.map((student) => ({
      queryKey: ["admin", "packTimeline", teacherId, student.id, false],
      queryFn: () => getAdminContainer(teacherId).services.monthlySummary.getPackTimeline(student.id),
    })),
  });

  return students.map((student, index) => ({ student, timeline: results[index]?.data }));
}

/** Pack progress as of the end of a specific month (not resolvedOnly) — mirrors the teacher's own Resumen page. */
export function useAdminPackProgressesForMonth(
  teacherId: string,
  students: Student[],
  year: number,
  month: number,
): { student: Student; packProgress: PackProgress[] | undefined }[] {
  const results = useQueries({
    queries: students.map((student) => ({
      queryKey: ["admin", "packProgress", teacherId, student.id, year, month, false],
      queryFn: () => getAdminContainer(teacherId).services.monthlySummary.getPackProgress(student.id, year, month),
    })),
  });

  return students.map((student, index) => ({ student, packProgress: results[index]?.data }));
}

export function useAdminMonthlySummaries(
  teacherId: string,
  students: Student[],
  year: number,
  month: number,
): { student: Student; summary: MonthlySummary | undefined }[] {
  const results = useQueries({
    queries: students.map((student) => ({
      queryKey: ["admin", "monthlySummary", teacherId, student.id, year, month],
      queryFn: () => getAdminContainer(teacherId).services.monthlySummary.getMonthlySummary(student.id, year, month),
    })),
  });

  return students.map((student, index) => ({ student, summary: results[index]?.data }));
}

/** Merges every given student's session→bono-label map into one — see `useSessionPackLabels`. */
export function useAdminSessionPackLabels(teacherId: string, students: Student[]): Map<string, string | undefined> {
  const results = useQueries({
    queries: students.map((student) => ({
      queryKey: ["admin", "sessionPackLabels", teacherId, student.id],
      queryFn: () => getAdminContainer(teacherId).services.monthlySummary.getSessionPackLabels(student.id),
    })),
  });

  const merged = new Map<string, string | undefined>();
  for (const result of results) {
    if (!result.data) continue;
    for (const [sessionId, label] of result.data) merged.set(sessionId, label);
  }
  return merged;
}

export function useAdminCreateClassPack(teacherId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewClassPackPurchase) => getAdminContainer(teacherId).repositories.classPacks.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "classPacks", teacherId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "monthlySummary", teacherId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "packProgress", teacherId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "packTimeline", teacherId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "sessionPackLabels", teacherId] });
    },
  });
}

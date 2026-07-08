import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ClassSession, NewClassSession } from "@gestion-clases/core";
import { repositories, services } from "../lib/repositories";

const SESSIONS_KEY = ["classSessions"] as const;

function invalidateSessions(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });
  queryClient.invalidateQueries({ queryKey: ["monthlySummary"] });
  queryClient.invalidateQueries({ queryKey: ["studentBalance"] });
  queryClient.invalidateQueries({ queryKey: ["packProgress"] });
  queryClient.invalidateQueries({ queryKey: ["packTimeline"] });
}

export function useClassSessionsInRange(rangeStart: string, rangeEnd: string) {
  return useQuery({
    queryKey: [...SESSIONS_KEY, "range", rangeStart, rangeEnd],
    queryFn: () => repositories.classSessions.listInRange(rangeStart, rangeEnd),
  });
}

export function useClassSessionsByStudent(studentId: string | undefined) {
  return useQuery({
    queryKey: [...SESSIONS_KEY, "student", studentId],
    queryFn: () => repositories.classSessions.listByStudent(studentId!),
    enabled: !!studentId,
  });
}

/** For each student, their earliest still-scheduled session in the next 90 days, if any. */
export function useNextSessionByStudent(): Map<string, ClassSession> {
  const now = useMemo(() => new Date(), []);
  const rangeEnd = useMemo(() => new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), [now]);
  const { data: upcoming = [] } = useClassSessionsInRange(now.toISOString(), rangeEnd.toISOString());

  return useMemo(() => {
    const map = new Map<string, ClassSession>();
    for (const session of upcoming) {
      if (session.status !== "scheduled") continue;
      const existing = map.get(session.studentId);
      if (!existing || session.start < existing.start) map.set(session.studentId, session);
    }
    return map;
  }, [upcoming]);
}

export function useScheduleClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewClassSession) => services.scheduling.scheduleClass(input),
    onSuccess: () => invalidateSessions(queryClient),
  });
}

/** Creates one session per {start, end} occurrence (used for both single and weekly-recurring classes). */
export function useScheduleClassOccurrences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (occurrences: NewClassSession[]) =>
      Promise.all(occurrences.map((input) => services.scheduling.scheduleClass(input))),
    onSuccess: () => invalidateSessions(queryClient),
  });
}

export function useUpdateSessionNotes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, notes }: { sessionId: string; notes: string }) =>
      repositories.classSessions.update(sessionId, { notes: notes.trim() || undefined }),
    onSuccess: () => invalidateSessions(queryClient),
  });
}

export function useMoveClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, start, end }: { sessionId: string; start: string; end: string }) =>
      services.scheduling.moveClass(sessionId, start, end),
    onSuccess: () => invalidateSessions(queryClient),
  });
}

export function useCompleteClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => services.scheduling.completeClass(sessionId),
    onSuccess: () => invalidateSessions(queryClient),
  });
}

export function useCancelClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => services.scheduling.cancelClass(sessionId),
    onSuccess: () => invalidateSessions(queryClient),
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => services.scheduling.deleteSession(sessionId),
    onSuccess: () => invalidateSessions(queryClient),
  });
}

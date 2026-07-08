export type ClassSessionStatus = "scheduled" | "completed" | "cancelled";

/** Individual: one student. Group: several independent sessions share the same `groupId` and time slot. */
export type ClassSessionType = "individual" | "group";

export interface ClassSession {
  id: string;
  studentId: string;
  /** ISO 8601 datetime (absolute instant) of the class start */
  start: string;
  /** ISO 8601 datetime (absolute instant) of the class end */
  end: string;
  status: ClassSessionStatus;
  type: ClassSessionType;
  /** Set only for group classes: links the independent per-student sessions that share the same time slot. */
  groupId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type NewClassSession = Pick<ClassSession, "studentId" | "start" | "end" | "notes"> &
  Partial<Pick<ClassSession, "type" | "groupId">>;

export function durationHours(session: Pick<ClassSession, "start" | "end">): number {
  const ms = new Date(session.end).getTime() - new Date(session.start).getTime();
  return Math.round((ms / (1000 * 60 * 60)) * 100) / 100;
}

import type { ClassSession, Student } from "@gestion-clases/core";

export interface SessionGroup {
  /** groupId for group classes, or the session id itself for individual ones. */
  key: string;
  sessions: ClassSession[];
  students: Student[];
}

/** Groups sessions that share a `groupId` (a group class) into one entry; individual sessions become singletons. */
export function groupSessions(sessions: ClassSession[], studentsById: Map<string, Student>): SessionGroup[] {
  const order: string[] = [];
  const byKey = new Map<string, ClassSession[]>();

  for (const session of sessions) {
    const key = session.groupId ?? session.id;
    const existing = byKey.get(key);
    if (existing) {
      existing.push(session);
    } else {
      byKey.set(key, [session]);
      order.push(key);
    }
  }

  return order.map((key) => {
    const groupSessionsList = byKey.get(key)!;
    return {
      key,
      sessions: groupSessionsList,
      students: groupSessionsList
        .map((s) => studentsById.get(s.studentId))
        .filter((s): s is Student => !!s),
    };
  });
}

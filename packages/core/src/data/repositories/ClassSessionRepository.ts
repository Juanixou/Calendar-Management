import type { ClassSession, NewClassSession } from "../../domain/ClassSession";

export interface ClassSessionRepository {
  list(): Promise<ClassSession[]>;
  listByStudent(studentId: string): Promise<ClassSession[]>;
  /** Sessions whose [start,end) overlaps the given range, inclusive-exclusive. */
  listInRange(rangeStart: string, rangeEnd: string): Promise<ClassSession[]>;
  get(id: string): Promise<ClassSession | undefined>;
  create(input: NewClassSession): Promise<ClassSession>;
  update(id: string, patch: Partial<Omit<ClassSession, "id" | "studentId" | "createdAt">>): Promise<ClassSession>;
  remove(id: string): Promise<void>;
  /** Wipes and replaces every session. Used to restore a backup. */
  replaceAll(sessions: ClassSession[]): Promise<void>;
}

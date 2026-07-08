import type { ClassSessionRepository } from "../data/repositories/ClassSessionRepository";
import type { ClassSession, NewClassSession } from "../domain/ClassSession";

export class ClassSchedulingService {
  constructor(private readonly sessions: ClassSessionRepository) {}

  /** Books a new class. Consumes the student's balance immediately. */
  scheduleClass(input: NewClassSession): Promise<ClassSession> {
    return this.sessions.create(input);
  }

  /** Reschedules an existing class to another day/time. Does not touch the balance. */
  moveClass(sessionId: string, start: string, end: string): Promise<ClassSession> {
    return this.sessions.update(sessionId, { start, end });
  }

  /** Marks the class as given. Counts towards the monthly hours-taught report. */
  completeClass(sessionId: string): Promise<ClassSession> {
    return this.sessions.update(sessionId, { status: "completed" });
  }

  /**
   * The teacher cancels the class. It still counts as spent from the student's
   * balance (it was already deducted when scheduled), but not as an hour taught.
   */
  cancelClass(sessionId: string): Promise<ClassSession> {
    return this.sessions.update(sessionId, { status: "cancelled" });
  }

  deleteSession(sessionId: string): Promise<void> {
    return this.sessions.remove(sessionId);
  }
}

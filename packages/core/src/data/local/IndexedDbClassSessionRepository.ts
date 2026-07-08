import type { ClassSessionRepository } from "../repositories/ClassSessionRepository";
import type { ClassSession, NewClassSession } from "../../domain/ClassSession";
import { getDb } from "./db";

export class IndexedDbClassSessionRepository implements ClassSessionRepository {
  async list(): Promise<ClassSession[]> {
    const db = await getDb();
    const all = await db.getAll("classSessions");
    return all.sort((a, b) => a.start.localeCompare(b.start));
  }

  async listByStudent(studentId: string): Promise<ClassSession[]> {
    const db = await getDb();
    const all = await db.getAllFromIndex("classSessions", "by-studentId", studentId);
    return all.sort((a, b) => a.start.localeCompare(b.start));
  }

  async listInRange(rangeStart: string, rangeEnd: string): Promise<ClassSession[]> {
    const all = await this.list();
    const rangeStartMs = new Date(rangeStart).getTime();
    const rangeEndMs = new Date(rangeEnd).getTime();
    return all.filter((session) => {
      const startMs = new Date(session.start).getTime();
      const endMs = new Date(session.end).getTime();
      return startMs < rangeEndMs && endMs > rangeStartMs;
    });
  }

  async get(id: string): Promise<ClassSession | undefined> {
    const db = await getDb();
    return db.get("classSessions", id);
  }

  async create(input: NewClassSession): Promise<ClassSession> {
    const db = await getDb();
    const now = new Date().toISOString();
    const session: ClassSession = {
      id: crypto.randomUUID(),
      studentId: input.studentId,
      start: input.start,
      end: input.end,
      notes: input.notes,
      status: "scheduled",
      type: input.type ?? "individual",
      groupId: input.groupId,
      createdAt: now,
      updatedAt: now,
    };
    await db.add("classSessions", session);
    return session;
  }

  async update(
    id: string,
    patch: Partial<Omit<ClassSession, "id" | "studentId" | "createdAt">>,
  ): Promise<ClassSession> {
    const db = await getDb();
    const existing = await db.get("classSessions", id);
    if (!existing) {
      throw new Error(`ClassSession ${id} not found`);
    }
    const updated: ClassSession = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    await db.put("classSessions", updated);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const db = await getDb();
    await db.delete("classSessions", id);
  }

  async replaceAll(sessions: ClassSession[]): Promise<void> {
    const db = await getDb();
    const tx = db.transaction("classSessions", "readwrite");
    await tx.store.clear();
    await Promise.all(sessions.map((session) => tx.store.put(session)));
    await tx.done;
  }
}

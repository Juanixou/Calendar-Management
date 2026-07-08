import { deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where, type Firestore } from "firebase/firestore";
import type { ClassSessionRepository } from "../repositories/ClassSessionRepository";
import type { ClassSession, NewClassSession } from "../../domain/ClassSession";
import { classSessionsCollection, commitBatchedWrites, stripUndefined } from "./paths";

export class FirestoreClassSessionRepository implements ClassSessionRepository {
  constructor(
    private readonly db: Firestore,
    private readonly teacherId: string,
  ) {}

  async list(): Promise<ClassSession[]> {
    const snapshot = await getDocs(classSessionsCollection(this.db, this.teacherId));
    const sessions = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ClassSession);
    return sessions.sort((a, b) => a.start.localeCompare(b.start));
  }

  async listByStudent(studentId: string): Promise<ClassSession[]> {
    const snapshot = await getDocs(
      query(classSessionsCollection(this.db, this.teacherId), where("studentId", "==", studentId)),
    );
    const sessions = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ClassSession);
    return sessions.sort((a, b) => a.start.localeCompare(b.start));
  }

  async listInRange(rangeStart: string, rangeEnd: string): Promise<ClassSession[]> {
    // Firestore can't do inequality filters on two different fields (start/end) in one query,
    // so fetch everything and filter client-side — same approach as the local IndexedDB repo.
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
    const snapshot = await getDoc(doc(classSessionsCollection(this.db, this.teacherId), id));
    return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as ClassSession) : undefined;
  }

  async create(input: NewClassSession): Promise<ClassSession> {
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
    const { id, ...data } = session;
    await setDoc(doc(classSessionsCollection(this.db, this.teacherId), id), stripUndefined(data));
    return session;
  }

  async update(
    id: string,
    patch: Partial<Omit<ClassSession, "id" | "studentId" | "createdAt">>,
  ): Promise<ClassSession> {
    await updateDoc(
      doc(classSessionsCollection(this.db, this.teacherId), id),
      stripUndefined({ ...patch, updatedAt: new Date().toISOString() }),
    );
    const updated = await this.get(id);
    if (!updated) throw new Error(`ClassSession ${id} not found`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(classSessionsCollection(this.db, this.teacherId), id));
  }

  async replaceAll(sessions: ClassSession[]): Promise<void> {
    const col = classSessionsCollection(this.db, this.teacherId);
    const existing = await getDocs(col);
    await commitBatchedWrites(
      this.db,
      existing.docs.map((d) => d.ref),
      sessions.map((session) => {
        const { id, ...data } = session;
        return { ref: doc(col, id), data: stripUndefined(data) };
      }),
    );
  }
}

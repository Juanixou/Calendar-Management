import type { StudentRepository } from "../repositories/StudentRepository";
import type { NewStudent, Student } from "../../domain/Student";
import { getDb } from "./db";

export class IndexedDbStudentRepository implements StudentRepository {
  async list(): Promise<Student[]> {
    const db = await getDb();
    const all = await db.getAll("students");
    return all.sort((a, b) => a.name.localeCompare(b.name));
  }

  async get(id: string): Promise<Student | undefined> {
    const db = await getDb();
    return db.get("students", id);
  }

  async create(input: NewStudent): Promise<Student> {
    const db = await getDb();
    const student: Student = {
      id: crypto.randomUUID(),
      name: input.name,
      level: input.level,
      timezone: input.timezone,
      notes: input.notes,
      color: input.color,
      active: input.active ?? true,
      createdAt: new Date().toISOString(),
    };
    await db.add("students", student);
    return student;
  }

  async update(id: string, patch: Partial<Omit<Student, "id" | "createdAt">>): Promise<Student> {
    const db = await getDb();
    const existing = await db.get("students", id);
    if (!existing) {
      throw new Error(`Student ${id} not found`);
    }
    const updated: Student = { ...existing, ...patch };
    await db.put("students", updated);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const db = await getDb();
    await db.delete("students", id);
  }

  async replaceAll(students: Student[]): Promise<void> {
    const db = await getDb();
    const tx = db.transaction("students", "readwrite");
    await tx.store.clear();
    await Promise.all(students.map((student) => tx.store.put(student)));
    await tx.done;
  }
}

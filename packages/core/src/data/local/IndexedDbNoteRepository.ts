import type { NoteRepository } from "../repositories/NoteRepository";
import type { Note, NewNote } from "../../domain/Note";
import { getDb } from "./db";

export class IndexedDbNoteRepository implements NoteRepository {
  async list(): Promise<Note[]> {
    const db = await getDb();
    const all = await db.getAll("notes");
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async create(input: NewNote): Promise<Note> {
    const db = await getDb();
    const note: Note = {
      id: crypto.randomUUID(),
      text: input.text,
      studentId: input.studentId,
      classSessionId: input.classSessionId,
      createdAt: new Date().toISOString(),
    };
    await db.add("notes", note);
    return note;
  }

  async update(id: string, patch: Partial<Omit<Note, "id" | "createdAt">>): Promise<Note> {
    const db = await getDb();
    const existing = await db.get("notes", id);
    if (!existing) {
      throw new Error(`Note ${id} not found`);
    }
    const updated: Note = { ...existing, ...patch };
    await db.put("notes", updated);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const db = await getDb();
    await db.delete("notes", id);
  }

  async replaceAll(notes: Note[]): Promise<void> {
    const db = await getDb();
    const tx = db.transaction("notes", "readwrite");
    await tx.store.clear();
    await Promise.all(notes.map((note) => tx.store.put(note)));
    await tx.done;
  }
}

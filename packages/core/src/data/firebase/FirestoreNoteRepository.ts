import { deleteDoc, deleteField, doc, getDoc, getDocs, setDoc, updateDoc, type Firestore } from "firebase/firestore";
import type { NoteRepository } from "../repositories/NoteRepository";
import type { Note, NewNote } from "../../domain/Note";
import { commitBatchedWrites, notesCollection, stripUndefined } from "./paths";

export class FirestoreNoteRepository implements NoteRepository {
  constructor(
    private readonly db: Firestore,
    private readonly teacherId: string,
  ) {}

  async list(): Promise<Note[]> {
    const snapshot = await getDocs(notesCollection(this.db, this.teacherId));
    const notes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Note);
    return notes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async create(input: NewNote): Promise<Note> {
    const note: Note = {
      id: crypto.randomUUID(),
      text: input.text,
      studentId: input.studentId,
      classSessionId: input.classSessionId,
      createdAt: new Date().toISOString(),
    };
    const { id, ...data } = note;
    await setDoc(doc(notesCollection(this.db, this.teacherId), id), stripUndefined(data));
    return note;
  }

  async update(id: string, patch: Partial<Omit<Note, "id" | "createdAt">>): Promise<Note> {
    const ref = doc(notesCollection(this.db, this.teacherId), id);
    // Unlike stripUndefined (used elsewhere), an explicit `undefined` here must actually clear the
    // field in Firestore (e.g. unlinking a note from its student) rather than silently leaving the
    // previous value in place — updateDoc requires the `deleteField()` sentinel for that.
    const data: Record<string, unknown> = {};
    for (const key of Object.keys(patch) as (keyof typeof patch)[]) {
      const value = patch[key];
      data[key] = value === undefined ? deleteField() : value;
    }
    await updateDoc(ref, data);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) throw new Error(`Note ${id} not found`);
    return { id: snapshot.id, ...snapshot.data() } as Note;
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(notesCollection(this.db, this.teacherId), id));
  }

  async replaceAll(notes: Note[]): Promise<void> {
    const col = notesCollection(this.db, this.teacherId);
    const existing = await getDocs(col);
    await commitBatchedWrites(
      this.db,
      existing.docs.map((d) => d.ref),
      notes.map((note) => {
        const { id, ...data } = note;
        return { ref: doc(col, id), data: stripUndefined(data) };
      }),
    );
  }
}

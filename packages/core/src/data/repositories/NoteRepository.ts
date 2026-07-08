import type { Note, NewNote } from "../../domain/Note";

export interface NoteRepository {
  list(): Promise<Note[]>;
  create(input: NewNote): Promise<Note>;
  update(id: string, patch: Partial<Omit<Note, "id" | "createdAt">>): Promise<Note>;
  remove(id: string): Promise<void>;
  /** Wipes and replaces every note. Used to restore a backup. */
  replaceAll(notes: Note[]): Promise<void>;
}

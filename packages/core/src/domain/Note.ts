export interface Note {
  id: string;
  text: string;
  /** Optional link to a student this note is about. */
  studentId?: string;
  /** Optional link to a specific class of that student — only meaningful alongside studentId. */
  classSessionId?: string;
  createdAt: string;
}

export type NewNote = Omit<Note, "id" | "createdAt">;

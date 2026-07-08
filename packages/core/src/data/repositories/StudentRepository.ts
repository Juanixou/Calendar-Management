import type { NewStudent, Student } from "../../domain/Student";

export interface StudentRepository {
  list(): Promise<Student[]>;
  get(id: string): Promise<Student | undefined>;
  create(input: NewStudent): Promise<Student>;
  update(id: string, patch: Partial<Omit<Student, "id" | "createdAt">>): Promise<Student>;
  remove(id: string): Promise<void>;
  /** Wipes and replaces every student. Used to restore a backup. */
  replaceAll(students: Student[]): Promise<void>;
}

import { deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc, updateDoc, type Firestore } from "firebase/firestore";
import type { StudentRepository } from "../repositories/StudentRepository";
import type { NewStudent, Student } from "../../domain/Student";
import { commitBatchedWrites, studentsCollection, stripUndefined } from "./paths";

export class FirestoreStudentRepository implements StudentRepository {
  constructor(
    private readonly db: Firestore,
    private readonly teacherId: string,
  ) {}

  async list(): Promise<Student[]> {
    const snapshot = await getDocs(query(studentsCollection(this.db, this.teacherId), orderBy("name")));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Student);
  }

  async get(id: string): Promise<Student | undefined> {
    const snapshot = await getDoc(doc(studentsCollection(this.db, this.teacherId), id));
    return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Student) : undefined;
  }

  async create(input: NewStudent): Promise<Student> {
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
    const { id, ...data } = student;
    await setDoc(doc(studentsCollection(this.db, this.teacherId), id), stripUndefined(data));
    return student;
  }

  async update(id: string, patch: Partial<Omit<Student, "id" | "createdAt">>): Promise<Student> {
    await updateDoc(doc(studentsCollection(this.db, this.teacherId), id), stripUndefined(patch));
    const updated = await this.get(id);
    if (!updated) throw new Error(`Student ${id} not found`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(studentsCollection(this.db, this.teacherId), id));
  }

  async replaceAll(students: Student[]): Promise<void> {
    const col = studentsCollection(this.db, this.teacherId);
    const existing = await getDocs(col);
    await commitBatchedWrites(
      this.db,
      existing.docs.map((d) => d.ref),
      students.map((student) => {
        const { id, ...data } = student;
        return { ref: doc(col, id), data: stripUndefined(data) };
      }),
    );
  }
}

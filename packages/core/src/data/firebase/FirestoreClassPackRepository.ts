import { deleteDoc, doc, getDocs, query, setDoc, where, type Firestore } from "firebase/firestore";
import type { ClassPackRepository } from "../repositories/ClassPackRepository";
import type { ClassPackPurchase, NewClassPackPurchase } from "../../domain/ClassPackPurchase";
import { classPackPurchasesCollection, commitBatchedWrites, stripUndefined } from "./paths";

export class FirestoreClassPackRepository implements ClassPackRepository {
  constructor(
    private readonly db: Firestore,
    private readonly teacherId: string,
  ) {}

  async list(): Promise<ClassPackPurchase[]> {
    const snapshot = await getDocs(classPackPurchasesCollection(this.db, this.teacherId));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ClassPackPurchase);
  }

  async listByStudent(studentId: string): Promise<ClassPackPurchase[]> {
    const snapshot = await getDocs(
      query(classPackPurchasesCollection(this.db, this.teacherId), where("studentId", "==", studentId)),
    );
    const purchases = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ClassPackPurchase);
    // purchasedAt only has day precision, so ties are common; createdAt (exact) keeps FIFO order stable.
    return purchases.sort(
      (a, b) => a.purchasedAt.localeCompare(b.purchasedAt) || a.createdAt.localeCompare(b.createdAt),
    );
  }

  async create(input: NewClassPackPurchase): Promise<ClassPackPurchase> {
    const purchase: ClassPackPurchase = {
      id: crypto.randomUUID(),
      studentId: input.studentId,
      classesAmount: input.classesAmount,
      purchasedAt: input.purchasedAt,
      note: input.note,
      createdAt: new Date().toISOString(),
    };
    const { id, ...data } = purchase;
    await setDoc(doc(classPackPurchasesCollection(this.db, this.teacherId), id), stripUndefined(data));
    return purchase;
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(classPackPurchasesCollection(this.db, this.teacherId), id));
  }

  async replaceAll(purchases: ClassPackPurchase[]): Promise<void> {
    const col = classPackPurchasesCollection(this.db, this.teacherId);
    const existing = await getDocs(col);
    await commitBatchedWrites(
      this.db,
      existing.docs.map((d) => d.ref),
      purchases.map((purchase) => {
        const { id, ...data } = purchase;
        return { ref: doc(col, id), data: stripUndefined(data) };
      }),
    );
  }
}

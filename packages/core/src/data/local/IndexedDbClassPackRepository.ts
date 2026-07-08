import type { ClassPackRepository } from "../repositories/ClassPackRepository";
import type { ClassPackPurchase, NewClassPackPurchase } from "../../domain/ClassPackPurchase";
import { getDb } from "./db";

export class IndexedDbClassPackRepository implements ClassPackRepository {
  async list(): Promise<ClassPackPurchase[]> {
    const db = await getDb();
    return db.getAll("classPackPurchases");
  }

  async listByStudent(studentId: string): Promise<ClassPackPurchase[]> {
    const db = await getDb();
    const all = await db.getAllFromIndex("classPackPurchases", "by-studentId", studentId);
    // purchasedAt only has day precision (picked from a date input), so ties are common when
    // several packs are logged the same day; createdAt (exact) keeps FIFO consumption order stable.
    return all.sort(
      (a, b) => a.purchasedAt.localeCompare(b.purchasedAt) || a.createdAt.localeCompare(b.createdAt),
    );
  }

  async create(input: NewClassPackPurchase): Promise<ClassPackPurchase> {
    const db = await getDb();
    const purchase: ClassPackPurchase = {
      id: crypto.randomUUID(),
      studentId: input.studentId,
      classesAmount: input.classesAmount,
      purchasedAt: input.purchasedAt,
      note: input.note,
      createdAt: new Date().toISOString(),
    };
    await db.add("classPackPurchases", purchase);
    return purchase;
  }

  async remove(id: string): Promise<void> {
    const db = await getDb();
    await db.delete("classPackPurchases", id);
  }

  async replaceAll(purchases: ClassPackPurchase[]): Promise<void> {
    const db = await getDb();
    const tx = db.transaction("classPackPurchases", "readwrite");
    await tx.store.clear();
    await Promise.all(purchases.map((purchase) => tx.store.put(purchase)));
    await tx.done;
  }
}

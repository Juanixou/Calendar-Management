import type { ClassPackPurchase, NewClassPackPurchase } from "../../domain/ClassPackPurchase";

export interface ClassPackRepository {
  list(): Promise<ClassPackPurchase[]>;
  listByStudent(studentId: string): Promise<ClassPackPurchase[]>;
  create(input: NewClassPackPurchase): Promise<ClassPackPurchase>;
  remove(id: string): Promise<void>;
  /** Wipes and replaces every pack purchase. Used to restore a backup. */
  replaceAll(purchases: ClassPackPurchase[]): Promise<void>;
}

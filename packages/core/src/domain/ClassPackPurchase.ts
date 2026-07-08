export interface ClassPackPurchase {
  id: string;
  studentId: string;
  /** Number of 1h classes bought in this pack */
  classesAmount: number;
  /** ISO date the pack was purchased */
  purchasedAt: string;
  note?: string;
  createdAt: string;
}

export type NewClassPackPurchase = Omit<ClassPackPurchase, "id" | "createdAt">;

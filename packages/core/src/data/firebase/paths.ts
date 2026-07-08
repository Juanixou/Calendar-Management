import { collection, doc, writeBatch, type DocumentData, type DocumentReference, type Firestore } from "firebase/firestore";

/**
 * Every teacher's data lives under `teachers/{teacherId}/...`. This keeps the door open for a
 * `users/{uid}` role registry (admin vs teacher) without any data migration later — an admin can
 * simply be granted access to other teachers' subtrees via Firestore security rules.
 */
export function teacherDocRef(db: Firestore, teacherId: string) {
  return doc(db, "teachers", teacherId);
}

export function studentsCollection(db: Firestore, teacherId: string) {
  return collection(db, "teachers", teacherId, "students");
}

export function classPackPurchasesCollection(db: Firestore, teacherId: string) {
  return collection(db, "teachers", teacherId, "classPackPurchases");
}

export function classSessionsCollection(db: Firestore, teacherId: string) {
  return collection(db, "teachers", teacherId, "classSessions");
}

export function notesCollection(db: Firestore, teacherId: string) {
  return collection(db, "teachers", teacherId, "notes");
}

/** Firestore rejects `undefined` field values; strip them so optional domain fields can be omitted. */
export function stripUndefined<T extends object>(input: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key of Object.keys(input) as (keyof T)[]) {
    if (input[key] !== undefined) result[key] = input[key];
  }
  return result;
}

const MAX_BATCH_OPS = 450; // Firestore's limit is 500 writes per batch; stay comfortably under it.

/** Deletes `deletes` and upserts `writes`, split across as many batches as needed. */
export async function commitBatchedWrites(
  db: Firestore,
  deletes: DocumentReference[],
  writes: { ref: DocumentReference; data: DocumentData }[],
): Promise<void> {
  const all: Array<{ type: "delete"; ref: DocumentReference } | { type: "set"; ref: DocumentReference; data: DocumentData }> = [
    ...deletes.map((ref) => ({ type: "delete" as const, ref })),
    ...writes.map((w) => ({ type: "set" as const, ref: w.ref, data: w.data })),
  ];

  for (let i = 0; i < all.length; i += MAX_BATCH_OPS) {
    const batch = writeBatch(db);
    for (const op of all.slice(i, i + MAX_BATCH_OPS)) {
      if (op.type === "delete") batch.delete(op.ref);
      else batch.set(op.ref, op.data);
    }
    await batch.commit();
  }
}

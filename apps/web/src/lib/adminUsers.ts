import { collection, doc, getDocs, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { IS_DEMO } from "./appMode";
import type { UserRole } from "./userRole";

export interface UserRecord {
  uid: string;
  email: string | null;
  role: UserRole;
  createdAt: string | null;
}

// Demo mode has no real Firestore `users` collection to query (placeholder Firebase config) — it
// shows a single fake teacher record standing in for "the one teacher" whose local data it browses.
const DEMO_USER_RECORD: UserRecord = {
  uid: "demo-teacher",
  email: "demo@ejemplo.com",
  role: "admin",
  createdAt: new Date().toISOString(),
};

/**
 * Only lists users who have logged in at least once (their `users/{uid}` doc is created on
 * first login). There is no account creation here — new teachers are still created by hand in
 * Firebase Console → Authentication, since the client SDK can't create other users' accounts
 * without kicking out the current session.
 */
export async function listAllUsers(): Promise<UserRecord[]> {
  if (IS_DEMO) return [DEMO_USER_RECORD];

  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs
    .map((d) => {
      const data = d.data();
      const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : null;
      return {
        uid: d.id,
        email: (data.email as string | null | undefined) ?? null,
        role: data.role === "admin" ? "admin" : "teacher",
        createdAt,
      } satisfies UserRecord;
    })
    .sort((a, b) => (a.email ?? a.uid).localeCompare(b.email ?? b.uid));
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  if (IS_DEMO) return; // no-op — role toggling isn't meaningful with a single fake teacher
  await updateDoc(doc(db, "users", uid), { role });
}

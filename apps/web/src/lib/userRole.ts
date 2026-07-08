import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export type UserRole = "teacher" | "admin";

/**
 * Roles live in `users/{uid}` (separate from `teachers/{uid}`, which holds teaching data) so an
 * admin can be granted cross-teacher access via Firestore rules without touching teaching data.
 *
 * On a brand-new user's first login, no `users/{uid}` doc exists yet — self-provision it as a
 * plain "teacher". Promoting someone to "admin" is a manual step in the Firestore console (there
 * is no sign-up or self-promotion flow in the app), so it's never set here.
 */
export async function ensureUserRole(uid: string, email: string | null): Promise<UserRole> {
  const ref = doc(db, "users", uid);
  const snapshot = await getDoc(ref);
  if (snapshot.exists()) {
    return snapshot.data().role === "admin" ? "admin" : "teacher";
  }
  await setDoc(ref, { role: "teacher", email, createdAt: serverTimestamp() });
  return "teacher";
}

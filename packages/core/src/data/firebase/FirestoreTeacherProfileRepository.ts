import { getDoc, setDoc, type Firestore } from "firebase/firestore";
import type { TeacherProfileRepository } from "../repositories/TeacherProfileRepository";
import { DEFAULT_TEACHER_PROFILE, type TeacherProfile } from "../../domain/TeacherProfile";
import { teacherDocRef, stripUndefined } from "./paths";

export class FirestoreTeacherProfileRepository implements TeacherProfileRepository {
  constructor(
    private readonly db: Firestore,
    private readonly teacherId: string,
  ) {}

  async get(): Promise<TeacherProfile> {
    const snapshot = await getDoc(teacherDocRef(this.db, this.teacherId));
    if (!snapshot.exists()) return { ...DEFAULT_TEACHER_PROFILE };
    const data = snapshot.data();
    return {
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
      pricePerClass: data.pricePerClass ?? 0,
    };
  }

  async save(profile: TeacherProfile): Promise<TeacherProfile> {
    await setDoc(teacherDocRef(this.db, this.teacherId), stripUndefined(profile), { merge: true });
    return profile;
  }
}

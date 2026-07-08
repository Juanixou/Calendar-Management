import type { TeacherProfileRepository } from "../repositories/TeacherProfileRepository";
import { DEFAULT_TEACHER_PROFILE, type TeacherProfile } from "../../domain/TeacherProfile";
import { getDb, TEACHER_PROFILE_ID } from "./db";

export class IndexedDbTeacherProfileRepository implements TeacherProfileRepository {
  async get(): Promise<TeacherProfile> {
    const db = await getDb();
    const record = await db.get("teacherProfile", TEACHER_PROFILE_ID);
    if (!record) return { ...DEFAULT_TEACHER_PROFILE };
    const { id: _id, ...profile } = record;
    return profile;
  }

  async save(profile: TeacherProfile): Promise<TeacherProfile> {
    const db = await getDb();
    await db.put("teacherProfile", { id: TEACHER_PROFILE_ID, ...profile });
    return profile;
  }
}

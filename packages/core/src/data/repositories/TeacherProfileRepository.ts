import type { TeacherProfile } from "../../domain/TeacherProfile";

export interface TeacherProfileRepository {
  get(): Promise<TeacherProfile>;
  save(profile: TeacherProfile): Promise<TeacherProfile>;
}

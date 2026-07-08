export interface TeacherProfile {
  firstName: string;
  lastName: string;
  /** Price in the teacher's currency for one 1h class. */
  pricePerClass: number;
}

export const DEFAULT_TEACHER_PROFILE: TeacherProfile = {
  firstName: "",
  lastName: "",
  pricePerClass: 0,
};

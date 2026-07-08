import type { Repositories } from "./container";
import type { Student } from "./domain/Student";
import type { ClassPackPurchase } from "./domain/ClassPackPurchase";
import type { ClassSession } from "./domain/ClassSession";
import type { TeacherProfile } from "./domain/TeacherProfile";
import type { Note } from "./domain/Note";

export const BACKUP_FORMAT_VERSION = 1;

export interface BackupData {
  version: number;
  exportedAt: string;
  students: Student[];
  classPackPurchases: ClassPackPurchase[];
  classSessions: ClassSession[];
  teacherProfile: TeacherProfile;
  /** Absent in backups made before notes existed — treated as empty on restore. */
  notes?: Note[];
}

export async function createBackup(repositories: Repositories): Promise<BackupData> {
  const [students, classPackPurchases, classSessions, teacherProfile, notes] = await Promise.all([
    repositories.students.list(),
    repositories.classPacks.list(),
    repositories.classSessions.list(),
    repositories.teacherProfile.get(),
    repositories.notes.list(),
  ]);

  return {
    version: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    students,
    classPackPurchases,
    classSessions,
    teacherProfile,
    notes,
  };
}

/** Throws with a human-readable message if `data` doesn't look like a valid backup file. */
export function assertValidBackup(data: unknown): asserts data is BackupData {
  if (typeof data !== "object" || data === null) {
    throw new Error("El archivo no contiene un JSON válido de copia de seguridad.");
  }
  const candidate = data as Partial<BackupData>;
  if (
    !Array.isArray(candidate.students) ||
    !Array.isArray(candidate.classPackPurchases) ||
    !Array.isArray(candidate.classSessions) ||
    typeof candidate.teacherProfile !== "object" ||
    candidate.teacherProfile === null ||
    (candidate.notes !== undefined && !Array.isArray(candidate.notes))
  ) {
    throw new Error("El archivo no tiene el formato esperado de copia de seguridad de Gestión de Clases.");
  }
}

/** Wipes all current data and replaces it with the contents of `data`. */
export async function restoreBackup(repositories: Repositories, data: BackupData): Promise<void> {
  assertValidBackup(data);
  await Promise.all([
    repositories.students.replaceAll(data.students),
    repositories.classPacks.replaceAll(data.classPackPurchases),
    repositories.classSessions.replaceAll(data.classSessions),
    repositories.teacherProfile.save(data.teacherProfile),
    repositories.notes.replaceAll(data.notes ?? []),
  ]);
}

import type { Firestore } from "firebase/firestore";
import { IndexedDbStudentRepository } from "./data/local/IndexedDbStudentRepository";
import { IndexedDbClassPackRepository } from "./data/local/IndexedDbClassPackRepository";
import { IndexedDbClassSessionRepository } from "./data/local/IndexedDbClassSessionRepository";
import { IndexedDbTeacherProfileRepository } from "./data/local/IndexedDbTeacherProfileRepository";
import { IndexedDbNoteRepository } from "./data/local/IndexedDbNoteRepository";
import { FirestoreStudentRepository } from "./data/firebase/FirestoreStudentRepository";
import { FirestoreClassPackRepository } from "./data/firebase/FirestoreClassPackRepository";
import { FirestoreClassSessionRepository } from "./data/firebase/FirestoreClassSessionRepository";
import { FirestoreTeacherProfileRepository } from "./data/firebase/FirestoreTeacherProfileRepository";
import { FirestoreNoteRepository } from "./data/firebase/FirestoreNoteRepository";
import { ClassSchedulingService } from "./business/classSchedulingService";
import { MonthlySummaryService } from "./business/monthlySummaryService";
import type { StudentRepository } from "./data/repositories/StudentRepository";
import type { ClassPackRepository } from "./data/repositories/ClassPackRepository";
import type { ClassSessionRepository } from "./data/repositories/ClassSessionRepository";
import type { TeacherProfileRepository } from "./data/repositories/TeacherProfileRepository";
import type { NoteRepository } from "./data/repositories/NoteRepository";

export interface Repositories {
  students: StudentRepository;
  classPacks: ClassPackRepository;
  classSessions: ClassSessionRepository;
  teacherProfile: TeacherProfileRepository;
  notes: NoteRepository;
}

export interface Services {
  scheduling: ClassSchedulingService;
  monthlySummary: MonthlySummaryService;
}

export interface Container {
  repositories: Repositories;
  services: Services;
}

/**
 * Single place wiring repository implementations. Swapping local IndexedDB
 * for Firebase later only requires changing this factory.
 */
export function createLocalContainer(): Container {
  const repositories: Repositories = {
    students: new IndexedDbStudentRepository(),
    classPacks: new IndexedDbClassPackRepository(),
    classSessions: new IndexedDbClassSessionRepository(),
    teacherProfile: new IndexedDbTeacherProfileRepository(),
    notes: new IndexedDbNoteRepository(),
  };

  const services: Services = {
    scheduling: new ClassSchedulingService(repositories.classSessions),
    monthlySummary: new MonthlySummaryService(repositories.classPacks, repositories.classSessions),
  };

  return { repositories, services };
}

/**
 * Firestore-backed container, scoped to one teacher's data (`teachers/{teacherId}/...`). Requires
 * an already-authenticated `teacherId` (the Firebase Auth uid) — callers must not create this
 * until a user is signed in.
 */
export function createFirebaseContainer(db: Firestore, teacherId: string): Container {
  const repositories: Repositories = {
    students: new FirestoreStudentRepository(db, teacherId),
    classPacks: new FirestoreClassPackRepository(db, teacherId),
    classSessions: new FirestoreClassSessionRepository(db, teacherId),
    teacherProfile: new FirestoreTeacherProfileRepository(db, teacherId),
    notes: new FirestoreNoteRepository(db, teacherId),
  };

  const services: Services = {
    scheduling: new ClassSchedulingService(repositories.classSessions),
    monthlySummary: new MonthlySummaryService(repositories.classPacks, repositories.classSessions),
  };

  return { repositories, services };
}

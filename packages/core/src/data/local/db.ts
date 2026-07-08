import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Student } from "../../domain/Student";
import type { ClassPackPurchase } from "../../domain/ClassPackPurchase";
import type { ClassSession } from "../../domain/ClassSession";
import type { TeacherProfile } from "../../domain/TeacherProfile";
import type { Note } from "../../domain/Note";

export const DB_NAME = "gestion-clases";
const DB_VERSION = 3;

export const TEACHER_PROFILE_ID = "profile";

interface GestionClasesDB extends DBSchema {
  students: {
    key: string;
    value: Student;
  };
  classPackPurchases: {
    key: string;
    value: ClassPackPurchase;
    indexes: { "by-studentId": string };
  };
  classSessions: {
    key: string;
    value: ClassSession;
    indexes: { "by-studentId": string; "by-start": string };
  };
  teacherProfile: {
    key: string;
    value: TeacherProfile & { id: string };
  };
  notes: {
    key: string;
    value: Note;
  };
}

let dbPromise: Promise<IDBPDatabase<GestionClasesDB>> | undefined;

export function getDb(): Promise<IDBPDatabase<GestionClasesDB>> {
  if (!dbPromise) {
    dbPromise = openDB<GestionClasesDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("students")) {
          db.createObjectStore("students", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("classPackPurchases")) {
          const store = db.createObjectStore("classPackPurchases", { keyPath: "id" });
          store.createIndex("by-studentId", "studentId");
        }
        if (!db.objectStoreNames.contains("classSessions")) {
          const store = db.createObjectStore("classSessions", { keyPath: "id" });
          store.createIndex("by-studentId", "studentId");
          store.createIndex("by-start", "start");
        }
        if (!db.objectStoreNames.contains("teacherProfile")) {
          db.createObjectStore("teacherProfile", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("notes")) {
          db.createObjectStore("notes", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

/** Wipes all local data. Used by the `dev:reset` script and any future "reset data" UI action. */
export async function resetLocalDatabase(): Promise<void> {
  if (dbPromise) {
    (await dbPromise).close();
    dbPromise = undefined;
  }
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  });
}

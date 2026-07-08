import type { Level } from "./Level";

export interface Student {
  id: string;
  name: string;
  level: Level;
  /** IANA timezone of the student, e.g. "Asia/Shanghai" */
  timezone: string;
  notes?: string;
  /** Hex color for calendar events, chosen from a fixed palette. Omitted = auto-assigned by id hash. */
  color?: string;
  active: boolean;
  createdAt: string;
}

export type NewStudent = Omit<Student, "id" | "createdAt" | "active"> & {
  active?: boolean;
};

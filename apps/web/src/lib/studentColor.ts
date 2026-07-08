/** Selectable colors for a student, both for the auto-assignment hash and the manual picker. */
export const PALETTE = [
  "#2563eb", // blue
  "#16a34a", // green
  "#d97706", // amber
  "#db2777", // pink
  "#7c3aed", // violet
  "#0891b2", // cyan
  "#dc2626", // red
  "#65a30d", // lime
];

/** Fixed color for group classes, regardless of which students attend, so they stand out at a glance. */
export const GROUP_CLASS_COLOR = "#4338ca";

export function colorForStudent(studentId: string): string {
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = (hash << 5) - hash + studentId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index]!;
}

/** A student's calendar color: their manually chosen one if set, otherwise the auto-assigned hash. */
export function resolveStudentColor(student: { id: string; color?: string }): string {
  return student.color ?? colorForStudent(student.id);
}

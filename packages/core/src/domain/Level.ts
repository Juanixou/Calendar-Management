export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export type Level = (typeof LEVELS)[number];

export const LEVEL_LABELS: Record<Level, string> = {
  A1: "A1 · Principiante",
  A2: "A2 · Básico",
  B1: "B1 · Intermedio",
  B2: "B2 · Intermedio alto",
  C1: "C1 · Avanzado",
  C2: "C2 · Dominio",
};

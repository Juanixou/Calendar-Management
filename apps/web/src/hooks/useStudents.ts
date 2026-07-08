import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NewStudent, Student } from "@gestion-clases/core";
import { repositories } from "../lib/repositories";

const STUDENTS_KEY = ["students"] as const;

export function useStudents() {
  return useQuery({
    queryKey: STUDENTS_KEY,
    queryFn: () => repositories.students.list(),
  });
}

export function useStudent(studentId: string | undefined) {
  return useQuery({
    queryKey: ["students", studentId],
    queryFn: () => repositories.students.get(studentId!),
    enabled: !!studentId,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewStudent) => repositories.students.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STUDENTS_KEY }),
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<Student, "id" | "createdAt">> }) =>
      repositories.students.update(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STUDENTS_KEY }),
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repositories.students.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STUDENTS_KEY }),
  });
}

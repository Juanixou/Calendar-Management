import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NewClassPackPurchase } from "@gestion-clases/core";
import { repositories } from "../lib/repositories";

export function useClassPacksByStudent(studentId: string | undefined) {
  return useQuery({
    queryKey: ["classPacks", "student", studentId],
    queryFn: () => repositories.classPacks.listByStudent(studentId!),
    enabled: !!studentId,
  });
}

export function useCreateClassPack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewClassPackPurchase) => repositories.classPacks.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classPacks"] });
      queryClient.invalidateQueries({ queryKey: ["monthlySummary"] });
      queryClient.invalidateQueries({ queryKey: ["studentBalance"] });
      queryClient.invalidateQueries({ queryKey: ["packProgress"] });
      queryClient.invalidateQueries({ queryKey: ["packTimeline"] });
    },
  });
}

export function useDeleteClassPack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repositories.classPacks.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classPacks"] });
      queryClient.invalidateQueries({ queryKey: ["monthlySummary"] });
      queryClient.invalidateQueries({ queryKey: ["studentBalance"] });
      queryClient.invalidateQueries({ queryKey: ["packProgress"] });
      queryClient.invalidateQueries({ queryKey: ["packTimeline"] });
    },
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Note, NewNote } from "@gestion-clases/core";
import { repositories } from "../lib/repositories";

const NOTES_KEY = ["notes"] as const;

export function useNotes() {
  return useQuery({
    queryKey: NOTES_KEY,
    queryFn: () => repositories.notes.list(),
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewNote) => repositories.notes.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTES_KEY }),
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<Note, "id" | "createdAt">> }) =>
      repositories.notes.update(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTES_KEY }),
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repositories.notes.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTES_KEY }),
  });
}

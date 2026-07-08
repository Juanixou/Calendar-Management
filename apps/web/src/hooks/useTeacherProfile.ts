import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TeacherProfile } from "@gestion-clases/core";
import { repositories } from "../lib/repositories";

const TEACHER_PROFILE_KEY = ["teacherProfile"] as const;

export function useTeacherProfile() {
  return useQuery({
    queryKey: TEACHER_PROFILE_KEY,
    queryFn: () => repositories.teacherProfile.get(),
  });
}

export function useUpdateTeacherProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profile: TeacherProfile) => repositories.teacherProfile.save(profile),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TEACHER_PROFILE_KEY }),
  });
}

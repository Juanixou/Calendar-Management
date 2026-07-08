import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAllUsers, updateUserRole } from "../lib/adminUsers";
import type { UserRole } from "../lib/userRole";

const USERS_KEY = ["adminUsers"] as const;

export function useUsers() {
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: listAllUsers,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, role }: { uid: string; role: UserRole }) => updateUserRole(uid, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
  });
}

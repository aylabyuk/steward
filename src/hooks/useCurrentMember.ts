import { useAuthStore } from "@/stores/authStore";
import { useWardMembers } from "./useWardMembers";

export function useCurrentMember() {
  const uid = useAuthStore((s) => s.user?.uid);
  const { data: members } = useWardMembers();
  if (!uid) return null;
  return members.find((m) => m.id === uid) ?? null;
}

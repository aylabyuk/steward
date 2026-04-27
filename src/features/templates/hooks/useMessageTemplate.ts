import { useDocSnapshot } from "@/hooks/_sub";
import { type MessageTemplateKey, messageTemplateSchema } from "@/lib/types";
import { useCurrentWardStore } from "@/stores/currentWardStore";

/**
 * Subscribes to one of the ward's server-side messaging templates at
 * `wards/{wardId}/templates/{key}`. Returns `data: null` when no
 * template has been written yet — callers should fall back to the
 * default from `serverTemplateDefaults.ts`.
 */
export function useMessageTemplate(key: MessageTemplateKey) {
  const wardId = useCurrentWardStore((s) => s.wardId);
  return useDocSnapshot(["wards", wardId, "templates", key], messageTemplateSchema);
}

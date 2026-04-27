import { programTemplateSchema, type ProgramTemplateKey } from "@/lib/types";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { useDocSnapshot } from "@/hooks/_sub";

/** Subscribe to one of the program-template docs at
 *  `wards/{wardId}/templates/{key}` (where `key` is
 *  `conductingProgram` or `congregationProgram`). Returns
 *  `data: null` when no template has been written yet — the editor
 *  starts blank in that case. */
export function useProgramTemplate(key: ProgramTemplateKey) {
  const wardId = useCurrentWardStore((s) => s.wardId);
  return useDocSnapshot(["wards", wardId, "templates", key], programTemplateSchema);
}

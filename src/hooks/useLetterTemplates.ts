import { letterTemplateSchema } from "@/lib/types";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { useCollectionSnapshot, useDocSnapshot } from "./_sub";

export function useLetterTemplates() {
  const wardId = useCurrentWardStore((s) => s.wardId);
  return useCollectionSnapshot(["wards", wardId, "letterTemplates"], letterTemplateSchema);
}

export function useLetterTemplate(templateId: string | null) {
  const wardId = useCurrentWardStore((s) => s.wardId);
  return useDocSnapshot(
    ["wards", wardId, "letterTemplates", templateId ?? undefined],
    letterTemplateSchema,
  );
}

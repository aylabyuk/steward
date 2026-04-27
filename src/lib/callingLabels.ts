import { CALLINGS, type Calling } from "@/lib/types";

export const CALLING_LABELS: Record<Calling, string> = {
  bishop: "Bishop",
  first_counselor: "First counselor",
  second_counselor: "Second counselor",
  executive_secretary: "Executive secretary",
  assistant_executive_secretary: "Assistant executive secretary",
  ward_clerk: "Ward clerk",
  assistant_clerk: "Assistant clerk",
};

export const CALLING_OPTIONS = CALLINGS.map((c) => ({ value: c, label: CALLING_LABELS[c] }));

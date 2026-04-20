import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ensureMeetingDoc } from "@/features/meetings/ensureMeetingDoc";
import type { NonMeetingSunday } from "@/lib/types";
import { createSpeaker } from "./speakerActions";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z
    .string()
    .optional()
    .refine((v) => !v || z.email().safeParse(v).success, "Invalid email"),
  topic: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

interface Props {
  wardId: string;
  date: string;
  nonMeetingSundays: readonly NonMeetingSunday[];
  onCancel: () => void;
  onAdded: () => void;
}

const input = "rounded-md border border-slate-300 px-2 py-1 text-sm";

export function SpeakerForm({ wardId, date, nonMeetingSundays, onCancel, onAdded }: Props) {
  const { register, handleSubmit, formState, reset } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", topic: "" },
  });

  async function onSubmit(values: FormValues) {
    await ensureMeetingDoc(wardId, date, nonMeetingSundays);
    await createSpeaker({
      wardId,
      date,
      name: values.name,
      ...(values.email ? { email: values.email } : {}),
      ...(values.topic ? { topic: values.topic } : {}),
    });
    reset();
    onAdded();
  }

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(onSubmit)(e);
      }}
      className="flex flex-col gap-2"
    >
      <input {...register("name")} placeholder="Name" className={input} autoFocus />
      {formState.errors.name && (
        <span className="text-xs text-red-600">{formState.errors.name.message}</span>
      )}
      <input {...register("email")} placeholder="Email (optional)" type="email" className={input} />
      {formState.errors.email && (
        <span className="text-xs text-red-600">{formState.errors.email.message}</span>
      )}
      <input {...register("topic")} placeholder="Topic (optional)" className={input} />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={formState.isSubmitting}
          className="rounded-md bg-slate-900 px-3 py-1 text-sm text-white disabled:opacity-50"
        >
          {formState.isSubmitting ? "Adding…" : "Add"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

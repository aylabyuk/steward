import { createContext, useContext } from "react";

interface LetterRenderContextValue {
  /** Resolved assigned date for the speaker, e.g. "Sunday, May 31, 2026".
   *  `null` at template-authoring time when no specific speaker is bound;
   *  the AssignedSundayCalloutNode falls back to a friendly placeholder. */
  assignedDate: string | null;
}

const LetterRenderContext = createContext<LetterRenderContextValue>({ assignedDate: null });

interface ProviderProps {
  assignedDate: string | null;
  children: React.ReactNode;
}

/** Supplies per-render values that decorator nodes can read without
 *  storing them in the editor state. Scope: a single editor instance
 *  + its print preview. Wrap whichever subtree owns the editor +
 *  preview pair (route page, wizard step, print portal). */
export function LetterRenderContextProvider({ assignedDate, children }: ProviderProps) {
  return (
    <LetterRenderContext.Provider value={{ assignedDate }}>{children}</LetterRenderContext.Provider>
  );
}

export function useAssignedDate(): string | null {
  return useContext(LetterRenderContext).assignedDate;
}

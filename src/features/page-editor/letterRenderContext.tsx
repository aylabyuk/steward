import { createContext, useContext } from "react";

interface LetterRenderContextValue {
  /** Resolved assigned date for the speaker, e.g. "Sunday, May 31, 2026".
   *  `null` at template-authoring time when no specific speaker is bound;
   *  the AssignedSundayCalloutNode falls back to a friendly placeholder. */
  assignedDate: string | null;
  /** Variable bag used for `{{token}}` interpolation inside Callout /
   *  Letterhead / Signature props. At authoring time this is the
   *  sample-value bag (`LETTER_VARIABLE_SAMPLES`); at per-speaker
   *  render time the route hands in the real resolved values. */
  vars: Readonly<Record<string, string>>;
}

const LetterRenderContext = createContext<LetterRenderContextValue>({
  assignedDate: null,
  vars: {},
});

interface ProviderProps {
  assignedDate: string | null;
  vars: Readonly<Record<string, string>>;
  children: React.ReactNode;
}

/** Supplies per-render values that decorator nodes can read without
 *  storing them in the editor state. Scope: a single editor instance
 *  + its print preview. Wrap whichever subtree owns the editor +
 *  preview pair (route page, wizard step, print portal). */
export function LetterRenderContextProvider({ assignedDate, vars, children }: ProviderProps) {
  return (
    <LetterRenderContext.Provider value={{ assignedDate, vars }}>
      {children}
    </LetterRenderContext.Provider>
  );
}

export function useAssignedDate(): string | null {
  return useContext(LetterRenderContext).assignedDate;
}

export function useLetterVars(): Readonly<Record<string, string>> {
  return useContext(LetterRenderContext).vars;
}

import { createContext, useContext } from "react";

/** Single source of truth a host editor (letter, program) hands to
 *  every `VariableChipNode` in its tree. Lets the chip render the
 *  resolved sample / real value (instead of `{{token}}`) and surface
 *  a click-to-change picker without each node having to know which
 *  variable set it belongs to. */
export interface VariableMeta {
  token: string;
  label: string;
  group?: string;
  /** Sample value shown inside the chip while authoring. The
   *  per-speaker render path overrides via the renderer's resolved
   *  vars bag — the chip never *stores* this string. */
  sample?: string;
}

interface VariableRegistryValue {
  /** Full metadata list for the click-to-change picker, in display
   *  order. Empty when the host editor doesn't provide one. */
  variables: ReadonlyArray<VariableMeta>;
  /** Optional human-readable group labels (e.g. `meeting → "Meeting"`).
   *  When omitted the picker falls back to the raw group key. */
  groupLabels: Record<string, string>;
}

const VariableRegistryContext = createContext<VariableRegistryValue>({
  variables: [],
  groupLabels: {},
});

interface ProviderProps {
  variables: ReadonlyArray<VariableMeta>;
  groupLabels?: Record<string, string>;
  children: React.ReactNode;
}

export function VariableRegistryProvider({ variables, groupLabels, children }: ProviderProps) {
  return (
    <VariableRegistryContext.Provider value={{ variables, groupLabels: groupLabels ?? {} }}>
      {children}
    </VariableRegistryContext.Provider>
  );
}

export function useVariableRegistry(): VariableRegistryValue {
  return useContext(VariableRegistryContext);
}

export function useVariableMeta(token: string): VariableMeta | undefined {
  const { variables } = useVariableRegistry();
  return variables.find((v) => v.token === token);
}

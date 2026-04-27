---
name: project-structure
description: Per-component barrel folders, with feature-level hooks/, utils/, and __tests__/. Apply when creating new components, hooks, or utilities, when moving files, or when reviewing where new code should live. Also: PascalCase for component filenames, camelCase for hooks and utils, kebab-case folder names only for routes.
---

# Project structure

The Steward `src/` tree uses **per-component barrel folders**. Every component, no matter how small, lives in its own folder with an `index.tsx` re-export. Tests, component-private hooks, and supporting utilities live in well-defined sibling folders. This skill defines the conventions; it applies to every new component, hook, and util added to the repo.

## The rule

Every component `.tsx` is wrapped in a folder named after the component:

```
ComponentName/
  index.tsx                 # barrel: export * from "./ComponentName";
  ComponentName.tsx         # the component code
  hooks/                    # hooks used ONLY by this component (optional)
    useFoo.ts
  __tests__/                # tests for this component (optional)
    ComponentName.test.tsx
```

`index.tsx` always uses a star export so colocated `type Props` and helper exports are surfaced automatically:

```tsx
export * from "./ComponentName";
```

## Feature anatomy

Each `src/features/<feature>/` looks like:

```
<feature>/
  ComponentA/
    index.tsx
    ComponentA.tsx
    hooks/                  (optional, component-private)
    __tests__/              (optional)
  ComponentB/
    ...
  hooks/                    # hooks shared across multiple components in this feature
    useFeatureHook.ts
    __tests__/              # tests for feature-level hooks (optional)
  utils/                    # non-hook .ts files used inside the feature
    actions.ts
    __tests__/              # tests for utils (optional)
```

Sub-features (e.g. `meetings/program/`, `page-editor/nodes/`, `page-editor/plugins/`, `page-editor/toolbar/`, `program-templates/nodes/`) follow the same pattern recursively. A sub-feature has its own `hooks/`, `utils/`, and per-component folders — it does not promote internals up to the parent feature.

## Where hooks live (decision tree)

```
Hook used by ≥2 features?           → src/hooks/<useX>.ts (global)
Hook used by ≥2 components in one feature?
                                    → src/features/<feature>/hooks/<useX>.ts
Hook used by exactly one component? → src/features/<feature>/<Component>/hooks/<useX>.ts
Hook used only by app shell?        → src/app/components/hooks/ or src/app/hooks/
```

## Where utils live (decision tree)

```
Util used by ≥2 features?           → src/lib/<x>.ts
Util used inside one feature?       → src/features/<feature>/utils/<x>.ts
```

If it isn't a component and isn't a hook, it's a util — group it under `utils/`. Don't leave loose `.ts` files at the feature root.

## Naming

| Kind | Case | Example |
|---|---|---|
| Component file | PascalCase | `WardPicker.tsx` |
| Component folder | PascalCase | `WardPicker/` |
| Hook file | camelCase, `use` prefix | `useConversation.ts` |
| Util file | camelCase | `commentActions.ts` |
| Route folder | kebab-case (mirrors URL) | `app/routes/invite-speaker/` |
| Route component file | PascalCase | `InviteSpeaker.tsx` |

Routes are the only place kebab-case folder names are allowed — they exist to mirror URL paths. The component file inside still follows the PascalCase rule.

## Tests

- Tests **never** sit colocated next to source. They live in the nearest `__tests__/` folder.
- A component's tests live in `<Component>/__tests__/<Component>.test.tsx`.
- Feature-level hook tests live in `<feature>/hooks/__tests__/`.
- Feature-level util tests live in `<feature>/utils/__tests__/`.
- Inside a test file, the source import uses `../<Source>` (one level up from `__tests__/`).
- Vitest's glob (`src/**/*.{test,spec}.{ts,tsx}`) discovers tests anywhere — no config change needed.

## When adding new code

When creating a new component:
1. Create `src/features/<feature>/<NewComponent>/` (or appropriate parent).
2. Add `index.tsx` (`export * from "./<NewComponent>";`) and `<NewComponent>.tsx`.
3. If it has tests, add `__tests__/<NewComponent>.test.tsx` alongside.
4. If it has component-private hooks, add `hooks/<useX>.ts` alongside.

When creating a new hook:
1. Decide its scope using the hooks decision tree above.
2. Place it accordingly. If it grows to span multiple components later, promote it.

When creating a new util:
1. Decide its scope using the utils decision tree.
2. If it's the second feature to need it, promote it to `src/lib/` immediately — don't duplicate.

## When to apply

- Every new component, hook, or util.
- Every move or rename of an existing file.
- During code review: flag PRs that drop loose `.ts` or `.tsx` files into a feature root.

## What NOT to do

- Don't drop a `.tsx` directly into a feature root — wrap it in a folder.
- Don't put tests next to the source file — they go in `__tests__/`.
- Don't put hooks at a feature root — they go in `hooks/`.
- Don't put loose util `.ts` files at a feature root — they go in `utils/`.
- Don't leave files in kebab-case (`ward-picker.tsx`) — components are PascalCase. Only route folders may be kebab.
- Don't promote a single-feature hook to `src/hooks/` "in case it's needed later". Promote when the second importer arrives.

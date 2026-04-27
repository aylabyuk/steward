---
name: project-structure
description: Components live as flat .tsx files at their feature root by default, and get promoted to a folder only when they grow component-private hooks or tests. Feature-level hooks/, utils/, and __tests__/ keep cross-component code organized. Apply when creating new components, hooks, or utilities, when moving files, or when reviewing where new code should live. Also: PascalCase for component filenames, camelCase for hooks and utils, kebab-case folder names only for routes.
---

# Project structure

Components live as flat `.tsx` files at the feature root by default. A component only earns a folder when it grows component-private hooks or tests. Feature-level `hooks/`, `utils/`, and `__tests__/` keep cross-component code organized. This skill defines the conventions; it applies to every new component, hook, and util added to the repo.

## The rule

A component is a single `.tsx` file at its feature root:

```
features/<feature>/CommentForm.tsx
```

When (and only when) a component grows component-private hooks or tests, **promote** it to a folder of the same name with a barrel `index.tsx`:

```
ComponentName/
  index.tsx                 # barrel: export * from "./ComponentName";
  ComponentName.tsx         # the component code
  hooks/                    # the reason for promotion
    useFoo.ts
  __tests__/                # the reason for promotion
    ComponentName.test.tsx
```

The barrel `index.tsx` keeps existing imports stable across promotion — `import { CommentForm } from "@/features/comments/CommentForm"` resolves to either the flat `CommentForm.tsx` file or the folder's `index.tsx`. Promote and demote freely without churning consumers.

`index.tsx` uses a star export so colocated `type Props` and helper exports are surfaced automatically:

```tsx
export * from "./ComponentName";
```

## Feature anatomy

Each `src/features/<feature>/` looks like:

```
<feature>/
  CommentForm.tsx           # flat — no hooks or tests yet
  CommentItem.tsx           # flat
  PromotedThing/            # promoted — has private hooks or tests
    index.tsx
    PromotedThing.tsx
    hooks/                  (the reason for promotion)
    __tests__/              (the reason for promotion)
  hooks/                    # hooks shared across multiple components in this feature
    useFeatureHook.ts
    __tests__/              # tests for feature-level hooks (optional)
  utils/                    # non-hook .ts files used inside the feature
    actions.ts
    __tests__/              # tests for utils (optional)
```

Sub-features (e.g. `meetings/program/`, `page-editor/nodes/`, `page-editor/plugins/`, `page-editor/toolbar/`, `program-templates/nodes/`) follow the same pattern recursively. A sub-feature has its own `hooks/`, `utils/`, and component files — it does not promote internals up to the parent feature.

## Where hooks live (decision tree)

```
Hook used by ≥2 features?           → src/hooks/<useX>.ts (global)
Hook used by ≥2 components in one feature?
                                    → src/features/<feature>/hooks/<useX>.ts
Hook used by exactly one component? → src/features/<feature>/<Component>/hooks/<useX>.ts
                                       (and the component is in folder form)
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
| Component file | PascalCase | `CommentForm.tsx` or `CommentForm/CommentForm.tsx` |
| Component folder (when promoted) | PascalCase, matches component | `CommentForm/` |
| Hook file | camelCase, `use` prefix | `useConversation.ts` |
| Util file | camelCase | `commentActions.ts` |
| Route folder | kebab-case (mirrors URL) | `app/routes/invite-speaker/` |
| Route component file | PascalCase | `InviteSpeaker.tsx` |

Routes are the only place kebab-case folder names are allowed — they exist to mirror URL paths. The component file inside still follows the PascalCase rule.

## Tests

- Tests **never** sit colocated next to source. They live in the nearest `__tests__/` folder.
- A promoted component's tests live in `<Component>/__tests__/<Component>.test.tsx`.
- Feature-level hook tests live in `<feature>/hooks/__tests__/`.
- Feature-level util tests live in `<feature>/utils/__tests__/`.
- Inside a test file, the source import uses `../<Source>` (one level up from `__tests__/`).
- Vitest's glob (`src/**/*.{test,spec}.{ts,tsx}`) discovers tests anywhere — no config change needed.

> Note: adding the first test for a flat component is itself a reason to promote — the test needs a `__tests__/` parent inside the component's folder.

## Promotion / demotion

- **Promote** (flat → folder) when adding the first component-private hook or test:
  1. `mkdir <Component>/`
  2. `git mv <Component>.tsx <Component>/<Component>.tsx`
  3. Create `<Component>/index.tsx` with `export * from "./<Component>";`
  4. Add `hooks/` or `__tests__/` as needed.
  Imports of `@/features/<feature>/<Component>` resolve unchanged.

- **Demote** (folder → flat) when the last hook/test is removed and only the component file remains:
  1. `git mv <Component>/<Component>.tsx <Component>.tsx`
  2. Delete the empty folder + the `index.tsx`.
  Imports survive unchanged.

## When adding new code

When creating a new component:
1. Add `src/features/<feature>/<NewComponent>.tsx` (flat).
2. If it needs tests right away, promote it: create `<NewComponent>/{index.tsx, NewComponent.tsx}` and `__tests__/`.

When creating a new hook:
1. Decide its scope using the hooks decision tree above.
2. Place it accordingly. If it grows to span multiple components later, promote it.

When creating a new util:
1. Decide its scope using the utils decision tree.
2. If it's the second feature to need it, promote it to `src/lib/` immediately — don't duplicate.

## When to apply

- Every new component, hook, or util.
- Every move or rename of an existing file.
- During code review: flag PRs that drop loose `.ts` files (utils) into a feature root or a hook into a component folder it doesn't belong to.

## What NOT to do

- Don't wrap a component in a folder + `index.tsx` "just for consistency" if it has no hooks or tests — that's pure indirection. Earn the folder.
- Don't put tests next to the source file — they go in `__tests__/`.
- Don't put hooks at a feature root — they go in `hooks/` (or in a component folder's `hooks/` if private).
- Don't put loose util `.ts` files at a feature root — they go in `utils/`.
- Don't leave files in kebab-case (`ward-picker.tsx`) — components are PascalCase. Only route folders may be kebab.
- Don't promote a single-feature hook to `src/hooks/` "in case it's needed later". Promote when the second importer arrives.

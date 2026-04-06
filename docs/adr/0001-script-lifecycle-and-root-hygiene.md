# ADR 0001: Script Lifecycle and Root Hygiene

- Status: Accepted
- Date: 2026-04-06

## Context

The repository accumulated many one-off patch and fix scripts in root. This made project entry points unclear, increased noise in code reviews, and blurred the boundary between product code and temporary maintenance artifacts.

## Decision

1. Root-level patch/fix/update scripts are not allowed.
2. Active temporary scripts must live in `scripts/migrations/`.
3. Archived one-off scripts must live in `scripts/legacy-patches/`.
4. Root hygiene is enforced by `npm run check:structure` and by CI.
5. Preferred strategy is source changes plus tests, not repeated patch scripts.

## Consequences

- Repository root stays focused on product/build files.
- Contributors can quickly find active vs archived scripts.
- CI blocks regressions in project structure.
- Temporary script usage gains a clear lifecycle and ownership model.

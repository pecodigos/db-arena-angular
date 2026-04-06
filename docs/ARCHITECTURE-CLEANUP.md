# Dragon Ball Arena Frontend Architecture and Cleanup

## Goals

- Reduce cognitive load by organizing code by feature and responsibility.
- Keep gameplay behavior stable while improving maintainability.
- Remove dead code and temporary patch artifacts from the product path.

## Current Observations

- Battle flow is concentrated in a very large component (`battle.component.ts`, over 1200 lines).
- Matchmaking selection flow is also large (`character-selection.component.ts`, over 400 lines).
- The websocket service contains connection lifecycle, subscription management, payload parsing, and command publishing in one class.
- Temporary patch/fix scripts live at repo root, mixed with production code.

## Target Frontend Shape

Use a feature-first layout with clear boundaries:

```text
src/app/
  core/
    auth/
    websocket/
    http/
    guards/
    config/
  shared/
    ui/
    directives/
    pipes/
    utils/
    models/
  features/
    home/
    leaderboard/
    profile/
    game-manual/
    battle/
      shell/
      queue/
      turn-planner/
      board/
      effects/
```

## Responsibility Boundaries

- Core
  - Cross-cutting services only: auth session, websocket transport, interceptors, route guards.
  - No page-specific UI state.
- Shared
  - Reusable visual and utility primitives.
  - No feature business rules.
- Features
  - Route-driven flows and feature-specific state.
  - Keep side effects in facades/services, not large components.

## Battle Refactor Plan (Safe Sequence)

1. Extract read-only selectors from `battle.component.ts` into a `battle-state.facade.ts`.
2. Extract turn queue mutation logic into `turn-planner.service.ts`.
3. Extract any-energy modal state into `any-energy.service.ts`.
4. Keep `battle.component.ts` as orchestration + template bindings only.
5. Add regression tests for turn planning and target selection.

## Matchmaking Refactor Plan

1. Move polling/reconnect logic out of `character-selection.component.ts` into `match-search.service.ts`.
2. Keep drag/drop and team arrangement logic in a dedicated `team-builder.service.ts`.
3. Make component focus on rendering and user interactions.

## Script Hygiene

- Keep one-off patch/fix scripts under `scripts/legacy-patches/` (never in repo root).
- Keep active temporary migration scripts under `scripts/migrations/`.
- Enforce root hygiene with `npm run check:structure`.
- Prefix temporary scripts with date and purpose.
- Delete temporary scripts once merged behavior is verified.

## Immediate Cleanup Completed

- Removed unused battle helper services that were not referenced by production code:
  - `turn.service.ts`
  - `skill-validation.service.ts`
- Removed unused legacy NPM dependency and type package:
  - `stompjs`
  - `@types/stompjs`
- Moved root-level patch/fix scripts into `scripts/legacy-patches/`.

## Definition of Done for Future Cleanup PRs

- No gameplay rule changes unless explicitly requested.
- Build passes (`npm run build`).
- Unit tests pass (`npm test` or focused suites).
- Each refactor PR isolates one responsibility split.

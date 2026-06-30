// Adapter layer: pure functions mapping backend DTOs (lib/api/types) to the UI
// types (lib/types). This isolates all enum/naming/status mismatches in one
// place so UI components keep consuming the existing shapes unchanged.
//
// Driver / trip / subscription-plan adapters are added here as Phase 2/3 of the
// integration lands (see /Users/danfordchris/.claude/plans/analyse-the-the-two-cryptic-bear.md).

export { toUiRole, toBackendRole } from './roles'
export { toPlan, toCreatePlanBody } from './plans'
export { toDriver } from './drivers'

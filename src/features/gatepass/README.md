# GatePass frontend structure

## Component structure
- `GatePassApp` owns the guard-first shell and module routing.
- `GatePassPanels` contains independently testable panels: status, guard home, QR scan, walk-in, override, recognized visitors, confirmation, error, and admin shell.
- `gatepassReducer` contains the explicit state machine and validation logic.

## State model
`home -> qr|walkin|search|override -> confirmed|error -> home`

Every entry record includes `guardId`, `method`, `status`, `syncState`, and timestamp. Offline records are `sync-pending` and remain in `pendingSync` until reconciliation.

## UI flow diagram
Guest arrival -> Guard chooses QR / Walk-in / Search / Override -> Input validation -> Explicit success or blocked error -> Entry logged online or queued offline -> Admin shell reviews counts and override flags.

## Trustless audit coverage
- No network: offline toggle queues entries visibly.
- Slow guard behavior: partial forms block with explicit errors.
- Repeated taps: reducer ignores in-flight duplicate submissions.
- Partial form completion: visitor, host, and unit are mandatory.
- Camera failure: moves to blocked error with fallback actions.
- QR failure/replay: no log is created and error is visible.

## Test cases
See `__tests__/gatepassReducer.test.ts` and `__tests__/GatePassApp.test.tsx` for success paths and failure cases.

## Sources
- React reducer state pattern: https://react.dev/reference/react/useReducer
- React Testing Library behavior-focused tests: https://testing-library.com/docs/react-testing-library/intro/

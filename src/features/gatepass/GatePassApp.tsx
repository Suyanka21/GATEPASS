import { useReducer } from "react";
import { AdminShell, ConfirmationPanel, ErrorPanel, GuardHome, OverridePanel, QrScanPanel, SearchPanel, StatusBanner, WalkInPanel } from "./components/GatePassPanels";
import { gatePassReducer, initialGatePassState } from "./gatepassReducer";

export function GatePassApp() {
  const [state, dispatch] = useReducer(gatePassReducer, initialGatePassState);
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-4 md:px-6 md:py-6">
        <StatusBanner state={state} dispatch={dispatch} />
        <nav className="grid grid-cols-3 gap-2 md:grid-cols-6" aria-label="GatePass modules">
          {(["home", "qr", "walkin", "search", "override", "admin"] as const).map((mode) => (
            <button key={mode} className={`focus-ring border px-3 py-3 text-sm font-bold capitalize ${state.mode === mode ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`} onClick={() => mode === "qr" ? dispatch({ type: "START_CAMERA" }) : dispatch({ type: "NAVIGATE", mode })}>{mode === "walkin" ? "Walk-in" : mode}</button>
          ))}
        </nav>
        {state.mode === "home" && <GuardHome state={state} dispatch={dispatch} />}
        {state.mode === "qr" && <QrScanPanel state={state} dispatch={dispatch} />}
        {state.mode === "walkin" && <WalkInPanel state={state} dispatch={dispatch} />}
        {state.mode === "override" && <OverridePanel state={state} dispatch={dispatch} />}
        {state.mode === "search" && <SearchPanel state={state} dispatch={dispatch} />}
        {state.mode === "confirmed" && <ConfirmationPanel state={state} dispatch={dispatch} />}
        {state.mode === "error" && <ErrorPanel state={state} dispatch={dispatch} />}
        {state.mode === "admin" && <AdminShell state={state} />}
      </div>
    </main>
  );
}

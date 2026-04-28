import { AlertTriangle, CheckCircle2, Clock3, LayoutDashboard, QrCode, Radar, ScanLine, Search, ShieldAlert, UserPlus, Wifi, WifiOff } from "lucide-react";
import type { EntryDraft, GatePassAction, GatePassState, Visitor } from "../types";

type Props = {
  state: GatePassState;
  dispatch: React.Dispatch<GatePassAction>;
};

const toneClass = {
  info: "border-info bg-info/10 text-info-foreground",
  success: "border-success bg-success/10 text-success-foreground",
  warning: "border-warning bg-warning/15 text-warning-foreground",
  danger: "border-destructive bg-destructive/10 text-destructive",
};

export function StatusBanner({ state, dispatch }: Props) {
  return (
    <div className={`flex flex-col gap-3 border p-4 shadow-panel md:flex-row md:items-center md:justify-between ${toneClass[state.banner.tone]}`} role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        {state.network === "offline" ? <WifiOff className="mt-0.5 h-5 w-5 shrink-0" /> : <Wifi className="mt-0.5 h-5 w-5 shrink-0" />}
        <div>
          <p className="font-display text-base font-semibold">{state.network === "offline" ? "Offline guard mode" : "Gate station online"}</p>
          <p className="text-sm opacity-90">{state.banner.message}</p>
        </div>
      </div>
      <button className="focus-ring border border-current px-4 py-2 text-sm font-semibold transition-transform hover:-translate-y-0.5" onClick={() => dispatch({ type: "SET_NETWORK", network: state.network === "online" ? "offline" : "online" })}>
        Simulate {state.network === "online" ? "offline" : "online"}
      </button>
    </div>
  );
}

export function GuardHome({ state, dispatch }: Props) {
  return (
    <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="surface-grid border border-border p-5 shadow-panel">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">Default guard workflow</p>
        <h1 className="mt-3 font-display text-4xl font-black leading-tight text-foreground md:text-6xl">GatePass</h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">Fast entry control with explicit logging, offline queues, and no silent approvals.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <ActionButton icon={<ScanLine />} label="Scan QR" hint="pre-approved visitor" onClick={() => dispatch({ type: "START_CAMERA" })} />
          <ActionButton icon={<UserPlus />} label="Walk-in" hint="log guest manually" onClick={() => dispatch({ type: "NAVIGATE", mode: "walkin" })} />
          <ActionButton icon={<Search />} label="Recognized" hint="search frequent visitors" onClick={() => dispatch({ type: "NAVIGATE", mode: "search" })} />
          <ActionButton icon={<ShieldAlert />} label="Override" hint="reason required" danger onClick={() => dispatch({ type: "NAVIGATE", mode: "override" })} />
        </div>
      </div>
      <AuditPanel state={state} dispatch={dispatch} />
    </section>
  );
}

function ActionButton({ icon, label, hint, danger, onClick }: { icon: React.ReactNode; label: string; hint: string; danger?: boolean; onClick: () => void }) {
  return (
    <button className={`focus-ring group flex min-h-28 items-center gap-4 border p-4 text-left shadow-panel transition-all hover:-translate-y-1 hover:shadow-glow ${danger ? "border-destructive bg-destructive/10" : "border-border bg-card"}`} onClick={onClick}>
      <span className={`grid h-12 w-12 place-items-center border ${danger ? "border-destructive text-destructive" : "border-primary text-primary"}`}>{icon}</span>
      <span><span className="block font-display text-2xl font-bold text-foreground">{label}</span><span className="text-sm text-muted-foreground">{hint}</span></span>
    </button>
  );
}

export function QrScanPanel({ state, dispatch }: Props) {
  return (
    <section className="grid gap-5 lg:grid-cols-[0.85fr_1fr]">
      <div className="border border-border bg-card p-5 shadow-panel">
        <h2 className="font-display text-3xl font-bold">QR scan</h2>
        <div className="mt-5 grid aspect-square place-items-center border border-dashed border-primary bg-primary/10 scan-field">
          <QrCode className="h-28 w-28 text-primary" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button className="focus-ring border border-success p-3 text-sm font-semibold text-success-foreground" onClick={() => dispatch({ type: "SCAN_QR", outcome: "valid" })}>Valid QR</button>
          <button className="focus-ring border border-destructive p-3 text-sm font-semibold text-destructive" onClick={() => dispatch({ type: "SCAN_QR", outcome: "invalid" })}>QR fail</button>
          <button className="focus-ring border border-warning p-3 text-sm font-semibold text-warning-foreground" onClick={() => dispatch({ type: "SCAN_QR", outcome: "replayed" })}>Replay</button>
        </div>
        <button className="focus-ring mt-3 w-full border border-destructive p-3 text-sm font-semibold text-destructive" onClick={() => dispatch({ type: "CAMERA_FAILED" })}>Simulate camera failure</button>
      </div>
      <EntryForm title="QR confirmation" state={state} dispatch={dispatch} requireReason={false} />
    </section>
  );
}

export function WalkInPanel(props: Props) {
  return <EntryForm title="Walk-in entry" {...props} requireReason={false} />;
}

export function OverridePanel(props: Props) {
  return <EntryForm title="Manual override" {...props} requireReason />;
}

function EntryForm({ title, state, dispatch, requireReason }: Props & { title: string; requireReason: boolean }) {
  const fields: Array<[keyof EntryDraft, string, string]> = [["visitorName", "Visitor name", "e.g. Ama Mensah"], ["host", "Resident / host", "e.g. J. Bello"], ["unit", "Unit", "e.g. 14D"], ["plate", "Plate / ID", "optional"]];
  return (
    <section className="border border-border bg-card p-5 shadow-panel">
      <h2 className="font-display text-3xl font-bold">{title}</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {fields.map(([field, label, placeholder]) => (
          <label key={field} className="grid gap-2 text-sm font-semibold text-foreground">{label}<input className="focus-ring border border-input bg-background px-3 py-3 text-base font-medium" value={state.draft[field]} placeholder={placeholder} onChange={(event) => dispatch({ type: "UPDATE_DRAFT", field, value: event.target.value })} /></label>
        ))}
        <label className="grid gap-2 text-sm font-semibold text-foreground md:col-span-2">Reason {requireReason ? "(required)" : ""}<textarea className="focus-ring min-h-24 border border-input bg-background px-3 py-3 text-base font-medium" value={state.draft.reason} placeholder="Visible audit reason" onChange={(event) => dispatch({ type: "UPDATE_DRAFT", field: "reason", value: event.target.value })} /></label>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button className="focus-ring flex-1 bg-primary px-5 py-4 font-display text-lg font-bold text-primary-foreground shadow-panel transition-transform hover:-translate-y-0.5" onClick={() => dispatch({ type: "SUBMIT_ENTRY" })}>Log entry</button>
        <button className="focus-ring border border-border px-5 py-4 font-semibold" onClick={() => dispatch({ type: "RESET_FLOW" })}>Cancel visibly</button>
      </div>
    </section>
  );
}

export function SearchPanel({ state, dispatch }: Props) {
  return (
    <section className="border border-border bg-card p-5 shadow-panel">
      <h2 className="font-display text-3xl font-bold">Recognized visitors</h2>
      <div className="mt-5 grid gap-3">
        {state.recognizedVisitors.map((visitor) => <VisitorRow key={visitor.id} visitor={visitor} dispatch={dispatch} />)}
      </div>
    </section>
  );
}

function VisitorRow({ visitor, dispatch }: { visitor: Visitor; dispatch: React.Dispatch<GatePassAction> }) {
  return (
    <button className="focus-ring grid gap-2 border border-border bg-background p-4 text-left transition-transform hover:-translate-y-0.5 md:grid-cols-[1fr_auto]" onClick={() => dispatch({ type: "SELECT_VISITOR", visitor })}>
      <span><span className="font-display text-xl font-bold">{visitor.name}</span><span className="block text-sm text-muted-foreground">Host {visitor.host} · Unit {visitor.unit} · {visitor.plate ?? "No plate"}</span></span>
      <span className="text-sm font-bold uppercase text-accent">{visitor.recognition}</span>
    </button>
  );
}

export function ConfirmationPanel({ state, dispatch }: Props) {
  const entry = state.lastEntry;
  return (
    <section className="border border-success bg-success/10 p-6 shadow-panel">
      <CheckCircle2 className="h-12 w-12 text-success-foreground" />
      <h2 className="mt-4 font-display text-4xl font-black">Entry recorded</h2>
      <p className="mt-2 text-muted-foreground">{entry?.visitorName} · {entry?.method} · {entry?.guardId} · {entry?.syncState}</p>
      <button className="focus-ring mt-6 bg-primary px-5 py-4 font-display text-lg font-bold text-primary-foreground" onClick={() => dispatch({ type: "RESET_FLOW" })}>Next arrival</button>
    </section>
  );
}

export function ErrorPanel({ state, dispatch }: Props) {
  return (
    <section className="border border-destructive bg-destructive/10 p-6 shadow-panel" role="alert">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="mt-4 font-display text-4xl font-black">Entry blocked</h2>
      <p className="mt-2 text-destructive">{state.banner.message}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row"><button className="focus-ring border border-border px-5 py-4 font-semibold" onClick={() => dispatch({ type: "NAVIGATE", mode: "walkin" })}>Use walk-in</button><button className="focus-ring border border-destructive px-5 py-4 font-semibold text-destructive" onClick={() => dispatch({ type: "NAVIGATE", mode: "override" })}>Manual override</button></div>
    </section>
  );
}

function AuditPanel({ state, dispatch }: Props) {
  return (
    <aside className="border border-border bg-card p-5 shadow-panel">
      <div className="flex items-center justify-between gap-3"><h2 className="font-display text-2xl font-bold">Audit queue</h2><Radar className="h-6 w-6 text-accent" /></div>
      <dl className="mt-5 grid grid-cols-3 gap-2 text-center"><div className="border border-border p-3"><dt className="text-xs text-muted-foreground">Logged</dt><dd className="font-display text-2xl font-bold">{state.entries.length}</dd></div><div className="border border-border p-3"><dt className="text-xs text-muted-foreground">Pending</dt><dd className="font-display text-2xl font-bold">{state.pendingSync.length}</dd></div><div className="border border-border p-3"><dt className="text-xs text-muted-foreground">Guard</dt><dd className="font-display text-sm font-bold">04</dd></div></dl>
      <button className="focus-ring mt-4 w-full border border-primary p-3 font-semibold text-primary" onClick={() => dispatch({ type: "SYNC_PENDING" })}>Reconcile queue</button>
      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">{state.audit.slice(0, 4).map((item) => <li className="border-l-2 border-accent pl-3" key={item}>{item}</li>)}</ul>
    </aside>
  );
}

export function AdminShell({ state }: { state: GatePassState }) {
  return (
    <section className="border border-border bg-card p-5 shadow-panel">
      <div className="flex items-center gap-3"><LayoutDashboard className="h-7 w-7 text-primary" /><h2 className="font-display text-3xl font-bold">Admin dashboard shell</h2></div>
      <div className="mt-5 grid gap-3 md:grid-cols-3"><Metric label="Entries today" value={state.entries.length.toString()} /><Metric label="Offline queue" value={state.pendingSync.length.toString()} /><Metric label="Review flags" value={state.entries.filter((e) => e.method === "override").length.toString()} /></div>
      <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="h-4 w-4" /> Dashboard is view-only in this frontend shell.</p>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="border border-border bg-background p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="font-display text-4xl font-black">{value}</p></div>;
}

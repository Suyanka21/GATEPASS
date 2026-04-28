import type { EntryDraft, EntryRecord, GatePassAction, GatePassState, Visitor } from "./types";

const emptyDraft: EntryDraft = {
  visitorName: "",
  host: "",
  unit: "",
  plate: "",
  reason: "",
  method: "walk-in",
};

export const recognizedVisitors: Visitor[] = [
  { id: "v-101", name: "Maya Chen", host: "A. Okafor", unit: "18B", plate: "LND-482", lastSeen: "08:42", recognition: "pre-approved" },
  { id: "v-102", name: "Dario Miles", host: "N. Patel", unit: "07C", plate: "KJA-019", lastSeen: "Yesterday", recognition: "frequent" },
  { id: "v-103", name: "Unknown courier", host: "Multiple", unit: "Service", lastSeen: "2 days", recognition: "watch" },
];

export const initialGatePassState: GatePassState = {
  mode: "home",
  guardId: "guard-west-04",
  network: "online",
  cameraState: "idle",
  qrState: "idle",
  draft: emptyDraft,
  inFlight: false,
  banner: { tone: "info", message: "Ready for next arrival. Every entry requires a guard audit trail." },
  entries: [],
  pendingSync: [],
  recognizedVisitors,
  audit: ["Session opened by guard-west-04"],
};

export function validateDraft(draft: EntryDraft, guardId: string): string | null {
  if (!guardId) return "Guard identity missing. Entry cannot be logged.";
  if (!draft.visitorName.trim()) return "Visitor name is required before entry can be logged.";
  if (!draft.host.trim()) return "Resident or host is required for accountability.";
  if (!draft.unit.trim()) return "Unit is required to prevent orphan entries.";
  if (draft.method === "override" && draft.reason.trim().length < 8) return "Manual override requires a meaningful reason.";
  return null;
}

function createEntry(state: GatePassState): EntryRecord {
  const queued = state.network === "offline";
  return {
    ...state.draft,
    id: `entry-${state.entries.length + state.pendingSync.length + 1}`,
    guardId: state.guardId,
    createdAt: new Date().toISOString(),
    status: queued ? "sync-pending" : "logged",
    syncState: queued ? "queued" : "synced",
  };
}

// React useReducer keeps GatePass transitions explicit and testable.
// Source: https://react.dev/reference/react/useReducer
export function gatePassReducer(state: GatePassState, action: GatePassAction): GatePassState {
  switch (action.type) {
    case "NAVIGATE": {
      const method = action.mode === "override" ? "override" : action.mode === "qr" ? "qr" : state.draft.method;
      return { ...state, mode: action.mode, draft: { ...state.draft, method }, inFlight: false };
    }
    case "SET_NETWORK":
      return {
        ...state,
        network: action.network,
        banner: action.network === "offline"
          ? { tone: "warning", message: "Offline mode active. Entries are queued and visibly marked until sync." }
          : { tone: "success", message: "Network restored. Pending entries can be reconciled now." },
      };
    case "START_CAMERA":
      return { ...state, mode: "qr", cameraState: "ready", qrState: "idle", banner: { tone: "info", message: "Camera ready. Scan one QR at a time." } };
    case "CAMERA_FAILED":
      return { ...state, mode: "error", cameraState: "failed", banner: { tone: "danger", message: "Camera failed. Use walk-in or manual override; do not wave anyone through." } };
    case "SCAN_QR": {
      if (action.outcome !== "valid") {
        return {
          ...state,
          mode: "error",
          qrState: action.outcome,
          banner: { tone: "danger", message: action.outcome === "replayed" ? "QR already used. Entry denied until manual review." : "QR invalid. No entry has been logged." },
        };
      }
      return {
        ...state,
        qrState: "valid",
        draft: { visitorName: "QR Guest", host: "Resident verified", unit: "12A", plate: "", reason: "QR pre-approval", method: "qr" },
        banner: { tone: "success", message: "QR verified. Confirm to create the audit record." },
      };
    }
    case "UPDATE_DRAFT":
      return { ...state, draft: { ...state.draft, [action.field]: action.value } };
    case "SELECT_VISITOR":
      return {
        ...state,
        mode: "walkin",
        draft: { visitorName: action.visitor.name, host: action.visitor.host, unit: action.visitor.unit, plate: action.visitor.plate ?? "", reason: "Recognized visitor", method: "recognized" },
        banner: { tone: action.visitor.recognition === "watch" ? "warning" : "info", message: `${action.visitor.name} loaded. Confirm details before logging.` },
      };
    case "SUBMIT_ENTRY": {
      if (state.inFlight) return { ...state, banner: { tone: "warning", message: "Entry is already being recorded. Repeated tap ignored." } };
      const error = validateDraft(state.draft, state.guardId);
      if (error) return { ...state, mode: "error", banner: { tone: "danger", message: error } };
      const entry = createEntry(state);
      return {
        ...state,
        mode: "confirmed",
        inFlight: false,
        lastEntry: entry,
        entries: [entry, ...state.entries],
        pendingSync: entry.syncState === "queued" ? [entry, ...state.pendingSync] : state.pendingSync,
        audit: [`${entry.status}: ${entry.id} by ${entry.guardId}`, ...state.audit],
        banner: { tone: entry.syncState === "queued" ? "warning" : "success", message: entry.syncState === "queued" ? "Entry logged offline and queued for sync." : "Entry logged with guard attribution." },
      };
    }
    case "FAIL_ACTIVE_ENTRY":
      return { ...state, mode: "error", inFlight: false, banner: { tone: "danger", message: action.reason } };
    case "SYNC_PENDING":
      return {
        ...state,
        pendingSync: state.network === "online" ? [] : state.pendingSync,
        entries: state.entries.map((entry) => state.network === "online" && entry.syncState === "queued" ? { ...entry, syncState: "synced", status: "logged" } : entry),
        banner: state.network === "online" ? { tone: "success", message: "Queued entries reconciled. No floating records remain." } : { tone: "warning", message: "Still offline. Sync not attempted." },
      };
    case "RESET_FLOW":
      return { ...state, mode: "home", draft: emptyDraft, cameraState: "idle", qrState: "idle", inFlight: false, banner: { tone: "info", message: "Ready for next arrival." } };
    default:
      return state;
  }
}

export type GatePassMode = "home" | "qr" | "walkin" | "override" | "search" | "admin" | "confirmed" | "error";
export type NetworkState = "online" | "offline";
export type EntryMethod = "qr" | "walk-in" | "override" | "recognized";
export type EntryStatus = "draft" | "pending" | "approved" | "denied" | "logged" | "sync-pending" | "failed";

export type Visitor = {
  id: string;
  name: string;
  host: string;
  unit: string;
  plate?: string;
  lastSeen: string;
  recognition: "pre-approved" | "frequent" | "watch";
};

export type EntryDraft = {
  visitorName: string;
  host: string;
  unit: string;
  plate: string;
  reason: string;
  method: EntryMethod;
};

export type EntryRecord = EntryDraft & {
  id: string;
  guardId: string;
  createdAt: string;
  status: EntryStatus;
  syncState: "synced" | "queued" | "failed";
};

export type GatePassState = {
  mode: GatePassMode;
  guardId: string;
  network: NetworkState;
  cameraState: "idle" | "ready" | "failed";
  qrState: "idle" | "valid" | "invalid" | "replayed";
  draft: EntryDraft;
  inFlight: boolean;
  banner: { tone: "info" | "success" | "warning" | "danger"; message: string };
  lastEntry?: EntryRecord;
  entries: EntryRecord[];
  pendingSync: EntryRecord[];
  recognizedVisitors: Visitor[];
  audit: string[];
};

export type GatePassAction =
  | { type: "NAVIGATE"; mode: GatePassMode }
  | { type: "SET_NETWORK"; network: NetworkState }
  | { type: "START_CAMERA" }
  | { type: "CAMERA_FAILED" }
  | { type: "SCAN_QR"; outcome: "valid" | "invalid" | "replayed" }
  | { type: "UPDATE_DRAFT"; field: keyof EntryDraft; value: string }
  | { type: "SELECT_VISITOR"; visitor: Visitor }
  | { type: "SUBMIT_ENTRY" }
  | { type: "FAIL_ACTIVE_ENTRY"; reason: string }
  | { type: "SYNC_PENDING" }
  | { type: "RESET_FLOW" };

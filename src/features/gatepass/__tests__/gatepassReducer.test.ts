import { describe, expect, it } from "vitest";
import { gatePassReducer, initialGatePassState, recognizedVisitors, validateDraft } from "../gatepassReducer";

describe("GatePass state model", () => {
  it("blocks partial walk-in entries with an explicit failure message", () => {
    const state = gatePassReducer(initialGatePassState, { type: "UPDATE_DRAFT", field: "visitorName", value: "Ada" });
    const failed = gatePassReducer(state, { type: "SUBMIT_ENTRY" });
    expect(failed.mode).toBe("error");
    expect(failed.banner.message).toContain("Resident or host is required");
    expect(failed.entries).toHaveLength(0);
  });

  it("logs a complete entry with exactly one guard attribution", () => {
    let state = initialGatePassState;
    state = gatePassReducer(state, { type: "UPDATE_DRAFT", field: "visitorName", value: "Ada" });
    state = gatePassReducer(state, { type: "UPDATE_DRAFT", field: "host", value: "Bola" });
    state = gatePassReducer(state, { type: "UPDATE_DRAFT", field: "unit", value: "4A" });
    const logged = gatePassReducer(state, { type: "SUBMIT_ENTRY" });
    expect(logged.mode).toBe("confirmed");
    expect(logged.entries[0].guardId).toBe("guard-west-04");
    expect(logged.entries[0].status).toBe("logged");
  });

  it("queues entries visibly when there is no network", () => {
    let state = gatePassReducer(initialGatePassState, { type: "SET_NETWORK", network: "offline" });
    state = gatePassReducer(state, { type: "UPDATE_DRAFT", field: "visitorName", value: "Offline Guest" });
    state = gatePassReducer(state, { type: "UPDATE_DRAFT", field: "host", value: "Resident" });
    state = gatePassReducer(state, { type: "UPDATE_DRAFT", field: "unit", value: "9C" });
    const queued = gatePassReducer(state, { type: "SUBMIT_ENTRY" });
    expect(queued.pendingSync).toHaveLength(1);
    expect(queued.entries[0].syncState).toBe("queued");
    expect(queued.banner.message).toContain("queued for sync");
  });

  it("does not claim sync success while still offline", () => {
    const offline = gatePassReducer(initialGatePassState, { type: "SET_NETWORK", network: "offline" });
    const synced = gatePassReducer(offline, { type: "SYNC_PENDING" });
    expect(synced.banner.message).toBe("Still offline. Sync not attempted.");
  });

  it("turns camera failure into an explicit blocked state", () => {
    const failed = gatePassReducer(initialGatePassState, { type: "CAMERA_FAILED" });
    expect(failed.mode).toBe("error");
    expect(failed.banner.message).toContain("Camera failed");
  });

  it("rejects invalid and replayed QR scans without logging", () => {
    const invalid = gatePassReducer(initialGatePassState, { type: "SCAN_QR", outcome: "invalid" });
    const replayed = gatePassReducer(initialGatePassState, { type: "SCAN_QR", outcome: "replayed" });
    expect(invalid.entries).toHaveLength(0);
    expect(invalid.mode).toBe("error");
    expect(replayed.banner.message).toContain("already used");
  });

  it("requires meaningful manual override reason", () => {
    const error = validateDraft({ visitorName: "Fast bypass", host: "Resident", unit: "1A", plate: "", method: "override", reason: "ok" }, "guard-west-04");
    expect(error).toContain("meaningful reason");
  });

  it("loads recognized visitors into a confirmable draft instead of silently approving", () => {
    const state = gatePassReducer(initialGatePassState, { type: "SELECT_VISITOR", visitor: recognizedVisitors[0] });
    expect(state.mode).toBe("walkin");
    expect(state.draft.method).toBe("recognized");
    expect(state.entries).toHaveLength(0);
  });
});

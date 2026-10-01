import { describe, expect, it, vi } from "vitest";
import {
  RUNTIME_INSPECTION_SCHEMA_VERSION,
  createRuntimeInspector,
  type DecisionTrace,
  type RuntimeInspectionState
} from "./index";

const decision: DecisionTrace = {
  decisionId: "decision-track-1",
  timestamp: "2026-01-01T00:00:00.000Z",
  kind: "track-selection",
  scope: { journeyId: "journey-1", planeId: "plane-1", objectId: "object-1", playlistId: "playlist-1", trackId: "track-1" },
  sourceRuleIds: ["rule-unheard"],
  candidatesBefore: ["track-1", "track-2"],
  exclusions: [{ candidateId: "track-2", reason: "Recently heard", ruleId: "rule-unheard" }],
  candidatesAfter: ["track-1"],
  probabilities: { "track-1": 1 },
  weights: { "track-1": 0.42 },
  randomSample: 0.25,
  selectedId: "track-1",
  reason: "Only unheard candidate remained.",
  fallbackSteps: ["Use recent tracks if the unheard pool is empty."],
  causedEffectIds: ["queue-1", "camera-1"]
};

function state(): RuntimeInspectionState {
  return {
    queue: [{ id: "queue-1", kind: "track", trackId: "track-1", playlistId: "playlist-1", objectId: "object-1", planeId: "plane-1", sourceDecisionId: decision.decisionId, status: "active", certainty: "guaranteed", insertionReason: "Selected by decision-track-1.", sourceRuleIds: ["rule-unheard"], invalidationConditions: ["object removed"] }],
    orchestration: { phase: "residency", scope: { journeyId: "journey-1", planeId: "plane-1" }, rules: [{ id: "rule-unheard", state: "effective", provenance: { value: true, source: "config", sourceId: "program-7" } }], pools: [{ id: "pool-1", candidateIds: ["track-1", "track-2"] }], activeExclusions: decision.exclusions, fallbackRules: ["recent-ok"], historyInputs: { recent: ["track-2"] }, randomizationInputs: { sample: 0.25 } },
    journey: { active: true, journeyId: "journey-1", sessionId: "session-1", currentPlaneId: "plane-1", currentObjectId: "object-1", cursor: 0, cycle: 1, completedCycles: 0, songCount: 1, residencyPolicy: { value: { kind: "songs", count: 2 }, source: "config" }, residencyProgress: { completed: 1, required: 2 }, residencySatisfied: false, residencyReason: "One of two required songs completed.", completedJourneyCount: 0, nextExpectedAction: "complete queue-1" },
    planes: [{ id: "plane-1", label: "First", order: 0, state: "current", journeyEligible: true, residencyState: "in-progress", assignedObjectIds: ["object-1"], visibleObjectIds: ["object-1"], randomizedObjectIds: [], pairedPlaylistIds: ["playlist-1"], pendingTransitionIds: [], activeTransitionIds: [], queueEntryIds: ["queue-1"] }],
    objects: [{ id: "object-1", assetId: "asset-1", planeId: "plane-1", classification: "authored", pairing: "paired", visibilityIntent: { value: true, source: "runtime" }, focusState: "focused", journeyEligible: true, trackId: "track-1", playlistId: "playlist-1", exclusionReasons: [], orchestrationRuleIds: ["rule-unheard"], cameraIntentId: "camera-1", loadStatus: "loaded", placementIntent: { x: 1, y: 2, z: 3 } }],
    playlists: [{ id: "playlist-1", active: true, queuePosition: 0, memberTrackIds: ["track-1", "track-2"], completedTrackIds: [], remainingTrackIds: ["track-1", "track-2"], completionStatus: "not-started", completionHistory: [], probability: 0.5, weight: 1, effectiveProbability: 1, effectiveWeight: 0.42, modifierIds: [], activationReason: "Object requested pool-1.", sourceDecisionId: decision.decisionId }],
    tracks: [{ id: "track-1", playlistIds: ["playlist-1"], available: true, exclusionReasons: [], probability: 1, weight: 0.42, effectiveProbability: 1, effectiveWeight: 0.42 }, { id: "track-2", playlistIds: ["playlist-1"], available: true, exclusionReasons: ["Recently heard"] }],
    audio: { state: "playing", trackId: "track-1", playlistId: "playlist-1", objectId: "object-1", planeId: "plane-1", queueEntryId: "queue-1", sourceDecisionId: decision.decisionId, playbackMode: "once", loop: false, volumeIntent: { value: 0.8, source: "config" }, recentTrackIds: ["track-2"], sessionPlayedTrackIds: ["track-2"], unheardTrackIds: ["track-1"], currentPlaneTrackIds: ["track-2"], selectionReason: decision.reason },
    travel: [], transitions: [],
    cameraIntent: { id: "camera-1", targetObjectId: "object-1", targetPlaneId: "plane-1", behavior: "focus", transitionType: "focus-transition", focusState: "requested", sourceDecisionId: decision.decisionId },
    trace: [decision]
  };
}

describe("runtime inspector contract", () => {
  it("produces an explicit-versioned, JSON-serializable snapshot with linked IDs", () => {
    const { inspect } = createRuntimeInspector({ runtimeId: "runtime-1", sessionId: "session-1", programRevision: "program-7", initialState: state(), now: () => "2026-01-01T00:00:01.000Z" });
    const snapshot = inspect.snapshot();
    expect(snapshot.identity).toEqual({ schemaVersion: RUNTIME_INSPECTION_SCHEMA_VERSION, stateRevision: 0, capturedAt: "2026-01-01T00:00:01.000Z", runtimeId: "runtime-1", sessionId: "session-1", programRevision: "program-7" });
    expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot);
    expect(snapshot.queue[0].sourceDecisionId).toBe(snapshot.trace[0].decisionId);
    expect(snapshot.queue[0].trackId).toBe(snapshot.playlists[0].memberTrackIds[0]);
    expect(snapshot.cameraIntent?.targetObjectId).toBe(snapshot.objects[0].id);
    expect(snapshot.invariantFailures).toEqual([]);
  });

  it("returns detached state from every read-only API", () => {
    const { inspect } = createRuntimeInspector({ runtimeId: "runtime-1", initialState: state() });
    const queue = inspect.queue();
    queue[0].status = "cancelled";
    inspect.snapshot().objects[0].exclusionReasons.push("tampered");
    expect(inspect.queue()[0].status).toBe("active");
    expect(inspect.objects()[0].exclusionReasons).toEqual([]);
    expect(Object.keys(inspect).sort()).not.toContain("publish");
  });

  it("emits monotonic revisions and broad changed domains without snapshots", () => {
    const { inspect, recorder } = createRuntimeInspector({ runtimeId: "runtime-1", initialState: state(), now: () => "2026-01-01T00:00:02.000Z" });
    const listener = vi.fn();
    const unsubscribe = inspect.subscribe(listener);
    recorder.publish(state(), ["audio", "camera-intent", "audio"]);
    recorder.appendDecision({ ...decision, decisionId: "decision-2" });
    unsubscribe();
    recorder.publish(state(), ["queue"]);
    expect(listener.mock.calls.map(([change]) => change)).toEqual([
      { schemaVersion: 1, stateRevision: 1, changedDomains: ["audio", "camera-intent"], timestamp: "2026-01-01T00:00:02.000Z" },
      { schemaVersion: 1, stateRevision: 2, changedDomains: ["trace"], timestamp: "2026-01-01T00:00:02.000Z" }
    ]);
    expect(inspect.snapshot().identity.stateRevision).toBe(3);
  });

  it("keeps renderer actuality optional and separate from camera intent", () => {
    const withoutRenderer = createRuntimeInspector({ runtimeId: "runtime-1", initialState: state() }).inspect.snapshot();
    expect(withoutRenderer.rendererObservation).toBeUndefined();
    const withRenderer = createRuntimeInspector({ runtimeId: "runtime-1", initialState: state(), rendererAdapter: { id: "test-renderer", observe: () => ({ adapterId: "test-renderer", capturedAt: "2026-01-01T00:00:00.000Z", camera: { position: [9, 8, 7] }, objects: [{ objectId: "object-1", visible: false }] }) } }).inspect.snapshot();
    expect(withRenderer.cameraIntent?.behavior).toBe("focus");
    expect(withRenderer.rendererObservation?.camera?.position).toEqual([9, 8, 7]);
    expect(withRenderer.rendererObservation?.objects[0].visible).toBe(false);
  });

  it("records fallback and deterministic probability inputs sufficient to explain selection", () => {
    const trace = createRuntimeInspector({ runtimeId: "runtime-1", initialState: state() }).inspect.trace()[0];
    expect(trace).toMatchObject({ candidatesBefore: ["track-1", "track-2"], candidatesAfter: ["track-1"], probabilities: { "track-1": 1 }, weights: { "track-1": 0.42 }, randomSample: 0.25, selectedId: "track-1" });
    expect(trace.exclusions[0]).toEqual({ candidateId: "track-2", reason: "Recently heard", ruleId: "rule-unheard" });
    expect(trace.fallbackSteps).not.toHaveLength(0);
  });

  it("self-diagnoses broken resource, causality, travel, camera, and renderer references", () => {
    const broken = state();
    broken.queue[0].trackId = "missing-track";
    broken.queue[0].sourceDecisionId = "missing-decision";
    broken.travel.push({ id: "travel-1", destinationPlaneId: "missing-plane", mode: "idle", initiationReason: "test", status: "active", resourceIds: [] });
    broken.cameraIntent!.targetObjectId = "missing-object";
    const snapshot = createRuntimeInspector({ runtimeId: "runtime-1", initialState: broken, rendererAdapter: { id: "test", observe: () => ({ adapterId: "test", capturedAt: "now", objects: [{ objectId: "renderer-only" }] }) } }).inspect.snapshot();
    expect(snapshot.invariantFailures.map((failure) => failure.id)).toEqual(expect.arrayContaining(["inspection.queue.track-known", "inspection.queue.decision-known", "inspection.travel.destination-known", "inspection.travel.state-possible", "inspection.camera.target-known", "inspection.renderer.object-known"]));
  });
});

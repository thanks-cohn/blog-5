import {
  RUNTIME_INSPECTION_SCHEMA_VERSION,
  type DecisionTrace,
  type InspectionChange,
  type InspectionDomain,
  type InvariantFailure,
  type JsonValue,
  type RendererObservationAdapter,
  type RuntimeInspectionSnapshot,
  type RuntimeInspectionState,
  type RuntimeInspector
} from "./runtime-inspection-contracts";

export interface RuntimeInspectorOptions {
  runtimeId: string;
  sessionId?: string;
  programRevision?: string;
  initialState: RuntimeInspectionState;
  rendererAdapter?: RendererObservationAdapter;
  traceLimit?: number;
  now?: () => string;
}

export interface RuntimeInspectionRecorder {
  /** Replaces inspection projections only; it never owns or mutates runtime state. */
  publish(state: RuntimeInspectionState, changedDomains: readonly InspectionDomain[]): number;
  appendDecision(decision: DecisionTrace, changedDomains?: readonly InspectionDomain[]): number;
}

function detached<T>(value: T): T {
  if (value === undefined) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

function duplicateIds(ids: string[]): string[] {
  return [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
}

/** Pure self-diagnosis over a detached snapshot projection. */
export function evaluateRuntimeInvariants(state: RuntimeInspectionState, rendererObjectIds: readonly string[] = []): InvariantFailure[] {
  const failures: InvariantFailure[] = [];
  const tracks = new Set(state.tracks.map((item) => item.id));
  const objects = new Set(state.objects.map((item) => item.id));
  const planes = new Set(state.planes.map((item) => item.id));
  const decisions = new Set(state.trace.map((item) => item.decisionId));
  const queue = new Set(state.queue.map((item) => item.id));
  const transitions = new Set(state.transitions.map((item) => item.id));
  const resources = new Set([
    ...tracks,
    ...objects,
    ...planes,
    ...state.playlists.map((item) => item.id),
    ...queue,
    ...state.travel.map((item) => item.id),
    ...transitions,
    ...(state.cameraIntent ? [state.cameraIntent.id] : [])
  ]);

  for (const id of duplicateIds(state.trace.map((item) => item.decisionId))) failures.push({ id: "inspection.decision-id.unique", severity: "error", message: `Decision ID ${id} is duplicated.`, entityIds: [id] });
  for (const item of state.trace) {
    if (item.selectedId && !resources.has(item.selectedId)) failures.push({ id: "inspection.decision.selection-known", severity: "error", message: `Decision ${item.decisionId} selected unknown resource ${item.selectedId}.`, entityIds: [item.decisionId, item.selectedId], relatedDecisionId: item.decisionId });
    for (const effectId of item.causedEffectIds) if (!resources.has(effectId)) failures.push({ id: "inspection.decision.effect-known", severity: "error", message: `Decision ${item.decisionId} references unknown effect ${effectId}.`, entityIds: [item.decisionId, effectId], relatedDecisionId: item.decisionId });
  }
  for (const item of state.queue) {
    if (item.trackId && !tracks.has(item.trackId)) failures.push({ id: "inspection.queue.track-known", severity: "error", message: `Queue entry ${item.id} references unknown track ${item.trackId}.`, entityIds: [item.id, item.trackId], relatedDecisionId: item.sourceDecisionId });
    if (item.objectId && !objects.has(item.objectId)) failures.push({ id: "inspection.queue.object-known", severity: "error", message: `Queue entry ${item.id} references unknown object ${item.objectId}.`, entityIds: [item.id, item.objectId], relatedDecisionId: item.sourceDecisionId });
    if (item.sourceDecisionId && !decisions.has(item.sourceDecisionId)) failures.push({ id: "inspection.queue.decision-known", severity: "error", message: `Queue entry ${item.id} references unknown decision ${item.sourceDecisionId}.`, entityIds: [item.id, item.sourceDecisionId] });
  }
  if (state.audio.queueEntryId && !queue.has(state.audio.queueEntryId)) failures.push({ id: "inspection.audio.queue-entry-known", severity: "error", message: `Audio references unknown queue entry ${state.audio.queueEntryId}.`, entityIds: [state.audio.queueEntryId] });
  if (state.journey.currentPlaneId && !planes.has(state.journey.currentPlaneId)) failures.push({ id: "inspection.journey.plane-known", severity: "error", message: `Journey references unknown plane ${state.journey.currentPlaneId}.`, entityIds: [state.journey.currentPlaneId] });
  if (state.journey.currentObjectId) {
    const object = state.objects.find((item) => item.id === state.journey.currentObjectId);
    if (!object) failures.push({ id: "inspection.journey.object-known", severity: "error", message: `Journey references unknown object ${state.journey.currentObjectId}.`, entityIds: [state.journey.currentObjectId] });
    else if (state.journey.currentPlaneId && object.planeId !== state.journey.currentPlaneId && !state.travel.some((item) => item.status === "active")) failures.push({ id: "inspection.journey.object-on-current-plane", severity: "error", message: `Current object ${object.id} is not on current plane ${state.journey.currentPlaneId}.`, entityIds: [object.id, state.journey.currentPlaneId] });
  }
  for (const item of state.travel) {
    if (item.destinationPlaneId && !planes.has(item.destinationPlaneId)) failures.push({ id: "inspection.travel.destination-known", severity: "error", message: `Travel ${item.id} references unknown destination ${item.destinationPlaneId}.`, entityIds: [item.id, item.destinationPlaneId], relatedDecisionId: item.sourceDecisionId });
    if (item.mode === "idle" && item.status === "active") failures.push({ id: "inspection.travel.state-possible", severity: "error", message: `Idle travel ${item.id} cannot be active.`, entityIds: [item.id] });
  }
  for (const item of state.transitions) {
    if (item.sourcePlaneId && !planes.has(item.sourcePlaneId)) failures.push({ id: "inspection.transition.source-known", severity: "error", message: `Transition ${item.id} references unknown source ${item.sourcePlaneId}.`, entityIds: [item.id, item.sourcePlaneId], relatedDecisionId: item.sourceDecisionId });
    if (item.destinationPlaneId && !planes.has(item.destinationPlaneId)) failures.push({ id: "inspection.transition.destination-known", severity: "error", message: `Transition ${item.id} references unknown destination ${item.destinationPlaneId}.`, entityIds: [item.id, item.destinationPlaneId], relatedDecisionId: item.sourceDecisionId });
  }
  if (state.cameraIntent?.targetObjectId && !objects.has(state.cameraIntent.targetObjectId)) failures.push({ id: "inspection.camera.target-known", severity: "error", message: `Camera intent references unknown object ${state.cameraIntent.targetObjectId}.`, entityIds: [state.cameraIntent.id, state.cameraIntent.targetObjectId], relatedDecisionId: state.cameraIntent.sourceDecisionId });
  for (const objectId of rendererObjectIds) if (!objects.has(objectId)) failures.push({ id: "inspection.renderer.object-known", severity: "warning", message: `Renderer observation references unknown object ${objectId}.`, entityIds: [objectId] });
  return failures;
}

/** Creates a read-only public inspector and a deliberately separate runtime recorder. */
export function createRuntimeInspector(options: RuntimeInspectorOptions): { inspect: RuntimeInspector; recorder: RuntimeInspectionRecorder } {
  const now = options.now ?? (() => new Date().toISOString());
  const traceLimit = Math.max(1, options.traceLimit ?? 200);
  let revision = 0;
  let state = detached(options.initialState);
  const listeners = new Set<(change: InspectionChange) => void>();

  const emit = (domains: readonly InspectionDomain[]) => {
    revision += 1;
    const change: InspectionChange = { schemaVersion: RUNTIME_INSPECTION_SCHEMA_VERSION, stateRevision: revision, changedDomains: [...new Set(domains)], timestamp: now() };
    for (const listener of listeners) listener(detached(change));
    return revision;
  };
  const renderer = () => detached(options.rendererAdapter?.observe());
  const snapshot = (): RuntimeInspectionSnapshot => {
    const projection = detached(state);
    const rendererObservation = renderer();
    return {
      identity: { schemaVersion: RUNTIME_INSPECTION_SCHEMA_VERSION, stateRevision: revision, capturedAt: now(), runtimeId: options.runtimeId, ...(options.sessionId ? { sessionId: options.sessionId } : {}), ...(options.programRevision ? { programRevision: options.programRevision } : {}) },
      ...projection,
      ...(rendererObservation ? { rendererObservation } : {}),
      invariantFailures: evaluateRuntimeInvariants(projection, rendererObservation?.objects.map((item) => item.objectId))
    };
  };

  const inspect: RuntimeInspector = {
    snapshot,
    queue: () => detached(state.queue), orchestration: () => detached(state.orchestration), journey: () => detached(state.journey), planes: () => detached(state.planes), travel: () => detached(state.travel), transitions: () => detached(state.transitions), camera: () => detached(state.cameraIntent), objects: () => detached(state.objects), playlists: () => detached(state.playlists), tracks: () => detached(state.tracks), audio: () => detached(state.audio), trace: () => detached(state.trace),
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  };
  const recorder: RuntimeInspectionRecorder = {
    publish(next, changedDomains) { state = detached(next); state.trace = state.trace.slice(-traceLimit); return emit(changedDomains); },
    appendDecision(decision, changedDomains = ["trace"]) { state = { ...state, trace: [...state.trace, detached(decision)].slice(-traceLimit) }; return emit(changedDomains); }
  };
  return { inspect, recorder };
}

// Compile-time guard: public state remains representable as JSON data.
const _jsonContract: JsonValue = { schemaVersion: RUNTIME_INSPECTION_SCHEMA_VERSION };
void _jsonContract;

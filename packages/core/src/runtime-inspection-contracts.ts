/** Public, host-agnostic contracts for runtime inspection schema version 1. */
export const RUNTIME_INSPECTION_SCHEMA_VERSION = 1 as const;

export type InspectionSchemaVersion = typeof RUNTIME_INSPECTION_SCHEMA_VERSION;
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type ProvenanceSource = "default" | "config" | "persisted" | "runtime" | "generated" | "derived";

export interface Provenanced<T extends JsonValue> {
  value: T;
  source: ProvenanceSource;
  sourceId?: string;
}

export interface InspectionIdentity {
  schemaVersion: InspectionSchemaVersion;
  stateRevision: number;
  capturedAt: string;
  runtimeId: string;
  sessionId?: string;
  programRevision?: string;
}

export interface InspectionScope {
  journeyId?: string;
  planeId?: string;
  transitionId?: string;
  travelMode?: TravelMode;
  objectId?: string;
  playlistId?: string;
  trackId?: string;
}

export interface ExcludedCandidate {
  candidateId: string;
  reason: string;
  ruleId?: string;
}

export interface DecisionTrace {
  decisionId: string;
  timestamp: string;
  kind: string;
  scope: InspectionScope;
  sourceRuleIds: string[];
  candidatesBefore: string[];
  exclusions: ExcludedCandidate[];
  candidatesAfter: string[];
  probabilities?: Record<string, number>;
  weights?: Record<string, number>;
  modifiers?: Array<Record<string, JsonValue>>;
  randomSample?: number;
  selectedId?: string;
  reason: string;
  fallbackSteps: string[];
  causedEffectIds: string[];
}

export type QueueEntryStatus = "pending" | "active" | "completed" | "cancelled";
export interface QueueEntryInspection {
  id: string;
  kind: string;
  trackId?: string;
  playlistId?: string;
  objectId?: string;
  planeId?: string;
  transitionId?: string;
  sourceDecisionId?: string;
  status: QueueEntryStatus;
  certainty: "guaranteed" | "probabilistic";
  insertionReason: string;
  sourceRuleIds: string[];
  invalidationConditions: string[];
}

export interface RuleInspection {
  id: string;
  state: "effective" | "inherited" | "overridden" | "suppressed";
  reason?: string;
  provenance?: Provenanced<JsonValue>;
}

export interface OrchestrationInspection {
  phase: string;
  scope: InspectionScope;
  rules: RuleInspection[];
  pools: Array<{ id: string; candidateIds: string[] }>;
  activeExclusions: ExcludedCandidate[];
  fallbackRules: string[];
  historyInputs: Record<string, JsonValue>;
  randomizationInputs: Record<string, JsonValue>;
}

export interface JourneyInspection {
  active: boolean;
  journeyId?: string;
  sessionId?: string;
  currentPlaneId?: string;
  currentObjectId?: string;
  cursor?: number;
  cycle?: number;
  completedCycles: number;
  songCount: number;
  residencyPolicy?: Provenanced<JsonValue>;
  residencyProgress?: JsonValue;
  residencySatisfied: boolean;
  residencyReason: string;
  pendingDestinationId?: string;
  previousDestinationId?: string;
  completedJourneyCount: number;
  nextExpectedAction?: string;
}

export interface PlaneInspection {
  id: string;
  label?: string;
  order?: number;
  state: "inactive" | "current" | "previous" | "next";
  journeyEligible: boolean;
  residencyState?: string;
  assignedObjectIds: string[];
  visibleObjectIds: string[];
  randomizedObjectIds: string[];
  pairedPlaylistIds: string[];
  previewPolicy?: string;
  pendingTransitionIds: string[];
  activeTransitionIds: string[];
  queueEntryIds: string[];
}

export interface ObjectInspection {
  id: string;
  assetId?: string;
  planeId: string;
  classification: "authored" | "randomized";
  pairing: "paired" | "unpaired";
  visibilityIntent: Provenanced<boolean>;
  focusState: "unfocused" | "pending" | "focused";
  journeyEligible: boolean;
  trackId?: string;
  playlistId?: string;
  exclusionReasons: string[];
  orchestrationRuleIds: string[];
  cameraIntentId?: string;
  travelDestinationId?: string;
  loadStatus?: "unknown" | "loading" | "loaded" | "failed";
  placementIntent?: JsonValue;
}

export interface PlaylistInspection {
  id: string;
  active: boolean;
  queuePosition?: number;
  memberTrackIds: string[];
  completedTrackIds: string[];
  remainingTrackIds: string[];
  completionStatus: "not-started" | "partial" | "complete";
  completionHistory: string[];
  phase?: string;
  probability?: number;
  weight?: number;
  effectiveProbability?: number;
  effectiveWeight?: number;
  modifierIds: string[];
  branchIntent?: string;
  restartBehavior?: string;
  activationReason?: string;
  sourceDecisionId?: string;
}

export interface TrackInspection {
  id: string;
  playlistIds: string[];
  title?: string;
  available: boolean;
  exclusionReasons: string[];
  probability?: number;
  weight?: number;
  effectiveProbability?: number;
  effectiveWeight?: number;
  provenance?: Provenanced<JsonValue>;
}

export interface AudioInspection {
  state: "playing" | "paused" | "stopped";
  trackId?: string;
  playlistId?: string;
  objectId?: string;
  planeId?: string;
  queueEntryId?: string;
  sourceDecisionId?: string;
  playbackMode?: string;
  loop: boolean;
  volumeIntent: Provenanced<number>;
  fadeState?: string;
  recentTrackIds: string[];
  sessionPlayedTrackIds: string[];
  unheardTrackIds?: string[];
  currentPlaneTrackIds: string[];
  fallbackState?: string;
  selectionReason?: string;
}

export type TravelMode = "idle" | "object-focus" | "ordinary" | "roller-coaster" | "teleport" | "custom" | "arrival" | "intermission" | "focus-transition";
export type TravelStatus = "pending" | "active" | "completed" | "cancelled";
export interface TravelInspection {
  id: string;
  sourcePlaneId?: string;
  destinationPlaneId?: string;
  sourceObjectId?: string;
  destinationObjectId?: string;
  mode: TravelMode;
  transitionId?: string;
  customTravelId?: string;
  initiationReason: string;
  sourceDecisionId?: string;
  progress?: number;
  status: TravelStatus;
  resourceIds: string[];
  cameraIntentId?: string;
}

export interface TransitionInspection {
  id: string;
  sourcePlaneId?: string;
  destinationPlaneId?: string;
  status: TravelStatus;
  sourceDecisionId?: string;
  resourceIds: string[];
}

export interface CameraIntentInspection {
  id: string;
  targetObjectId?: string;
  targetPlaneId?: string;
  behavior: string;
  transitionType?: string;
  focusState: string;
  pendingTargetObjectId?: string;
  sourceDecisionId?: string;
}

export interface RendererObservation {
  adapterId: string;
  capturedAt: string;
  frameId?: string;
  camera?: { position?: JsonValue; orientation?: JsonValue; focusProgress?: number };
  objects: Array<{
    objectId: string;
    worldPosition?: JsonValue;
    screenProjection?: JsonValue;
    visible?: boolean;
    loadStatus?: "unknown" | "loading" | "loaded" | "failed";
  }>;
  health?: Record<string, JsonValue>;
}

export interface RendererObservationAdapter {
  readonly id: string;
  observe(): RendererObservation | undefined;
}

export interface InvariantFailure {
  id: string;
  severity: "warning" | "error";
  message: string;
  entityIds: string[];
  relatedDecisionId?: string;
}

export type InspectionDomain = "queue" | "orchestration" | "journey" | "planes" | "objects" | "playlists" | "tracks" | "audio" | "travel" | "transitions" | "camera-intent" | "trace" | "renderer-observation" | "invariants";
export interface InspectionChange {
  schemaVersion: InspectionSchemaVersion;
  stateRevision: number;
  changedDomains: InspectionDomain[];
  timestamp: string;
}

export interface RuntimeInspectionState {
  queue: QueueEntryInspection[];
  orchestration: OrchestrationInspection;
  journey: JourneyInspection;
  planes: PlaneInspection[];
  objects: ObjectInspection[];
  playlists: PlaylistInspection[];
  tracks: TrackInspection[];
  audio: AudioInspection;
  travel: TravelInspection[];
  transitions: TransitionInspection[];
  cameraIntent?: CameraIntentInspection;
  trace: DecisionTrace[];
}

export interface RuntimeInspectionSnapshot extends RuntimeInspectionState {
  identity: InspectionIdentity;
  rendererObservation?: RendererObservation;
  invariantFailures: InvariantFailure[];
}

export interface RuntimeInspector {
  snapshot(): RuntimeInspectionSnapshot;
  queue(): QueueEntryInspection[];
  orchestration(): OrchestrationInspection;
  journey(): JourneyInspection;
  planes(): PlaneInspection[];
  travel(): TravelInspection[];
  transitions(): TransitionInspection[];
  camera(): CameraIntentInspection | undefined;
  objects(): ObjectInspection[];
  playlists(): PlaylistInspection[];
  tracks(): TrackInspection[];
  audio(): AudioInspection;
  trace(): DecisionTrace[];
  subscribe(listener: (change: InspectionChange) => void): () => void;
}

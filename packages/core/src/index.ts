export type RevisionId = string;

export type HealthState = "healthy" | "degraded" | "failed" | "unknown";

export interface WebRevRevision {
  id: RevisionId;
  parent?: RevisionId;
  createdAt: string;
  source?: { commit?: string; branch?: string };
  configuration: Record<string, string | number | boolean>;
}

export interface HealthReport {
  state: HealthState;
  revision: RevisionId;
  checks: Array<{
    id: string;
    state: HealthState;
    message?: string;
  }>;
}

export interface InvariantResult {
  id: string;
  state: HealthState;
  message?: string;
}

export interface Invariant {
  readonly id: string;
  evaluate(revision: WebRevRevision): InvariantResult;
}

export interface InspectionDocument {
  schemaVersion: 1;
  framework: "webrev";
  revision: WebRevRevision;
  health: HealthReport;
}

/** Build the small, JSON-serializable discovery document shared by all hosts. */
export function createInspectionDocument(
  revision: WebRevRevision,
  invariants: readonly Invariant[]
): InspectionDocument {
  const checks = invariants.map((invariant) => invariant.evaluate(revision));
  const state: HealthState = checks.some((check) => check.state === "failed")
    ? "failed"
    : checks.some((check) => check.state === "degraded")
      ? "degraded"
      : checks.some((check) => check.state === "unknown")
        ? "unknown"
        : "healthy";

  return {
    schemaVersion: 1,
    framework: "webrev",
    revision,
    health: { state, revision: revision.id, checks }
  };
}

/** The first built-in invariant proves that a runnable state is addressable. */
export const revisionIdentityInvariant: Invariant = {
  id: "webrev.revision.identity",
  evaluate(revision) {
    return revision.id.trim().length > 0
      ? { id: this.id, state: "healthy", message: "Revision identity is present." }
      : { id: this.id, state: "failed", message: "Revision identity is missing." };
  }
};

export interface DeploymentProvider {
  readonly id: string;
  deploy(revision: WebRevRevision): Promise<{ deploymentId: string; url?: string }>;
  status(deploymentId: string): Promise<HealthState>;
  rollback(targetRevision: RevisionId): Promise<void>;
}

export interface MediaPanel {
  id: string;
  title: string;
  eyebrow?: string;
  description?: string;
  kind: "video" | "sketchfab" | "iframe" | "javascript" | "wasm" | "image";
  src?: string;
  poster?: string;
  href?: string;
  load?: "eager" | "visible" | "interaction";
}

export * from "./websites";
export * from "./links";
export * from "./runtime-inspection-contracts";
export * from "./runtime-inspector";

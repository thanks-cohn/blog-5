# Codex Run: Deep Runtime Inspection and Agent Debug Architecture

This run builds the foundational **Deep Debug / Runtime Inspection architecture** for the music-world orchestration system currently incubating in this repository.

The implementation must be **repository-name agnostic** and **host-agnostic**.

The current repository is only an incubation environment. Do not bake the repository name, WebRev, Astro, or any particular renderer into the core contracts.

The goal is that this subsystem can later be extracted into a standalone package or repository without changing its public contracts.

---

# Core goal

Build an inspection and observability framework so that future programmers, AI agents, and debugging tools can understand what the runtime is actually doing **without needing screenshots or guessing from user descriptions**.

When a user says:

> "this object is wrong"
> "the wrong song played"
> "the camera went to the wrong place"
> "it skipped an object"
> "the transition should have been a roller-coaster"
> "why did this playlist play?"

an agent should be able to inspect structured runtime state and determine:

- what happened
- what is happening now
- what is supposed to happen next
- why the runtime made its decisions
- which rules influenced the result
- what object, plane, track, playlist, camera target, transition, or travel mode is involved
- where the discrepancy lies

This should make future debugging substantially easier and more deterministic.

---

# Architectural principles

## 1. Inspection is read-only

Inspection must not mutate runtime state.

Do not expose mutable internal objects directly.

Return detached, serializable structures.

## 2. Stable versioned contracts

Inspection payloads must include an explicit schema version.

Prefer additive evolution within a schema version.

Breaking changes require a new schema version and migration notes.

Stable IDs should connect records across:

- journey
- plane
- transition
- travel mode
- object
- playlist
- track
- decision
- queue entry

Do not rely on array position as identity.

## 3. Repo-name and host agnostic

The core inspection contracts must not depend on:

- this repository name
- WebRev
- Astro
- Three.js
- DOM APIs
- a particular renderer
- a specific deployment platform

Renderer-specific integrations may attach additional observations later, but the core orchestration inspector must remain portable.

## 4. Separate intent from observed renderer result

The orchestration engine may say:

```text
camera intent = focus object X
travel intent = roller-coaster to Plane B
```

while a host renderer may later report:

```text
actual camera position = ...
actual projected object bounds = ...
actual GLB load state = ...
```

Do not collapse intent and actual rendering into one ambiguous field.

## 5. Explainability, not just state dumping

A raw snapshot is not enough.

The system should explain **why decisions occurred**.

Build a structured decision trace / explanation ledger.

---

# Preferred public shape

Follow current architecture where appropriate, but prefer a generic runtime-facing inspection surface such as:

```ts
runtime.inspect
```

Possible operations:

```ts
runtime.inspect.snapshot()
runtime.inspect.queue()
runtime.inspect.orchestration()
runtime.inspect.journey()
runtime.inspect.travel()
runtime.inspect.camera()
runtime.inspect.objects()
runtime.inspect.audio()
runtime.inspect.trace()
runtime.inspect.subscribe(listener)
```

Exact naming may change if the source architecture suggests a better conventional structure.

Do not create multiple unrelated debug globals.

---

# Required inspection domains

## Runtime identity

Expose:

- schema version
- state revision / monotonic inspection revision
- capture timestamp
- runtime/session identity where available
- active program/config revision where available

If build/revision identity exists elsewhere, design a clean way to associate it without hard-coding deployment infrastructure into the core engine.

---

# Queue inspection

Expose the current queue and enough future-plan information to answer:

- what is playing now?
- what is next?
- what entries are pending?
- which entries are guaranteed?
- which are probabilistic possibilities rather than fixed queue entries?
- what queue item belongs to which object?
- what queue item belongs to which playlist?
- what queue item belongs to which plane?
- what transition or travel step is associated with a queue entry?
- why was the queue entry inserted?
- what rule generated it?
- what could invalidate or replace it?

Prefer records such as:

```ts
type QueueEntry = {
  id: string;
  kind: string;
  trackId?: string;
  playlistId?: string;
  objectId?: string;
  planeId?: string;
  transitionId?: string;
  sourceDecisionId?: string;
  status: "pending" | "active" | "completed" | "cancelled";
};
```

This is illustrative, not mandatory syntax.

---

# Orchestration inspection

Expose:

- active orchestration phase
- active scope
- currently effective rules
- inherited rules
- overridden rules
- suppressed rules
- current pools
- candidate resources
- exact probability values
- relative weights
- effective values after modifiers
- currently active exclusions
- fallback/degradation rules
- completion-dependent modifiers
- current history inputs
- randomization inputs

The future orchestration language must support high optional granularity across:

```text
journey
→ plane
→ transition
→ travel mode
→ object
→ playlist
→ track
```

This run does **not** need to implement the entire advanced orchestration language.

It must establish inspection infrastructure capable of explaining such behavior later.

---

# Decision ledger / explanation trace

Create a structured append-only or bounded trace of meaningful decisions.

Each important decision should have a stable identifier.

A useful conceptual record is:

```ts
type DecisionTrace = {
  decisionId: string;
  timestamp: string;
  kind: string;
  scope: {
    journeyId?: string;
    planeId?: string;
    transitionId?: string;
    travelMode?: string;
    objectId?: string;
    playlistId?: string;
    trackId?: string;
  };
  sourceRuleIds: string[];
  candidatesBefore: string[];
  exclusions: Array<{
    candidateId: string;
    reason: string;
    ruleId?: string;
  }>;
  candidatesAfter: string[];
  probabilities?: Record<string, number>;
  weights?: Record<string, number>;
  modifiers?: Array<Record<string, unknown>>;
  selectedId?: string;
  reason: string;
  fallbackSteps?: string[];
  causedEffects?: string[];
};
```

Exact field names can differ.

The important thing is machine-readable causality.

A trace should support explanations such as:

```text
Track X was selected because:
- Object A requested Pool P
- Track X was globally available
- Track X had not been heard this session
- Track X was outside the recent-history window
- Track X was not already represented on the current plane
- its effective weight was 0.42
- higher-priority candidates were excluded
```

or:

```text
Plane B → Plane C began because:
- residency completed
- all required objects were visited
- travel policy resolved to roller-coaster
- Transition T selected Resource R
- camera intent changed to Plane C
```

or:

```text
Playlist B effective probability changed from 20% to 40%
because Playlist A completed fully and activated modifier M.
```

---

# Causality graph

Make cross-system effects explicit.

A future agent should be able to follow:

```text
rule
→ decision
→ queue mutation
→ selected playlist
→ selected track
→ object target
→ camera intent
→ travel intent
→ transition
→ plane destination
→ journey progression
```

Every emitted effect should ideally reference the originating decision ID.

Avoid disconnected state where the agent has to infer causality from timestamps.

---

# Journey inspection

Expose:

- whether journey mode is active
- journey ID / session ID
- current plane
- current object
- current cursor
- current cycle
- completed cycles
- current song count
- residency policy
- residency progress
- whether residency is satisfied
- why it is or is not satisfied
- pending destination
- previous destination
- completed full journey count
- next expected journey action if determinable

If there are multiple journey models in the codebase, identify and document the divergence rather than hiding it.

---

# Plane inspection

For every plane expose, where known:

- stable ID
- label
- index/order only as metadata, not identity
- current/active/previous/next state
- journey eligibility
- residency state
- assigned objects
- visible objects
- randomized objects
- paired music relationships
- preview policy
- pending transition in/out
- active transition in/out
- queue resources associated with the plane

---

# Object inspection

For every object expose:

- stable object ID
- asset/resource ID
- plane ID
- authored vs randomized classification
- paired vs unpaired classification
- visibility intent
- focus state
- journey eligibility
- current track binding
- playlist binding
- exclusions
- orchestration policy references
- camera intent relationship
- travel destination relationship if applicable
- runtime load/status information where the host can provide it
- placement/position intent where core state knows it

If renderer data is available through an adapter, keep it in a clearly separated renderer observation block.

---

# Audio inspection

Expose:

- playing / paused / stopped
- current track ID
- current playlist ID
- current object ID
- current plane ID
- queue entry ID
- source decision ID
- current playback mode
- loop behavior
- volume intent
- fade state if available
- recent track history
- session played history
- unheard set/count where practical
- current-plane track history
- fallback resolver state
- reason current track was chosen

---

# Probability and weight inspection

For every probabilistic decision, expose enough information to reconstruct the selection.

Include:

- candidate set before constraints
- excluded candidates
- why each exclusion happened
- remaining candidates
- exact probabilities
- relative weights
- modifiers
- normalized/effective values where applicable
- random draw/sample value where safe/useful
- selected candidate
- fallback steps

This should make random behavior debuggable rather than mysterious.

---

# Playlist inspection

Expose:

- playlist ID
- active/inactive
- queue position
- members
- completed members
- remaining members
- completion status
- completion history
- active configuration/phase
- probability
- weight
- effective probability/weight
- completion-dependent modifiers
- branch/follow-up intent
- restart behavior
- reason playlist became active

The future engine should be able to support extremely granular authoring, including:

- exact probability for a playlist
- relative playlist weight
- preferred-first tracks
- exact per-track probabilities
- weighted remainder pools
- guaranteed follow-up tracks
- restart playlist with a new configuration
- increase another playlist's probability only after full completion
- branch to another playlist
- conditional playlist phases

This run should prepare inspection contracts for that complexity without implementing every behavior now.

---

# Transition and travel inspection

Travel modes must remain distinguishable.

At minimum support observation of:

- idle
- object focus
- ordinary continuation
- roller-coaster
- teleport/programmatic
- custom travel
- arrival
- intermission
- focus transition

Expose:

- source plane
- destination plane
- source object
- destination object
- travel mode
- transition ID
- custom travel ID if present
- initiation reason
- source decision ID
- travel progress if known
- whether travel is pending / active / completed / cancelled
- transition resource/music
- camera intent associated with travel

Do not derive every non-idle movement as "roller-coaster" merely because the camera is moving.

Use explicit runtime state where possible.

---

# Camera inspection

The core engine should expose **camera intent**, not assume ownership of actual rendering.

Expose intent such as:

- current target object
- current target plane
- requested camera behavior
- requested transition type
- focus state
- pending camera target
- source decision ID

A renderer adapter may additionally expose:

- actual camera position
- actual orientation
- projected screen position
- focus interpolation progress
- renderer-specific state

Keep those blocks distinct.

---

# Renderer adapter boundary

Design a small optional adapter/interface for host renderers.

The core system should work without it.

A host may contribute observations such as:

- actual camera transform
- object world position
- object screen projection
- object visibility
- loaded/loading/failed
- renderer resource residency
- WebGL/context health
- frame identity

Do not make the orchestration engine depend on renderer-specific types.

---

# Provenance

Important state should eventually report where it came from.

Use a conventional representation such as:

```ts
{
  value: ...,
  source: "default" | "config" | "persisted" | "runtime" | "generated" | "derived"
}
```

Not every field needs this immediately, but establish the contract and apply it to high-value debugging fields first.

This is especially important where stale persisted state can override newer defaults/configuration.

---

# Subscription / revisions

Agents should not need to blindly poll continuously.

Provide a single conventional change mechanism, such as:

```ts
runtime.inspect.subscribe(listener)
```

or a monotonic revision counter plus subscription.

The callback/event should indicate what broad domains changed without exposing mutable internals.

Examples:

```text
queue
orchestration
journey
audio
travel
camera-intent
objects
renderer-observation
```

Avoid firing an expensive complete deep snapshot every animation frame.

Inspection should remain cheap enough to leave available during development.

---

# Snapshot

Provide one canonical all-in-one snapshot.

Something conceptually like:

```ts
runtime.inspect.snapshot()
```

It should be JSON-serializable and safe to log, test, transmit, or give to an AI agent.

It should combine:

- runtime identity
- queue
- orchestration
- journey
- planes
- objects
- playlists
- audio
- travel
- transitions
- camera intent
- renderer observation if available
- recent decision trace
- provenance
- warnings / invariant failures

Do not expose secrets.

---

# Invariants and self-diagnosis

Add machine-readable invariant checks where practical.

Examples:

- active queue entry references a known track
- active track references a known object when required
- journey cursor references an existing journey entry
- current object belongs to current plane unless transition semantics allow otherwise
- pending travel destination exists
- camera intent target exists
- queue entry source decision exists
- renderer observation references known object IDs
- transition source/destination are valid
- no impossible combination of travel states

Expose invariant failures through inspection.

The long-term goal is for the runtime to help diagnose itself.

---

# Contract module

Do not leave public inspection types buried inside one component file.

Extract a small importable versioned contract module/package location.

Include:

- snapshot types
- decision trace types
- queue inspection types
- journey inspection types
- orchestration inspection types
- travel inspection types
- camera intent types
- renderer adapter/observation types
- subscription/change types
- schema version constants

Keep implementation internals separate from public contracts.

---

# Testing requirements

Add contract-focused tests.

At minimum test:

- snapshot is JSON-serializable
- stable IDs link records correctly
- decision traces reference valid decisions/resources
- queue entries point to valid resources
- subscriptions emit revisions/change domains
- read-only API returns detached state
- schema version is explicit
- renderer adapter is optional
- intent and actual renderer observation remain separated
- fallback decisions leave an explanation trace
- probabilistic decisions record sufficient inputs to explain the result

Where randomness exists, make testing deterministic through injected/seeded random sources rather than asserting against uncontrolled `Math.random()`.

Do not require production behavior to become globally deterministic unless that is already intended.

---

# Documentation

Create or update documentation for the inspection framework.

Document:

- API surface
- contracts/types
- schema version policy
- read-only guarantee
- subscription semantics
- decision trace schema
- causality relationships
- queue semantics
- journey semantics
- travel modes
- camera intent vs actual renderer state
- provenance
- invariant reports
- renderer adapter boundary
- current limitations
- implemented vs proposed capabilities

Keep proposed future orchestration features clearly marked as proposed.

---

# Scope and restraint

This run is infrastructure-first.

Do not attempt to implement the full future orchestration language yet.

Do not rewrite the renderer.

Do not rewrite all journey behavior unless a small correction is necessary to make state observable.

Do not tie the contracts to the current repository name.

Do not couple the core inspector to one UI.

Do not create an AI-specific API.

The same structured inspection layer should work for:

- human programmers
- tests
- diagnostic tools
- AI coding agents
- future AI-native extensions

---

# Deliverables

Complete as much of the following as safely possible:

1. Audit current runtime state and orchestration boundaries.
2. Extract/importable versioned inspection contracts.
3. Implement a read-only runtime inspector.
4. Add the canonical snapshot.
5. Add queue inspection.
6. Add journey inspection.
7. Add travel/transition inspection.
8. Add camera-intent inspection.
9. Add audio inspection.
10. Add object/plane inspection.
11. Add a structured decision/explanation ledger.
12. Add causality IDs between decisions and their effects.
13. Add a subscription/revision mechanism.
14. Add provenance for high-value state.
15. Add invariant/self-diagnosis results.
16. Add an optional renderer-observation adapter boundary.
17. Add contract tests.
18. Update API/debug documentation.
19. Run the relevant build/tests.
20. Report:
    - files changed
    - public contracts introduced
    - what an external agent can now inspect
    - what remains opaque
    - invariants added
    - tests/build results
    - recommended next implementation step

---

# Success criterion

At the end of this run, a future agent should be substantially closer to being able to receive a bug report like:

> "the song changed and then the camera went to the wrong object"

and inspect the runtime to answer:

```text
Decision D184 selected Track T9.
D184 created Queue Entry Q31.
Q31 targeted Object O7 on Plane P2.
Camera Intent C17 targeted O7.
The renderer reported O7 at ...
However the user expected O4 because Rule R12 should have applied.
R12 was suppressed by persisted override X.
```

That level of structured explainability is the architectural direction.

Build the foundation so future work becomes easier rather than more opaque.

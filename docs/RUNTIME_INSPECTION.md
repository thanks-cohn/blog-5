# Runtime inspection and deep-debug contracts

The runtime inspection module is a portable, renderer-independent foundation for explaining orchestration behavior without screenshots. It is an **observation contract**, not an orchestration language or control API. Its public types contain no host, framework, repository, DOM, or renderer-specific assumptions.

## Public API

Import `createRuntimeInspector`, `RUNTIME_INSPECTION_SCHEMA_VERSION`, and the contract types from `@webrev/core` today. The contracts themselves are intentionally generic so they can be extracted later without changing their shape.

`createRuntimeInspector(options)` returns two deliberately separate capabilities:

- `inspect` is safe to expose to diagnostics: `snapshot()`, domain reads (`queue()`, `orchestration()`, `journey()`, `planes()`, `objects()`, `playlists()`, `tracks()`, `audio()`, `travel()`, `transitions()`, `camera()`, and `trace()`), and `subscribe(listener)`.
- `recorder` is for trusted runtime integration: `publish(...)` replaces the runtime's inspection projection and `appendDecision(...)` records an explanation. The inspector does not expose these operations.

All reads are detached JSON data. Mutating a returned object cannot mutate either the runtime or the stored inspection projection. Runtime integrations should publish projections at meaningful state changes rather than animation-frame frequency.

## Schema and revision policy

Every snapshot and change event uses schema version `1`. Compatible evolution is additive. Removing a field, changing its meaning, or changing an existing field's type requires a new schema version and migration notes.

`identity.stateRevision` is monotonic within one inspector instance. `capturedAt`, `runtimeId`, optional `sessionId`, and optional `programRevision` distinguish a capture and associate it with external configuration/build identity without importing deployment concepts. Stable record IDs—not array positions—join domains.

Subscriptions emit only the new revision, timestamp, and changed broad domains. They do not eagerly allocate a complete snapshot. Listeners can fetch only what they need or request the canonical snapshot.

## Canonical snapshot and causality

`snapshot()` combines identity, queue, orchestration, journey, planes, objects, playlists, audio, travel, transitions, camera intent, recent decisions, optional renderer observations, and invariant failures. It can be serialized with `JSON.stringify`, logged, tested, or transmitted after the host applies its own authorization policy.

The bounded decision ledger records scope and source rules; candidates before and after constraints; exclusions; probabilities, weights, modifiers, and an optional random sample; selection reason, fallback steps, selected ID, and caused effect IDs. Effects carry `sourceDecisionId`, so tools can follow `decision → queue entry → track/object → camera intent` without inferring causality from timestamps.

## Domain semantics

Queue entries distinguish `guaranteed` entries from probabilistic possibilities and retain insertion reasons, source rules, invalidation conditions, resource IDs, status, and decision origin. Orchestration exposes effective/inherited/overridden/suppressed rules, pools, exclusions, fallback rules, history inputs, and randomization inputs. Proposed advanced authoring—conditional phases, guaranteed follow-ups, and completion-driven probability changes—is not implemented by the inspector; when an engine implements it, these fields can explain it.

Journey state identifies the current plane/object/cursor/cycle, residency policy and progress, why residency is or is not satisfied, destinations, completions, and a next expected action. Planes expose stable identity plus activity, eligibility, object sets, playlist pairing, transitions, and queue relationships. Objects distinguish authored/randomized and paired/unpaired state, visibility intent, focus, bindings, rules, placement, travel/camera relationships, and core-known load status.

Audio inspection exposes playback state and mode, cross-domain links, looping, volume intent, fades, histories, unheard tracks, fallback state, and selection reason. Playlist inspection provides members and progress, active configuration, raw and effective probability/weight, modifiers, branch/restart intent, and activation causality. Track records provide stable resource identity, availability, exclusions, playlist membership, provenance, and raw/effective probability and weight.

Travel modes are explicit: `idle`, `object-focus`, `ordinary`, `roller-coaster`, `teleport`, `custom`, `arrival`, `intermission`, and `focus-transition`. Movement is never inferred to be roller-coaster travel. Records expose endpoints, lifecycle, progress, resources, reasons, and causal relationships.

The core owns **camera intent** only. An optional renderer adapter reports actual camera transform, projection, object visibility/load status, resource health, and frame identity in a distinct `rendererObservation` block. No adapter is required, and renderer types never enter orchestration contracts.

## Provenance and invariants

`Provenanced<T>` records whether a value came from a default, config, persisted state, runtime state, generation, or derivation, with an optional source ID. Version 1 applies it to high-value fields such as visibility, volume, residency policy, and rule values. Broader field-level provenance is additive future work.

Snapshots self-diagnose duplicate decision IDs; queue references to unknown tracks, objects, or decisions; audio references to unknown queue entries; journey references to unknown planes or objects; current objects outside the current plane when no travel is active; travel to unknown destinations; impossible active `idle` travel; unknown camera targets; and renderer observations referencing unknown core objects. Failures are structured, severity-tagged, and linked to entities and decisions. Evaluation is pure and never repairs state.

## Current boundary and limitations

The playground currently has two related but distinct models: `focusJourney.ts` is a pure target/phase helper, while `SpatialPresentation.astro` owns a larger browser runtime with journey cursors, residency counters, audio, camera, and travel. This run does not hide or rewrite that divergence. The generic inspector is ready for an adapter, but the browser runtime has not yet been wired to publish the contract.

Until a runtime publishes a projection, its live browser state remains opaque to this API. In particular, the current playground does not yet expose its local queue construction, audio lifecycle events, browser-persisted overrides, journey mutations, or canvas observations through `runtime.inspect`. The inspector cannot explain decisions that the orchestrator never records, and renderer actuality is absent without an adapter. Secrets and mutation/control operations are intentionally excluded.

The recommended next step is a thin playground integration that maps meaningful `SpatialPresentation` state changes into the recorder, assigns stable IDs at creation time, and adds a renderer adapter for camera/object observations. That should precede expanding the proposed orchestration language.

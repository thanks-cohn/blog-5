# Codex Run: Canonical API Extraction, Contract Audit, and Agent Introspection Foundation

You are working in the `thanks-cohn/blog-5` repository.

This run is primarily an **API discovery, extraction, reconciliation, and documentation pass**.

The goal is to make the repository legible to future coding agents without requiring screenshots, guesswork, or oral history.

## Core objective

Build a canonical understanding of **everything API-related that already exists in the repository**, then update `docs/api` so the documentation matches the implementation as closely and completely as possible.

Do **not** assume the current API documentation is complete or authoritative.

Treat the source code as the primary evidence.

The documentation should become the canonical human/agent-facing contract.

---

# Why this matters

This project is becoming an agent-first spatial presentation/journey engine.

A future agent should be able to answer questions like:

- What plane is active?
- What plane is next?
- What objects exist on every plane?
- Which objects are actually rendered?
- Where are those objects in local, world, and screen space?
- Which objects are hidden, loaded, loading, failed, preview-only, randomized, paired, or unpaired?
- What is the camera doing?
- Is the camera idle, focusing, riding the roller coaster, teleporting programmatically, or executing a custom transition?
- What journey object is active?
- What is the journey cursor?
- What song is playing and why was it chosen?
- What track-history rules are active?
- What randomized-object-history rules are active?
- What preview policy is affecting distant planes?
- What WebGL/Three.js resources are resident?
- Has WebGL context been lost or restored?
- What state came from configuration, local storage, runtime mutation, random selection, or a fallback rule?
- What public commands can inspect or mutate any of this?

The long-term target is a **Deep Debug / Agent Introspection API** that gives future agents structured runtime truth so screenshots are optional rather than required.

This Codex run should first establish the complete API map needed to support that direction.

---

# Required reading

Before changing documentation, inspect at minimum:

- `AGENTS.md`
- `apps/playground/src/components/SpatialPresentation.astro`
- `config/presentations/uniqueness-rewarded.json`
- `docs/api/README.md`
- `docs/journey/README.md`
- every file under `docs/proposals/` that describes playback, journey, manifests, spatial effects, or orchestration
- relevant helpers under `apps/playground/src/lib/`
- any code that declares or dispatches `webrev:*` events
- any code that reads/writes `localStorage`
- any public `window.*` API
- any manifest/config schema used by the runtime
- any TypeScript type/interface that appears in a public method, event detail, persisted shape, or runtime inspection result

Search the repo broadly. Do not limit the audit to one file.

---

# First task: extract the complete API surface

Create a source-derived inventory of all externally meaningful API surfaces.

At minimum, identify and document:

## 1. Public JavaScript/runtime APIs

Especially:

`window.webrevPresentationSettings`

Inventory **every method currently exposed**, including:

- exact method name
- parameters
- accepted values
- return type
- default behavior
- mutation/read-only classification
- side effects
- persistence effects
- events dispatched
- rebuild/re-render effects
- important fallback behavior
- known constraints
- example usage

Do not omit methods just because they appear experimental or debug-oriented.

---

## 2. Public TypeScript types and interfaces

Extract every type/interface that is part of a public or semi-public contract, including but not limited to concepts such as:

- camera modes
- object motion
- asset placement
- spatial envelopes
- focus playback
- playback programs
- plane residency
- plane travel
- unpaired GLB count policy
- distant-plane preview policy
- randomized GLB diversity policy
- track exclusions
- journey music evolution
- weighted/probabilistic transition resources
- transition policies
- focus playlist entries
- editor state
- runtime load status
- style snapshot/manifest-adjacent shapes

If a type lives in another source file, link/document the canonical source.

Do not silently invent a cleaner type than the implementation currently uses.

If implementation and docs disagree, say so and reconcile the docs to reality.

---

## 3. Events

Search for every:

`new CustomEvent("webrev:...")`

and every listener for those events.

Document:

- event name
- when it fires
- `detail` shape
- whether it is cancelable
- whether callers are expected to call `preventDefault()`
- fallback behavior if nobody handles it
- whether it represents state observation or an extension hook

Create one canonical Events section/table.

---

## 4. Persistence contracts

Inventory every `localStorage` key.

For each key document:

- exact key
- current version suffix
- stored shape
- default when absent
- migration/invalidation behavior
- whether stale browser state can override code defaults
- which public API modifies it

This is important because stale storage has already caused confusing runtime behavior.

---

## 5. Configuration contracts

Document configuration inputs from:

- presentation JSON
- asset discovery
- station definitions
- arrangement
- rail
- asset motion
- asset actions
- center images
- asset naming/import hints
- music discovery
- focus-audio pairing
- spatial settings
- preview behavior

Clearly distinguish:

- authored config
- runtime-generated state
- browser-persisted state
- derived state

---

## 6. Runtime-derived contracts

Document important state that is not authored directly but determines behavior, including:

- generated plane layouts
- randomized GLB selections
- paired vs unpaired object classification
- played/unheard/recent track history
- current-plane track history
- journey entries
- journey cursor
- plane cycle count
- plane song count
- completed journey count
- active travel strategy
- pending cross-plane focus
- GLB load state
- Three.js object residency
- camera target/current state

This section should help prepare the Deep Debug API.

---

## 7. Rendering and coordinate conventions

Extract and document the coordinate conventions used by the engine.

At minimum explain:

- station center
- station Z
- object local coordinates
- object world coordinates
- camera coordinates
- projected screen coordinates
- depth
- object radius / spatial envelope
- hemisphere
- object anchor
- fixed vs free motion
- camera-midpoint anchoring
- Three.js model transform
- image plane transform
- text plane transform

A future agent must be able to distinguish:

`local → world → camera → projected screen`

without reading the renderer from scratch.

---

## 8. Journey state machine

Document the currently implemented state machine, including:

- idle on plane
- object focus
- object traversal
- plane completion
- travel request
- roller-coaster movement
- teleport/programmatic travel
- custom travel
- pending destination object
- arrival
- intermission/arrival behavior if currently implemented or partially implemented
- continuation into the next object

Clearly separate:

- current implementation
- intended design
- proposals not yet implemented

Do not describe a proposal as already supported.

---

## 9. Music resolution rules

Extract the actual current ordering of decisions.

Document:

- fixed paired tracks
- object Track Exclusions
- globally unassigned pool
- unheard-first behavior
- recent-history avoidance
- current-plane avoidance
- graceful relaxation order
- transition pools
- exact probabilities
- relative weights
- wildcard transition policy
- journey-prefix / evolution concepts that are implemented vs planned

The order of precedence matters and must be explicit.

---

## 10. Randomized GLB selection rules

Extract the actual current logic.

Document:

- 3–5 default policy
- fixed/range/all modes
- global unpaired pool
- per-run uniqueness preference
- adjacent-plane avoidance
- reuse behavior when inventory is insufficient
- recency multipliers / probability decay
- random-selection history
- deterministic vs nondeterministic behavior
- whether rebuilds can change selections

If current behavior does not match intended docs, call out the mismatch.

---

# Deep Debug / Agent Introspection requirements

After the inventory is complete, identify what data a future agent still cannot observe cleanly from the current public API.

Create a dedicated section in `docs/api` called something like:

`Deep Debug / Agent Introspection API`

It should define the desired contract for structured live-state inspection.

The target should eventually expose a read-only snapshot with enough information to understand what the user is seeing without screenshots.

A proposed snapshot should cover at least:

## Runtime identity

- schema version
- build/revision identifier if available
- timestamp
- current URL/route
- viewport size
- device pixel ratio

## Plane state

For every plane:

- id
- label
- index
- station/world center
- station Z
- active/current/next/previous flags
- preview policy
- main image state
- text plane state
- randomized GLBs chosen
- paired GLBs
- total visible journey objects

## Object state

For every rendered or renderable object:

- id
- name
- asset type
- station id/index
- paired/unpaired/randomized/authored classification
- local position
- world position
- projected screen position
- screen radius/bounds
- depth
- size
- spin
- hemisphere
- visible flag
- actually rendered this frame
- preview-only flag
- motion configuration
- anchor configuration
- spatial envelope
- collision response
- model bounds/radius
- runtime GLB load status
- load attempts/error
- Three.js residency
- current focus status
- current audio pairing
- Track Exclusions

## Camera state

- world position
- target plane
- current Z
- target Z
- yaw/pitch
- camera mode
- placement
- focus camera interpolation state
- editor camera state
- whether arrived

## Travel state

Expose a clear enum/state such as:

- `idle`
- `roller-coaster`
- `teleport`
- `custom`
- `focus-transition`

Include:

- source plane
- destination plane
- travel mode
- custom travel id
- progress if derivable
- pending focus object
- whether travel was user-driven or programmatic if available

## Journey state

- journey active
- station index
- cursor
- length
- active object
- cycle count
- song count
- residency policy
- residency completion status
- completed full journey count
- click-to-start policy
- pending destination entry

## Audio state

- playing/paused
- current track
- current asset
- source URL if appropriate
- volume
- loop mode
- fade state if derivable
- recent track history
- played history
- unheard history
- current-plane used tracks
- fallback resolver constraints

## Randomization state

- unpaired GLB count policy
- selected random GLBs per plane
- diversity policy
- recent-plane multipliers
- candidate counts if available
- song selection history
- transition-resource selection policy

## Renderer health

- WebGL context status
- renderer initialized
- Three.js object count
- loaded GLB count
- loading GLB count
- failed GLB count
- image-plane count
- text-plane count
- debug globe count
- stale-resource count if measurable
- last context-loss/restoration timestamps if available

## Persistence/config provenance

Where practical, label important values as originating from:

- config
- default
- localStorage
- runtime API mutation
- generated/randomized state

This is highly valuable for debugging “why is the live site doing this?”

---

# Recommended Deep Debug API shape

Prefer one stable read-only root such as:

```ts
window.webrevDebug
```

or:

```ts
window.webrevPresentationSettings.getDebugSnapshot()
```

Do not create multiple disconnected global debug APIs unless there is a strong architectural reason.

Recommended primitives:

```ts
getDebugSnapshot()
getPlaneDebugState(stationId?)
getObjectDebugState(nameOrId)
getJourneyDebugState()
getRendererDebugState()
getAudioDebugState()
getRandomizationDebugState()
subscribeDebug(listener)
```

The exact final design should follow the existing architecture.

For this Codex run, documenting the complete target contract is required.

Implementation of the entire Deep Debug API is optional **only if** doing so would make the audit too large for one safe change.

If a small read-only foundation can be implemented cleanly, prefer implementing it.

Do not add mutation commands to the Deep Debug API unless clearly justified.

---

# Documentation structure

Refactor `docs/api/README.md` if necessary.

It should become easy for both a person and an agent to navigate.

A strong structure would include:

1. Purpose and compatibility
2. Quick start
3. API root/global objects
4. Complete method reference
5. Public types/interfaces
6. Events
7. Persistence/storage keys
8. Configuration contracts
9. Runtime-derived state
10. Coordinate/rendering conventions
11. Journey state machine
12. Music rules
13. Randomized GLB rules
14. Plane preview rules
15. Transition-resource rules
16. Renderer/WebGL lifecycle
17. Deep Debug / Agent Introspection
18. Defaults
19. Fallback/degradation rules
20. Stable vs experimental vs proposed features
21. Source-of-truth file map
22. Known mismatches / technical debt

Do not optimize for brevity.

This document is intended to become the **inclusive canonical API reference**.

---

# Accuracy rules

- Source code beats old docs.
- Do not invent implemented commands.
- Do not describe proposals as implemented.
- Mark uncertain behavior explicitly.
- Prefer exact names and exact type shapes.
- Include defaults.
- Include fallback order.
- Include persistence/version details.
- Include event names exactly.
- Include examples where helpful.
- Identify stale/deprecated/legacy pathways.
- Identify duplicate logic that could create divergent behavior.
- Note where runtime behavior depends on browser-local state.
- Note where live rendering state is currently impossible to inspect externally.

---

# Agent-first design rule

If the framework already knows a fact that would help a programmer or future agent debug the experience, prefer exposing or documenting that fact as structured data instead of forcing inference from screenshots, DOM appearance, or user descriptions.

The engine should increasingly be able to explain itself.

---

# Deliverables

At minimum complete all of the following:

1. Audit the repository for every public/semi-public API surface.
2. Update `docs/api/README.md` into an exhaustive source-derived reference.
3. Add a complete event inventory.
4. Add a complete localStorage/persistence inventory.
5. Add configuration/runtime provenance documentation.
6. Add coordinate/rendering conventions.
7. Add journey/travel state documentation.
8. Add music-resolution precedence.
9. Add randomized-GLB precedence.
10. Add a comprehensive Deep Debug / Agent Introspection contract.
11. List any implementation/documentation mismatches discovered.
12. If safe and small, implement the first read-only Deep Debug snapshot primitive.
13. Run the relevant checks/tests/build.
14. Report:
    - files changed
    - API surfaces discovered
    - new documentation sections
    - mismatches found
    - whether Deep Debug code was implemented
    - test/build results
    - recommended next implementation step

---

# Non-goals for this run

Do not:

- redesign the whole renderer
- rewrite the journey engine
- replace stable existing API names without compatibility need
- hide complexity by deleting advanced features
- collapse authored state and runtime state into one ambiguous object
- add screenshot/OCR dependencies as the primary debugging mechanism

The purpose of this run is to **make the existing system legible and contract-driven**, and establish the foundation for structured live introspection.



---

# Granular probabilistic orchestration direction

The API must eventually support deeply composable probability-driven behavior across multiple scopes without requiring core-engine rewrites.

This is not limited to simple shuffle or one weight per song.

The design target is **maximum optional granularity on top of stable contracts**:

- simple projects should remain simple
- advanced projects should be able to express unusually sophisticated authored behavior
- future creators should compose primitives into complex systems rather than require a new hard-coded engine feature for every idea
- the API should support visionary complexity without forcing that complexity on ordinary users
- the foundation should feel effectively open-ended: new behaviors should be buildable upward through composition, extension points, adapters, and data-driven programs
- stable API/ABI boundaries are more important than preserving any one internal implementation
- public contracts should evolve conservatively, with versioning/migration rather than silent breakage
- implementation details may change while serialized programs, manifests, and public contracts remain durable
- avoid special-case logic tied to one song, one plane, one transition, or one project
- prefer generic primitives that can be reused indefinitely

Where ABI-like boundaries exist or can reasonably be introduced, document them explicitly.

Examples include:

- serialized manifest/program schemas
- event detail contracts
- provider/adaptor interfaces
- custom travel hooks
- debug snapshot schemas
- stable identifiers
- versioned persisted state
- future WASM/host boundaries

The orchestration model must be able to distinguish at least these scopes:

```text
journey
plane
transition
travel-mode
object
playlist
track
```

Do not collapse these into one ambiguous "context" field.

Rules should support inheritance and override across scopes.

A conceptual precedence may look like:

```text
journey/global defaults
→ plane
→ transition
→ travel mode
→ object
→ playlist
→ track
```

This is only a design direction; Codex must document current behavior separately from proposed behavior.

The API should eventually be able to express:

- exact probability, e.g. `0.20`
- relative weight, e.g. `0.4`
- guaranteed behavior, e.g. probability `1.0`
- ordered prefixes
- preferred-first resources
- weighted remainder pools
- nested playlists and pools
- exact-probability members mixed with weighted members
- conditional boosts
- conditional suppression
- additive probability changes
- multiplicative weight changes
- recent-history penalties
- completion-dependent changes
- guaranteed follow-ups
- rule phases / configurations
- restart the same playlist under a new configuration
- branch to another playlist after completion
- branch based on partial vs full completion
- per-plane policy
- per-transition policy
- per-travel-mode policy
- roller-coaster-specific behavior
- teleport/programmatic-specific behavior
- custom-travel-specific behavior
- per-object policy
- per-playlist policy
- per-track policy
- whole-journey policy
- future provider/media-source policy

Example conceptual program:

```text
Object A
→ Playlist A has 20% exact probability
→ Playlist B and C compete by weight otherwise

If Playlist A starts:
→ Song X has 20% probability to play first
→ Song Y has 21%
→ Song Z has 10%
→ Song Q has 5%
→ remaining songs share leftover probability using weight 0.2

If Playlist A completes fully:
→ restart Playlist A under Configuration B
→ boost Playlist B by +20 percentage points

After Playlist B completes:
→ play Song R with certainty
→ then choose from S/T/U/V using another probability/weight rule
→ then continue to Playlist E

During Plane B → Plane C by roller-coaster:
→ use a transition-specific intermission pool

During Plane B → Plane C by teleport:
→ suppress intermission audio

On flint.glb:
→ exclude Track Q
→ prefer Playlist C by weight 0.4
```

The important requirement is not this exact syntax.

The important requirement is that the primitives are expressive enough to represent behavior at this level without hard-coding the specific story into the engine.

Execution history should be rich enough to explain **why** a rule fired, including:

- which scope supplied the rule
- which condition matched
- which probability/weight was used
- which candidates were excluded
- what prior completion/history modified the decision
- what fallback path was taken

This explanation data should eventually be visible through the Deep Debug / Agent Introspection API.

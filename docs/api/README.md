# WebRev Spatial Presentation API

> The portable, versioned deep-debug contracts are documented separately in [Runtime inspection and deep-debug contracts](../RUNTIME_INSPECTION.md). They separate read-only inspection from trusted recording and renderer observations from orchestration intent. The browser API below has not yet been adapted to publish those contracts.

## Purpose

This document describes the **current public runtime API** exposed by the Blog 5 spatial presentation engine through:

```ts
window.webrevPresentationSettings
```

It is intended to answer two questions clearly:

1. **What can the engine do right now?**
2. **Which API should a creator, editor, or future UI call to do it?**

The API is intentionally becoming the stable layer beneath future interfaces. A conventional Settings panel, a right-click menu, a manifest editor, or a more experimental 3D/Lain-inspired editor should all call the same API rather than duplicate behavior.

---

## Current Core Ideas

The engine currently supports:

- multiple spatial planes/stations
- a global uploaded asset library
- moving assets between planes
- 2D and GLB/GLTF assets
- front/back hemisphere placement
- per-asset motion
- per-asset fixed song pairing
- per-asset Track Exclusions
- dynamic unpaired-song fallback
- configurable extra unpaired GLB counts
- fixed or randomized extra-GLB counts
- recent-song avoidance
- session-wide played/unheard song history
- current-plane song avoidance
- object-first journey traversal
- plane residency policies
- multiple travel strategies
- programmable playback sequences/pools
- style/edit snapshots
- spatial collision envelopes
- generic spatial media-envelope programs and bindings
- song-triggered concave media spheres with curved image/video tiles
- timed/threshold media choreography
- GLB runtime/debug inspection hooks
- edit-layer camera controls

---

## Access

```ts
const api = window.webrevPresentationSettings;
```

Always check for existence when calling from external code:

```ts
if (window.webrevPresentationSettings) {
  // use API
}
```

---

# Default presentation mode

The current public website defaults to a clean presentation-first experience:

- no visible settings gear or settings panel
- no visible roller-coaster button
- no instructional HUD text
- Left/Right remain object iteration
- Up/Down remain roller-coaster plane travel
- right-click remains available as the presentation interaction surface
- the lower text plaque uses a romantic pink presentation style and Cormorant Garamond via Google Fonts

These are project-facing defaults layered over the runtime API. Editor/settings capabilities remain available programmatically and are not removed from the engine.

# 1. General Presentation Settings

## `get(key?)`

Reads either the complete active presentation settings snapshot or one setting.

```ts
api.get()
api.get("camera.mode")
api.get("focusAudio.volume")
```

Supported setting keys currently include:

### Camera

- `camera.mode`
- `camera.placement`
- `camera.distanceFromCenter`

### Sphere

- `sphere.diameter`
- `sphere.radius`
- `sphere.circumference`
- `sphere.restitution`

### Viewport

- `viewport.enabled`
- `viewport.paddingPx`

### Initial placement

- `initialPlacement.keepViewerImageSightlineClear`

### Interaction

- `interaction.contextMenuMode`

### Focus audio

- `focusAudio.enabled`
- `focusAudio.track`
- `focusAudio.playbackMode`
- `focusAudio.scope`
- `focusAudio.volume`
- `focusAudio.fadeInMs`
- `focusAudio.fadeOutMs`

### GLB debug

- `debug.glbGlobe.enabled`
- `debug.glbGlobe.objectName`

### Editor

- `editor.mode`
- `editor.hemisphere`
- `editor.cameraPreset`
- `editor.repositionObjectName`

### Text plane

- `textPlane.enabled`
- `textPlane.color`
- `textPlane.width`
- `textPlane.height`
- `textPlane.offsetY`
- `textPlane.offsetZ`
- `textPlane.attachment`
- `textPlane.orientationMode`
- `textPlane.rotationAxis`
- `textPlane.angleDegrees`
- `textPlane.placementSpace`

## `set(key, value)`

Changes a supported setting.

```ts
api.set("focusAudio.volume", 0.7)
api.set("camera.mode", "focus")
```

## `reset(key?)`

Resets one setting or the active settings snapshot toward configured defaults.

## `subscribe(listener)`

Subscribes to presentation-setting changes.

Returns an unsubscribe function.

## `describeSettings(stationId?)`

Returns machine-readable setting descriptors used by the Settings UI.

This is important for future UI work because an alternative editor can generate controls from the same descriptors.

---

# 2. Asset Library and Plane Assignment

## `listAssetLibrary()`

Lists uploaded assets in the global library.

Each entry currently exposes:

- `name`
- `stationId`
- `kind` — `"2d"` or `"3d"`
- `uploaded`

Filename prefixes are not intended to remain the authoritative presentation structure. The API assignment is the runtime source of truth for editor state.

## `listAssets(stationId?)`

Lists assets associated with a plane.

It can expose:

- name
- station
- hemisphere
- visibility
- motion
- asset kind
- upload state
- paired focus track
- GLB runtime load state
- load attempts

## `getAssetStation(name)`

Returns the plane/station ID assigned to an asset.

## `setAssetStation(name, stationId)`

Moves an asset to another plane.

```ts
api.setAssetStation("flint.glb", "rose-archive")
```

## `setAssetHemisphere(name, hemisphere)`

Sets:

```ts
"front" | "back"
```

## `setAssetVisible(name, visible)`

Shows or hides an asset.

---

# 3. Asset Motion

## `getAssetMotion(name)`

Returns the normalized motion configuration for an asset.

## `setAssetMotion(name, motion)`

Changes the motion behavior.

Current engine concepts include free motion and fixed motion, including anchored/ranged behavior as implemented by the object-motion subsystem.

Example:

```ts
api.setAssetMotion("flint.glb", { type: "free" })
```

The exact `ObjectMotion` shape is defined in `src/lib/objectMotion` and should remain the canonical implementation contract.

---

# 4. Fixed Song Pairing

## `getAssetFocusAudio(name)`

Returns the asset's fixed/default focus song.

```ts
api.getAssetFocusAudio("flint.glb")
```

## `setAssetFocusAudio(name, patch)`

Assigns or changes the asset's fixed track.

```ts
api.setAssetFocusAudio("flint.glb", {
  track: "october.mp3"
})
```

A fixed pairing is distinct from future temporary Music Flow instructions.

A temporary instruction should not silently rewrite a permanent pairing.

---

# 5. Per-Object Track Exclusions

The professional API term is **Track Exclusions**.

These define songs that a specific GLB must not play.

This applies to dynamically resolved fallback music and can also override that object's normal assigned song for the encounter.

## `getAssetTrackExclusions(name)`

```ts
api.getAssetTrackExclusions("flint.glb")
```

## `setAssetTrackExclusions(name, tracks)`

Replaces the entire exclusion list.

```ts
api.setAssetTrackExclusions("flint.glb", [
  "october.mp3",
  "amor.mp3"
])
```

## `addAssetTrackExclusion(name, track)`

Adds one track.

## `removeAssetTrackExclusion(name, track)`

Removes one track.

Future listener-facing UI may describe this more naturally as:

- “Don't play this song on this object”
- “Exclude from this object”

The API term remains Track Exclusions.

---

# 6. Extra Unpaired GLBs

Planes can contain explicitly paired GLBs plus additional unpaired GLBs chosen from the plane's available inventory.

The count is controlled by:

```ts
type UnpairedGlbCountPolicy =
  | number
  | "all"
  | { mode: "range"; min: number; max: number };
```

## Current default

```ts
{ mode: "range", min: 3, max: 5 }
```

This means a plane normally adds 3–5 unpaired GLBs on top of its explicitly paired objects.

## `getUnpairedGlbLimit(stationId?)`

Returns the active policy.

## `setUnpairedGlbLimit(policy, stationId?)`

Examples:

### Fixed count

```ts
api.setUnpairedGlbLimit(2)
```

### Random range

```ts
api.setUnpairedGlbLimit({
  mode: "range",
  min: 3,
  max: 5
})
```

### Per-plane range

```ts
api.setUnpairedGlbLimit(
  { mode: "range", min: 2, max: 6 },
  "rose-archive"
)
```

### Show all for edit/debug

```ts
api.setUnpairedGlbLimit("all")
```

---

# 6A. Randomized GLB Diversity

Randomized extra GLBs now use a history-aware diversity policy across the complete ordered set of planes.

The default behavior is:

- prefer GLBs that have not appeared on any earlier plane in the current full run
- avoid repeating a randomized GLB on two adjacent planes whenever enough alternatives exist
- if the global GLB inventory is too small to satisfy full uniqueness, reuse is allowed gracefully
- when reuse is necessary, recent-plane probability multipliers reduce the chance of recently seen objects

Default policy:

```ts
{
  avoidWithinRun: true,
  avoidAdjacent: true,
  recentPlaneMultipliers: {
    1: 0.5,
    2: 0.8
  }
}
```

The multipliers mean:

- an object used on the immediately previous plane receives a 0.5× selection weight when reuse is necessary
- an object used two planes ago receives a 0.8× selection weight
- objects outside configured history distances keep their normal weight

Hard uniqueness is attempted before these soft weighting rules are needed.

## `getRandomGlbDiversityPolicy()`

Returns the active diversity policy.

## `setRandomGlbDiversityPolicy(policy)`

Changes one or more diversity rules.

Example:

```ts
api.setRandomGlbDiversityPolicy({
  avoidWithinRun: true,
  avoidAdjacent: true,
  recentPlaneMultipliers: {
    1: 0.25,
    2: 0.6,
    3: 0.85
  }
})
```

This allows future authoring styles such as very strong recent-object suppression or a longer gradual decay curve.

## `getRandomGlbSelectionHistory()`

Returns the randomized GLB names chosen for each plane in the current generated run.

Shape:

```ts
string[][]
```

Example:

```ts
[
  ["a.glb", "b.glb", "c.glb"],
  ["d.glb", "e.glb", "f.glb"],
  ["g.glb", "h.glb", "i.glb"]
]
```

This is primarily useful for diagnostics, authoring tools, manifests, and future visualization of diversity decisions.

## `clearRandomGlbSelectionHistory()`

Clears the current randomized-selection history.

The next full layout generation rebuilds history from its new selections.

## Selection priority

For each plane, randomized GLBs are selected approximately in this order:

```
never used earlier in this world run
→ not used on previous plane
→ weighted reuse by recent-plane distance
→ graceful reuse if inventory is insufficient
```

This system is independent of fixed/paired GLBs. Authored GLB placements remain authored placements; the diversity policy governs the additional randomized GLB pool.

---

# 7. Track History and Variety

The engine now keeps two distinct history concepts.

## Recent history

A short ordered window used to avoid immediate repetition.

Default:

```
4 tracks
```

## Session played ledger

A set of every catalog track that has been played during the current runtime session.

This allows the resolver to prefer songs that have **never been heard yet**.

## `getFallbackSongHistoryWindow()`

Returns the short recent-history count.

## `setFallbackSongHistoryWindow(count)`

Example:

```ts
api.setFallbackSongHistoryWindow(2)
```

Set `0` to disable recent-history avoidance.

## `getPlayedTrackHistory()`

Returns:

```ts
{
  recent: string[];
  played: string[];
  unheard: string[];
}
```

Example use:

```ts
const history = api.getPlayedTrackHistory();

console.log(history.recent);
console.log(history.played);
console.log(history.unheard);
```

## `clearPlayedTrackHistory()`

Clears both the short recent list and the session-wide played ledger.

Useful for:

- restarting a presentation
- testing/debugging
- beginning a new listener session

---

# 8. Current-Plane Song Avoidance

## `getAvoidCurrentPlaneSongsForFallback()`

Returns whether fallback selection tries to avoid music already represented on the current plane.

## `setAvoidCurrentPlaneSongsForFallback(enabled)`

```ts
api.setAvoidCurrentPlaneSongsForFallback(true)
```

Current intended default is enabled.

---

# 9. Unpaired Song Resolution Strategy

When an **unpaired GLB** is encountered, the song is resolved at playback time.

The current priority is:

## Tier 1 — unheard first

Candidate must be:

- globally unassigned
- allowed by the object's Track Exclusions
- not in recent history
- not already represented on the current plane
- never played before during this session

## Tier 2 — previously heard allowed

If no unheard candidate remains:

- globally unassigned
- allowed by object exclusions
- not in recent history
- not represented on the current plane

## Emergency degradation

If the catalog is too small to satisfy all constraints, the resolver progressively relaxes restrictions while remaining inside the globally unassigned/object-safe pool.

This degradation exists so playback does not dead-end when a tiny catalog makes the ideal rules mathematically impossible.

---

# 10. Journey Traversal

Normal journey traversal is now **object-first**.

That distinction is important.

A plane with:

```
5 visible GLBs
```

has:

```
5 normal journey steps per cycle
```

The total music catalog does **not** silently create extra journey steps.

For each object:

- paired GLB → fixed song unless excluded/overridden
- unpaired GLB → fresh fallback resolved when encountered

This prevents legacy song-first playlist allocation from creating invisible extra Right-arrow steps.

---

# 11. Focus Playlist / Playback Program

## `getFocusPlaylist()`

Returns the catalog-oriented resolved playlist view.

Important:

This remains useful for explicit song navigation, diagnostics, and advanced Music Flow concepts, but it is **not the source of normal object-first journey length**.

## `setFocusPlaybackMode(mode)`

Modes:

```ts
"zone-cycle" | "loop-item"
```

## `setFocusPlaybackScope(scope)`

Scopes:

```ts
"station" | "all"
```

## `getFocusPlaybackProgram()`

Returns the active playback program.

Current type:

```ts
type FocusPlaybackProgram = {
  scope?: "station" | "all";
  order?: "ordered" | "random";
  sequence?: string[];

  residency?:
    | { mode: "cycles"; value: number }
    | { mode: "songs"; value: number }
    | { mode: "coverage"; value: number };

  travelMode?:
    | "teleport"
    | "roller-coaster"
    | "custom";

  customTravelId?: string;

  pools?: Array<{
    id: string;
    assets?: string[];
    tracks?: string[];
    order?: "ordered" | "random";
    repeat?: number | "forever";
  }>;
};
```

## `setFocusPlaybackProgram(program)`

Replaces/normalizes the playback program.

## `setFocusPlaybackOrder(order)`

Sets:

```ts
"ordered" | "random"
```

The longer-term Music Flow proposal will likely evolve this program into a more explicit instruction model.

See:

`docs/proposals/MUSIC_FLOW_COMPOSABLE_PLAYBACK_ORCHESTRATION.md`

---

# 12. Plane Residency

Residency controls **when the journey is allowed to leave the current plane**.

Type:

```ts
type PlaneResidencyPolicy =
  | { mode: "cycles"; value: number }
  | { mode: "songs"; value: number }
  | { mode: "coverage"; value: number };
```

## `getPlaneResidencyPolicy()`

Returns the current policy.

## `setPlaneResidencyPolicy(policy)`

Examples:

### Two complete object cycles

```ts
api.setPlaneResidencyPolicy({
  mode: "cycles",
  value: 2
})
```

### Ten songs

```ts
api.setPlaneResidencyPolicy({
  mode: "songs",
  value: 10
})
```

### 75% catalog coverage

```ts
api.setPlaneResidencyPolicy({
  mode: "coverage",
  value: 75
})
```

Current default is one cycle.

---

# 13. Plane Travel

Travel and journey length are deliberately separate concerns.

Supported travel modes:

```ts
type PlaneTravelMode =
  | "teleport"
  | "roller-coaster"
  | "custom";
```

## teleport

Instant/programmatic movement.

Intended for:

- edit mode
- direct API navigation
- debugging
- administrative movement

## roller-coaster

Built-in cinematic audience transition.

This is the intended default journey travel.

## custom

Extension point for developer-defined travel.

If no custom handler takes responsibility, the runtime is designed to fall back safely to the built-in ride.

## `getPlaneTravelMode()`

Returns the configured journey travel strategy.

## `setPlaneTravelMode(mode, customTravelId?)`

Examples:

```ts
api.setPlaneTravelMode("roller-coaster")
```

```ts
api.setPlaneTravelMode("teleport")
```

```ts
api.setPlaneTravelMode("custom", "fade-through-stars")
```

## `travelToPlane(stationId, mode?, customTravelId?)`

Programmatically moves to a plane.

Default direct API travel is teleport-style unless another mode is supplied.

For the current website's keyboard navigation, plane travel is intentionally bound as:

```text
ArrowUp   → next plane via roller-coaster travel
ArrowDown → previous plane via roller-coaster travel
```

This is a project input policy layered over the generic travel API. Left/Right remain object iteration controls on the current plane.

---

# 14. Journey Start

## `getJourneyClickStart()`

Returns whether clicking a GLB starts the journey.

## `setJourneyClickStart(enabled)`

When enabled:

- ordinary GLB click can start the journey

When disabled:

- clicking can remain exploratory
- right-click “Play This” can start the journey intentionally

Escape and “Leave for now <3” exit a focused object experience.

---

# 15. Style Exploration / Snapshot Export

## `getStyleExplorationMode()`

Returns whether Style Exploration Mode is active.

## `setStyleExplorationMode(enabled)`

Enables/disables it.

## `saveSettings()`

Saves current settings.

When Style Exploration Mode is enabled, this also builds a JSON snapshot.

## `getStyleSnapshot()`

Returns the most recently saved snapshot.

Current snapshot material includes:

- asset stations
- asset focus-audio pairings
- asset Track Exclusions
- placement
- motion
- spatial envelopes
- station settings
- playback program
- unpaired GLB policies
- recent-history window
- current-plane avoidance policy
- journey click-start
- object positions

## `downloadStyleSnapshot()`

Downloads the latest saved JSON snapshot.

Long-term direction:

```
Style Snapshot
→ formal Presentation Manifest
→ Presentation Mode
```

See:

`docs/proposals/MANIFEST_DRIVEN_EDIT_AND_PRESENTATION_MODES.md`

---

# 16. Spatial Envelopes and Collision

## `getSpatialEnvelope(name)`

Returns the current spatial envelope configuration.

## `setSpatialEnvelope(name, patch)`

Updates an asset's spatial envelope.

## `setEnvelopeDebug(name, visible)`

Shows/hides the envelope visualization.

The complete `SpatialEnvelopeConfig` contract is defined by the spatial-envelope library and should remain canonical there.

---

# 16A. Spatial Media Envelopes

Spatial Media Envelopes are generic spatial-performance programs. The current renderer implements an inward-facing spherical envelope with curved media tiles; the first automatic trigger adapter is song playback, but direct activation and the binding model are intentionally trigger-agnostic.

## Program methods

`listMediaEnvelopePrograms()` returns detached program definitions.

`getMediaEnvelopeProgram(id)` returns one program or `null`.

`setMediaEnvelopeProgram(program)` creates/replaces a runtime program. Programs require a stable `id`.

`removeMediaEnvelopeProgram(id)` removes a program and bindings that reference it. If the removed program is active, its renderer resources are torn down.

## Binding methods

`listMediaEnvelopeBindings()` returns current trigger bindings.

`setMediaEnvelopeBinding(binding)` creates/replaces a binding.

`removeMediaEnvelopeBinding(id)` removes one binding.

`bindSongToMediaEnvelope(trackId, programId, bindingId?)` is the first convenience adapter. It creates a binding whose trigger is `{type:"song", trackId}`.

The contract is not limited to music. The public trigger type already reserves object-focus, station-enter, journey-progress, event, and custom trigger shapes for future adapters. Only song matching is automatically executed by the current runtime.

## Runtime methods

`activateMediaEnvelope(programId, context?)` directly activates a program. This is the generic path and does not require a song.

`deactivateMediaEnvelope()` tears down the active envelope.

`getActiveMediaEnvelopeState()` returns the same JSON-serializable runtime state exposed by Deep Debug.

## Current sphere behavior

The current v1 renderer:

- resolves the origin from the focused object (or station center)
- computes a radius large enough to contain the current and next main-panel regions plus configurable padding/panel allowance
- creates curved, tessellated media patches on the sphere surface
- can place focus media on the far inner wall along the settled camera-to-focus view ray
- supports a viewport-fit mode that projects the actual focus viewport onto the inner sphere
- supports explicit fixed sphere radius for authored distance control
- places ordinary grid patches around a camera/focus-centered spherical layout
- keeps tile vertical orientation stable against world-up
- supports configurable angular protected regions; an explicit empty list disables those exclusions
- supports foreground depth mode so authored media need not be occluded by scene images/GLBs
- supports temporary culling of stations outside the active envelope for lower rendering cost
- supports image and video textures
- grows the whole envelope into view
- supports `promote` / `scale`, `fade-others`, `hide-others`, `fade`, and `hide` choreography cues
- may trigger cues from song time and from a media-scale threshold
- pauses/disposes media and geometry when the envelope deactivates

Discovered image/video assets under `apps/playground/src/assets/**` are available by file name/path through the generic media catalog. The current shared test-video pool is reserved at `apps/playground/src/assets/oversphere/videos/`.

### Remote oversphere URL pool

The current project can source oversphere videos from:

```text
apps/playground/src/assets/oversphere/locations/urls.json
```

This JSON is a project configuration source layered over the generic Spatial Media Envelope API. The renderer does not know about Cloudflare or any specific CDN; it only receives normalized media sources.

Current shape:

```json
{
  "selection": {
    "avoidRecent": 3,
    "avoidCurrentPlane": true,
    "avoidPreviousPlane": false,
    "pairingRequired": false
  },
  "videos": [
    {
      "id": "memory-01",
      "name": "Memory 01",
      "url": "https://cdn.example.com/memory-01.mp4"
    }
  ]
}
```

Bare URL strings are also accepted inside `videos`, but object entries with stable `id` values are recommended for readable history/debugging.

The project may contain roughly 20 or more remote URLs without placing the video files in Git. Local MP4/WebM files under `assets/oversphere/videos/` remain supported and are merged into the same normalized source pool.

Selection currently prefers:

- one video per focused item/song;
- no video already used on the current plane, while unused candidates remain;
- no video from the last `avoidRecent` global selections (currently `3`);
- optional previous-plane exclusion when enabled;
- graceful relaxation of exclusions when the pool is too small.

Explicit authored media-envelope bindings still override this project fallback.

---

### Default oversphere video selection

The project fallback oversphere is now **opt-in** for the default website. The current project configuration sets:

```json
{
  "enabled": false
}
```

So ordinary focused-object playback does not automatically create the oversphere.

The runtime API controls this independently of authored media-envelope programs:

```js
api.getOversphereEnabled()
api.setOversphereEnabled(true)
api.setOversphereEnabled(false)
```

Disabling it immediately tears down an active default oversphere, but does not disable explicitly authored media-envelope programs or remove the oversphere implementation.

When enabled, if a song starts and no explicit media-envelope binding matches it, the runtime falls back to the shared `oversphere/videos` pool automatically.

Default behavior:

- one video is selected for the focused item/song
- the current project fallback video is non-looping and can end its temporary oversphere lifecycle
- no object-to-video pairing is required
- the selector avoids the configured recent window globally (currently **3**)
- when enough candidates remain, it avoids videos already used on the **current plane**; previous-plane avoidance is optional
- if the pool is too small to satisfy an exclusion, that exclusion is relaxed rather than producing no media
- with exactly 3 videos, the last-two rule naturally forces rotation through all three
- with a larger pool, selection is random among eligible candidates
- explicit authored `MediaEnvelopeBinding` entries take precedence over this fallback

The policy is intentionally exposed instead of hard-coded:

```js
api.getOversphereVideoSelectionPolicy()

api.setOversphereVideoSelectionPolicy({
  avoidRecent: 3,
  avoidPreviousPlane: true,
  pairingRequired: false
})

api.getOversphereVideoHistory()
api.clearOversphereVideoHistory()
```

The current policy type is:

```ts
type OversphereVideoSelectionPolicy = {
  avoidRecent: number;
  avoidCurrentPlane: boolean;
  avoidPreviousPlane: boolean;
  pairingRequired: boolean;
  selection: "random";
};
```

This is a project-default policy built on the generic media-envelope API. Future authored per-song/per-object pools can replace it without changing the renderer.

### Oversphere radius

The project fallback oversphere has an explicit runtime radius. This radius controls the distance from the focus origin to the inner media wall:

- smaller radius = media appears closer;
- larger radius = media appears farther away.

```js
api.getOversphereRadius()

api.setOversphereRadius(6)
```

The value is independent from the ordinary station sphere settings and is intended to remain authorable by future Studio/UI layers.

Generic media-envelope programs can also provide their own fixed radius through:

```ts
envelope: {
  shape: "sphere",
  radius: 6
}
```

If a program omits a fixed radius, the generic resolver may still derive one from its coverage settings.

### Oversphere media tracing and viewport fit

The default oversphere video now uses a **viewport-fit** spherical patch instead of relying on a guessed angular offset. The runtime casts the final focus camera viewport onto the inner sphere and builds the curved video patch from those ray/sphere intersections.

This gives the project default a stronger invariant:

```text
focused camera settles
→ viewport rays intersect inner sphere
→ video patch is built from those intersections
→ patch center is in the camera viewport
→ patch faces inward toward the viewer
```

If the requested oversphere radius is too small to contain the settled focus camera, the runtime automatically expands the effective radius enough to keep the camera inside the sphere.

The media pipeline is also traceable:

```js
api.getOversphereMediaTrace()
```

This returns the active media-envelope debug state with per-tile trace data, including:

- selected source URL
- video lifecycle phase
- `readyState`
- `networkState`
- paused / ended state
- current time / duration
- decoded video width / height
- media error code
- autoplay/playback error text
- tile world center
- tile NDC center
- whether the tile center is inside the camera viewport

The default video patch now stays visibly present while media is loading. Before the first usable frame is available, the patch uses a diagnostic texture such as:

```text
VIDEO LOADING
VIDEO FAILED
VIDEO PLAY BLOCKED
VIDEO STALLED
```

Once the browser reports usable frame data, the material swaps from the diagnostic texture to the real `VideoTexture`.

This means a missing rectangle is now a geometry/viewport problem, while a visible diagnostic rectangle is a media/network/playback problem.

The runtime dispatches:

```text
webrev:media-envelope-video-state
```

for video lifecycle transitions such as `loadstart`, `loadedmetadata`, `canplay`, `playing`, `waiting`, `stalled`, `error`, and `ended`.

This is intended to distinguish geometry problems from media-network/playback problems without guessing.

### Oversphere inspection mode

Inspection mode is a first-class camera/debug capability, not a hard-coded keyboard feature.

It keeps the current focused camera position fixed while allowing unrestricted look-around orientation. The active oversphere, video, object focus, and media playback continue running normally. This is useful for determining whether media exists elsewhere on the inner sphere when it is not visible in the normal authored camera composition.

```js
api.enterOversphereInspectMode()
api.exitOversphereInspectMode()
api.getOversphereInspectState()
```

`enterOversphereInspectMode()` returns `false` when there is no focused object or active media envelope to inspect.

The state shape is:

```ts
{
  active: boolean;
  pointerLocked: boolean;
  keyBinding: {
    enter: string | null;
    exit: string | null;
  };
}
```

Input bindings are deliberately separate from the inspection behavior:

```js
api.setOversphereInspectKeyBinding({
  enter: "I",
  exit: "Shift+Escape"
})
```

Either binding can be disabled with `null`:

```js
api.setOversphereInspectKeyBinding({
  enter: null,
  exit: null
})
```

This allows future interfaces to bind inspection to any keyboard shortcut, mouse control, gamepad input, Studio button, agent action, or other command source without changing the inspection implementation itself.

The current experience right-click menu may expose **Inspect Oversphere** as a convenience UI over the same API.

Inspection events:

```text
webrev:oversphere-inspect
webrev:oversphere-inspect-binding
```

`webrev:oversphere-inspect` reports whether inspection became active or inactive. `webrev:oversphere-inspect-binding` reports the current configurable keyboard binding.


### Minimal example

```js
const api = window.webrevPresentationSettings;

api.setMediaEnvelopeProgram({
  id: "memory-sphere",
  envelope: {
    shape: "sphere",
    origin: { mode: "focused-object" },
    growth: { mode: "timed", durationMs: 1200, easing: "easeOutCubic" }
  },
  coverage: {
    include: ["current-main-panel", "next-main-panel"],
    padding: 3,
    panelAllowance: 4
  },
  protectedRegions: [
    { target: "current-main-panel", mode: "avoid", angularRadiusDeg: 18 },
    { target: "next-main-panel", mode: "avoid", angularRadiusDeg: 18 }
  ],
  layout: {
    mode: "grid",
    rows: 3,
    columns: 5,
    horizontalArcDeg: 150,
    verticalArcDeg: 80,
    gapDeg: 4
  },
  media: [
    { id: "a", type: "video", src: "a.mp4", loop: true, muted: true },
    { id: "b", type: "image", src: "b.webp" }
  ],
  choreography: {
    clock: "binding",
    cues: [
      { at: 18.5, action: "promote", mediaId: "b", targetScale: 3.4, durationMs: 1700 },
      {
        at: 18.5,
        action: "fade-others",
        except: ["b"],
        when: { source: "media-scale", mediaId: "b", gte: 1.7 },
        durationMs: 700
      }
    ]
  }
});

api.bindSongToMediaEnvelope("example-song.mp3", "memory-sphere");
```

Authored project configuration uses the top-level arrays:

```json
{
  "mediaEnvelopePrograms": [],
  "mediaEnvelopeBindings": []
}
```

The full architectural direction is documented in `docs/proposals/GENERAL_SPATIAL_MEDIA_ENVELOPES_AND_CHOREOGRAPHED_SURFACE_MEDIA.md`.

---

# 17. GLB Runtime Status and Debugging

## `setGlbDebugGlobe(enabled, objectName?)`

Shows a debug globe around the selected GLB.

Useful for:

- scale
- bounds
- centering
- collision/spatial inspection

## `getAssetRuntimeStatus(name)`

Returns:

```ts
{
  status:
    | "acknowledged"
    | "loading"
    | "loaded"
    | "retrying"
    | "failed";

  attempts: number;
  lastError?: string;
}
```

GLB render identity is keyed by the actual asset name rather than a temporary layout slot so a rebuilt plane cannot reuse the wrong loaded model.

---

# 18. Edit Layer

## `getEditorState()`

Returns the current editor state.

## `setEditorMode(mode, hemisphere?)`

Modes:

```ts
"none" | "hemisphere"
```

## `setEditorCameraPreset(preset)`

Changes the hemisphere editor camera.

## `setRepositionObject(name | null)`

Selects an object for repositioning.

## `listEditorCameraPresets()`

Lists available editor-camera presets.

---

# 19. Current Defaults Worth Knowing

As of the current implementation:

- extra unpaired GLBs: randomized 3–5
- recent-song avoidance window: 4
- current-plane fallback-song avoidance: enabled
- unpaired resolution: prefer never-heard tracks first
- normal journey length: number of visible GLBs
- plane residency: 1 cycle
- journey travel: roller-coaster
- direct programmatic travel: teleport
- click-to-start journey: enabled
- custom travel: supported through extension event/hook
- per-object Track Exclusions: supported

---

# 20. Architecture Boundaries

## API vs UI

The API owns behavior.

The UI should call the API.

Future interfaces may include:

- simple Settings panel
- listener-friendly right-click Music Flow controls
- dedicated timeline/graph editor
- floating 3D control-space
- manifest authoring tools

None should reimplement scheduler behavior themselves.

## Journey vs catalog playlist

Normal journey traversal is object-first.

The catalog-oriented playlist remains a separate advanced concept.

Do not use the catalog playlist length as an implicit plane journey length.

## Pairing vs temporary flow

A fixed object-song pairing is persistent authoring state.

Future temporary Music Flow instructions should sit above that state and then resume it.

---

# 21. Planned / Proposed, Not Yet Fully Implemented

These are architectural directions, not promises that every API call exists today:

- formal `PresentationManifest` importer/runtime
- full Edit Mode → manifest → Presentation Mode pipeline
- instruction-based Music Flow API
- temporary “play this N times, then resume” rules
- YouTube/media-provider adapters
- named external playlists attached to planes/lanes
- visual Music Flow graph editor
- richer custom travel strategies
- per-provider exclusions
- persistent cross-session listening history if desired
- advanced branching/conditional playback

The current API should evolve toward those features without breaking the simple primitives already exposed.

---

# 22. Related Documents

- `docs/journey/README.md`
- `docs/proposals/MUSIC_FLOW_COMPOSABLE_PLAYBACK_ORCHESTRATION.md`
- `docs/proposals/MANIFEST_DRIVEN_EDIT_AND_PRESENTATION_MODES.md`
- `docs/proposals/JOURNEY_SEGMENT_EFFECTS_AND_SPATIAL_ENVIRONMENT_SPHERES.md`
- `docs/proposals/GENERAL_SPATIAL_MEDIA_ENVELOPES_AND_CHOREOGRAPHED_SURFACE_MEDIA.md`


---

# 23. Canonical source-derived contract audit (2026-10-01)

This section supersedes any less-specific statement above. It records the repository as implemented, not the broader product vision. **Current** means executable source exists. **Proposed** means documentation only. The browser APIs are experimental (no semantic-version compatibility guarantee yet); the versioned JSON/storage shapes and `@webrev/core` exports are the nearest current ABI-style boundaries.

## 23.1 Quick start and API roots

```js
const settings = window.webrevPresentationSettings; // mutable settings/commands
const snapshot = window.webrevDebug?.getDebugSnapshot(); // read-only live truth, schema v1
const discovery = await fetch('/.well-known/webrev.json').then(r => r.json());
```

`@webrev/astro` also emits the same static discovery document at `/__webrev/revision`. `WebRevAstroOptions` is `{ revision?: string; inspect?: boolean }`; revision precedence is option, `WEBREV_REVISION`, then `"dev"`. `inspect: false` disables both routes. The document is `InspectionDocument` schema 1: `{schemaVersion:1, framework:"webrev", revision, health}`.

## 23.2 Complete browser command inventory

All methods below are properties of `window.webrevPresentationSettings`. Getters return detached values unless noted. Mutators are synchronous, silently ignore unknown assets/stations where described by source, and do not throw for storage failures. “Persist/event” means the method writes browser state and dispatches the named non-cancelable observation event.

| Method | Parameters and return | Class / effects |
|---|---|---|
| `get` | optional `PresentationSettingKey`; snapshot or scalar | Read. No key returns active station snapshot. |
| `set` | key, `boolean \| number \| string`; snapshot | Mutates, clamps/normalizes, persists settings v3, notifies subscribers and `webrev:presentation-settings`. Unsupported read-only text-plane constants are unchanged. |
| `reset` | optional key; snapshot | Mutates active station toward authored/default values; same publish effects. A full reset does not clear other storage contracts. |
| `subscribe` | listener(snapshot); unsubscribe function | Read subscription; invokes listener immediately, then after settings publication only. |
| `describeSettings` | optional station id; `SettingDescriptor[]` | Read metadata for generated controls. |
| `listAssetLibrary` | none; uploaded asset records | Read global discovered library. |
| `listAssets` | optional station id; asset records | Read assignment, placement, normalized motion, pairing and summarized GLB status. |
| `getAssetStation` | asset name; station id or `null` | Read; only uploaded assets qualify. |
| `setAssetStation` | name, valid station id; void | Persist/event `webrev:asset-station`; invalid input is a no-op. Layouts rebuild through the event listener. |
| `setAssetHemisphere` | name, `front \| back`; void | Persists placement, forces visible, event `webrev:asset-placement`; unknown names can create persisted entries. |
| `setAssetVisible` | name, boolean; void | Persist/event `webrev:asset-placement`. |
| `getAssetMotion` | name; `ObjectMotion \| null` | Read, normalized. |
| `setAssetMotion` | name, motion; void | Known assets only; normalize, persist/event `webrev:asset-motion`. |
| `getAssetFocusAudio` | GLB name; `{track}` or `null` | Read fixed pairing (persisted override then config). |
| `setAssetFocusAudio` | GLB name, `{track?: string}`; void | Persist/event `webrev:asset-focus-audio`; track is not catalog-validated here. |
| `get/set/add/removeAssetTrackExclusion` | name and track(s); `string[]` | Reads or updates catalog-valid unique exclusions; mutators persist/event `webrev:asset-track-exclusions`. |
| `getUnpairedGlbLimit` | optional station; policy | Read station override, then `global`, then range 3–5. |
| `setUnpairedGlbLimit` | policy, optional station; normalized policy | Persist/event `webrev:unpaired-glb-limit`, rebuilds layouts. |
| `get/setRandomGlbDiversityPolicy` | partial policy; policy | Runtime-only mutation/event `webrev:random-glb-diversity-policy`; rebuilds and may reroll. |
| `get/clearRandomGlbSelectionHistory` | none; `string[][]` / void | Session runtime history. Clear does not rebuild immediately. |
| `get/setPlanePreviewPolicy` | optional station / partial policy; policy | Station or global policy; setter persists/event `webrev:plane-preview-policy`. |
| `get/setFallbackSongHistoryWindow` | none / count; integer | Default 4; setter persists scalar v2/event and updates transition history window. |
| `getPlayedTrackHistory` | none; `{recent, played, unheard}` | Read URL-based session history. `unheard` is catalog URLs absent from ledger. |
| `clearPlayedTrackHistory` | none; void | Clears session arrays/set; event `webrev:played-track-history`. Not persisted. |
| `get/setAvoidCurrentPlaneSongsForFallback` | none / boolean; boolean | Default true; persists/event `webrev:avoid-current-plane-songs`. |
| `getFocusPlaylist` | none; `FocusPlaylistEntry[]` | Derived read; one entry per catalog track, fixed pair first, then round-robin GLBs. This is not necessarily the live randomized journey list. |
| `setFocusPlaybackMode` | `zone-cycle \| loop-item`; settings snapshot | Delegates to `set`. |
| `setFocusPlaybackScope` | `station \| all`; settings snapshot | Delegates to `set`. |
| `get/setFocusPlaybackProgram` | program; normalized program | Runtime-only. Setter event `webrev:focus-playback-program`; no storage. |
| `setFocusPlaybackOrder` | `ordered \| random`; program | Runtime-only program patch, same event. |
| `get/setPlaneResidencyPolicy` | policy; policy | Runtime-only; event `webrev:plane-residency-policy`. |
| `get/setPlaneTravelMode` | mode and optional custom id; mode | Runtime-only program patch; event `webrev:plane-travel-mode`. |
| `get/setJourneyMusicEvolution` | partial policy; policy | Runtime-only normalized pools/presets/transitions; event `webrev:journey-music-evolution`. |
| `get/resetCompletedJourneyCount` | none; integer | Runtime-only counter. Reset returns zero and emits no event. |
| `get/setTransitionResourcePolicy` | transition id, policy; policy/null | Runtime-only per-transition policy; setter event `webrev:transition-resource-policy`. |
| `resolveTransitionResource` | transition id; resource id/null | Read with random side effect: exact probabilities are tried in order, then weighted remainder. Records recent selected resources. |
| `travelToPlane` | station id, optional mode/custom id; boolean | Command. False for unknown station or unavailable renderer; otherwise requests travel. |
| `get/setStyleExplorationMode` | none / boolean; boolean | Persists/event `webrev:style-exploration-mode`; enabling also refreshes UI. |
| `get/setJourneyClickStart` | none / boolean; boolean | Default true; persists/event `webrev:journey-click-start`. |
| `saveSettings` | none; style snapshot/null | Requires style exploration; persists ordinary settings and emits `webrev:style-snapshot-ready`. |
| `getStyleSnapshot` | none; object/null | Read generated schema-1 snapshot only when style exploration is enabled. |
| `downloadStyleSnapshot` | none; boolean | Creates and clicks a JSON download; false outside exploration mode. |
| `list/get/set/removeMediaEnvelopeProgram` | program id/program; detached program(s), boolean on remove | Runtime program registry. Set/remove emit `webrev:media-envelope-program-changed`. Removing an active program deactivates it and removes referencing bindings. |
| `list/set/removeMediaEnvelopeBinding` | binding/id; detached binding(s), boolean on remove | Runtime binding registry. Mutators emit `webrev:media-envelope-binding-changed`. |
| `bindSongToMediaEnvelope` | track id, program id, optional binding id; binding | Convenience creator for a `song` trigger binding. |
| `activate/deactivateMediaEnvelope` | program id + optional context / none; boolean / void | Direct generic runtime control. Activation creates the current sphere/tile resources; deactivation disposes them. |
| `getActiveMediaEnvelopeState` | none; `MediaEnvelopeRuntimeState` | Read live resolved radius/origin/tile/cue state. |
| `get/setSpatialEnvelope` | name / name+partial config; config/null or void | Mutator normalizes, persists/event `webrev:spatial-envelope`. |
| `setEnvelopeDebug` | name, visible; void | Convenience envelope patch. |
| `setGlbDebugGlobe` | enabled, optional object; void | Updates/persists settings via publication. |
| `getAssetRuntimeStatus` | uploaded GLB name; status record/null | Read summarized status/attempts/error. |
| `getEditorState` | none; `EditLayerState` | Read clone. |
| `setEditorMode` | `none \| hemisphere`, optional hemisphere; snapshot | Persists settings/event; entering resets preset to top and reposition target. |
| `setEditorCameraPreset` | preset; snapshot | Invalid preset normalizes to top; no-op state change outside hemisphere mode but still publishes. |
| `setRepositionObject` | name/null; snapshot | Sets editor target; copies known placement hemisphere; publishes. |
| `listEditorCameraPresets` | none; `{id,label}[]` | Read four presets. |

### Setting key/value rules

The exact keys are those listed in sections 1 and the source union. Enum normalization is conservative: camera defaults to `locked`, placement to `outside`, context mode to `experience`, playback to `zone-cycle`, scope to `station`; numeric sphere/camera values use the spatial-sphere clamps; volume/restitution use `[0,1]`; padding/fades are nonnegative; text width ≥ 0.2, height ≥ 0.15, offsetY ≥ 0, angle `[-180,180]`. `textPlane.attachment`, `.orientationMode`, `.rotationAxis`, and `.placementSpace` are readable/resettable constants but `set` has no branch for them.

## 23.3 Exact public/semi-public types

```ts
type CameraMode = "locked" | "focus" | "free";
type CameraPlacement = "inside" | "outside";
type AssetHemisphere = "front" | "back";
type GlbRuntimeStatus = "acknowledged" | "loading" | "loaded" | "retrying" | "failed";
type FocusPlaybackMode = "zone-cycle" | "loop-item";
type FocusPlaybackScope = "station" | "all";
type FocusPlaybackOrder = "ordered" | "random";
type PlaneTravelMode = "teleport" | "roller-coaster" | "custom";
type MediaEnvelopeTrigger =
  | {type:"song"; trackId:string}
  | {type:"object-focus"; assetName:string}
  | {type:"station-enter"; stationId:string}
  | {type:"journey-progress"; segmentId:string; gte:number}
  | {type:"event"; eventName:string}
  | {type:"custom"; resolverId:string; options?:Record<string,unknown>};
type MediaEnvelopeMediaSource = {id:string; type:"video"|"image"; src:string; loop?:boolean; muted?:boolean; opacity?:number};
type MediaEnvelopeBinding = {id:string; trigger:MediaEnvelopeTrigger; programId:string; priority?:number};
type MediaEnvelopeProgram = {
  id:string;
  envelope?:{shape?:"sphere"; origin?:{mode?:"focused-object"|"station-center"; offset?:{x:number;y:number;z:number}}; growth?:{mode?:"instant"|"timed"; durationMs?:number; easing?:"linear"|"easeOutCubic"}};
  coverage?:{include?:Array<"current-main-panel"|"next-main-panel">; padding?:number; panelAllowance?:number; minRadius?:number};
  surface?:{side?:"inside"; orientation?:{mode?:"upright-to-world"|"surface-native"}};
  protectedRegions?:Array<{target:"current-main-panel"|"next-main-panel"; mode?:"avoid"; angularRadiusDeg?:number; paddingPx?:number}>;
  layout?:{mode?:"grid"|"hero"|"grid-with-hero"; rows?:number; columns?:number; horizontalArcDeg?:number; verticalArcDeg?:number; gapDeg?:number; tileAngularWidthDeg?:number; tileAngularHeightDeg?:number};
  media?:MediaEnvelopeMediaSource[];
  choreography?:{clock?:"binding"; cues?:Array<Record<string,unknown>>};
};
type MediaEnvelopeRuntimeState = {active:boolean; bindingId?:string; programId?:string; trigger?:Record<string,unknown>; stationId?:string; focusedAssetName?:string; resolvedRadius?:number; origin?:{x:number;y:number;z:number}; clockSeconds?:number; tileCount?:number; tiles?:Array<Record<string,unknown>>; activeCues?:string[]};
type UnpairedGlbCountPolicy = number | "all" | {mode:"range"; min:number; max:number};
type PlanePreviewPolicy = {showGlbs:boolean; maxGlbs:number|"all"; representation?:"glb"|"icon"};
type RandomGlbDiversityPolicy = {avoidWithinRun:boolean; avoidAdjacent:boolean; recentPlaneMultipliers:Record<number,number>};
type PlaneResidencyPolicy = {mode:"cycles"|"songs"|"coverage"; value:number};
type WeightedJourneyResource = {id:string; weight?:number; probability?:number};
type JourneyResourcePool = {id:string; resources:WeightedJourneyResource[]};
type TransitionResourcePolicy = {mode:"inherit"} | {mode:"preset"; resources:string[]} | {mode:"pool"; poolId:string};
type JourneyMusicEvolutionPolicy = {presetJourneys:number; presetSequence:string[]; randomPoolId?:string; pools:JourneyResourcePool[]; transitionPolicies:Record<string,TransitionResourcePolicy>};
type FocusPlaylistEntry = {stationId:string; stationIndex:number; assetName:string; track:string; url:string};
type FocusPlaybackProgram = {scope?:FocusPlaybackScope; order?:FocusPlaybackOrder; sequence?:string[]; residency?:PlaneResidencyPolicy; travelMode?:PlaneTravelMode; customTravelId?:string; pools?:Array<{id:string; assets?:string[]; tracks?:string[]; order?:FocusPlaybackOrder; repeat?:number|"forever"}>};
```

`ObjectMotion` is `{type:"free"}` or `{type:"fixed", fixedMode:"anchored"|"range", range?, behavior?}`; behavior is `none`, `bob`, `sway`, or `orbit` with optional amplitude/speed. Anchored normalizes to `none`; range defaults to 0.8, bob, amplitude `min(range,.35)`, speed .7.

`SpatialEnvelopeConfig` is `{mode:"bounds"|"manual", radius:number|null, scale:number, padding:number, collision:{enabled,restitution,mass,response:"dynamic"|"immovable"|"sensor"}, debug:{visible,opacity}}`. Defaults are bounds/null/1/.05; collision true/.62/1; response follows fixed (`immovable`) versus free (`dynamic`); debug false/.16.

`EditLayerState` is `{mode:"none"}` or `{mode:"hemisphere", hemisphere, cameraPreset, repositionObjectName}`. Presets: `top`, `side`, `bottom-corner-up`, `top-left-down`.

The older pure journey helper additionally exports `JourneyDirection`, `JourneyBoundary`, `JourneyScope`, `JourneyPhase`, `IntermissionStrategy`, `JourneyTarget`, `FocusJourneyConfig`, `JourneyState`, and `JourneyStep`. It is tested but is **not imported by the current renderer**, so its `idle/focus/intermission/travel` machine and explicit-route behavior are semi-public library capability, not live UI behavior.

Core package contracts: `RevisionId`, `HealthState`, `WebRevRevision`, `HealthReport`, `InvariantResult`, `Invariant`, `InspectionDocument`, `DeploymentProvider`, `MediaPanel`, `LinksConfig`, `WebsiteConfigEntry`, and `WebsitesConfig`. Website categories/responsibilities are arrays (non-exclusive); resolution order is explicit route → explicit responsibility providers by priority → broad `cdn` category → `live`. Link targets preserve HTTP(S), protocol-relative, fragment, mailto and tel destinations; other values resolve against the deployment base and unknown keys throw.

## 23.4 Event inventory

All current events use default `bubbles:false`, `composed:false`, and `cancelable:false`, **except** `webrev:custom-plane-travel`, which is cancelable and is the sole extension hook. All others are observations; calling `preventDefault()` has no effect.

| Event | Detail / timing |
|---|---|
| `webrev:webgl-context-lost` / `webrev:webgl-context-restored` | No detail; canvas context lifecycle. Loss handler prevents the native WebGL event default, not this window event. Restore recreates resources. |
| `webrev:asset-runtime-status` | `{id,name,stationId,status,attempts,lastError?}` on GLB acknowledgement/load/retry/failure. |
| `webrev:presentation-settings` | `{stationId,settings}` after settings persistence. |
| `webrev:asset-station`, `asset-motion`, `asset-focus-audio`, `asset-track-exclusions`, `spatial-envelope`, `asset-placement` | Complete corresponding state map after mutation. |
| `webrev:unpaired-glb-limit`, `plane-preview-policy` | Complete persisted policy map. |
| `webrev:random-glb-diversity-policy` | Normalized runtime policy. |
| `webrev:fallback-song-history-window` | `{count}`. |
| `webrev:played-track-history` | `{recent:[],played:[]}` when explicitly cleared. |
| `webrev:avoid-current-plane-songs` | `{enabled}`. |
| `webrev:focus-playback-program` | Normalized runtime program after set/order update. |
| `webrev:plane-residency-policy` | Normalized policy. |
| `webrev:plane-travel-mode` | `{mode,customTravelId}`. |
| `webrev:journey-music-evolution` | Complete normalized policy. |
| `webrev:transition-resource-policy` | `{transitionId,policy}`. |
| `webrev:journey-click-start`, `style-exploration-mode` | `{enabled}`. |
| `webrev:style-snapshot-ready` | Generated snapshot after save. |
| `webrev:custom-plane-travel` | `{fromStationId,toStationId,fromStationIndex,toStationIndex,customTravelId,complete}`. Listener must call `preventDefault()` to claim travel and eventually call `complete()`; otherwise renderer immediately falls back to teleport. |
| `webrev:journey-transition` | `{transitionId,fromStationId,toStationId,completedJourneyCount,resource,policy}` before plane movement. |
| `webrev:journey-completed` | `{completedJourneyCount}` after last→first wrap increments. |
| `webrev:focus-object-step` | `{direction,stationId,objectName,track,journeyIndex,journeyLength}` after manual/automatic step. |
| `webrev:focus-audio-playback-error` | `{assetName,url,message}` on rejected `audio.play()`. |
| `webrev:focus-playlist-track` | `{mode,scope,order,stationId,stationIndex,assetName,track}` after catalog playlist advancement. |
| `webrev:focus-experience-settled` | `{stationId,objectId,objectName,side,textSide}` after 1450 ms focus approach. |
| `webrev:focus-experience-request` | Focus request observation with the selected object/station context. It is not cancelable. |

## 23.5 Persistence contracts and provenance

Malformed JSON is caught and treated as absent. Writes are also swallowed on storage/security/quota failure. Except where stated, stored browser values override authored config/defaults on reload and there is no migration beyond reading the one named legacy key.

| Key | Shape, default, invalidation |
|---|---|
| `webrev:spatial-settings:v3` | `{stations: Record<stationId, PresentationSettingsSnapshot>}`. Per-field parse falls back to station → arrangement → built-in defaults. |
| `webrev:spatial-settings:v2` | Legacy single settings object, read only as fallback for every station when v3 lacks it. |
| `webrev:asset-placement:v3` | `Record<assetName,{hemisphere,visible}>`; default front/true. v3 intentionally invalidated older hidden-state behavior. |
| `webrev:asset-station:v1` | `Record<assetName,stationId>`; invalid/missing assignment falls back to discovered prefix/config inference. |
| `webrev:asset-motion:v1` | `Record<assetName,ObjectMotion>`; stored overrides `config.assetMotion`, then free default. |
| `webrev:asset-focus-audio:v1` | `Record<assetName,{track:string}>`; stored overrides authored pairing. |
| `webrev:asset-track-exclusions:v1` | `Record<assetName,string[]>`; normalized to unique existing catalog names. |
| `webrev:spatial-envelope:v1` | `Record<assetName,SpatialEnvelopeConfig>`; stored entry overrides config and is normalized. |
| `webrev:style-exploration:v1` | string boolean; default false. |
| `webrev:journey-click-start:v1` | string boolean; default true. |
| `webrev:unpaired-glb-limit:v2` | map with `global` or station keys; absent global defaults `{mode:"range",min:3,max:5}`. |
| `webrev:plane-preview-policy:v1` | map of normalized policies; absent station resolves global then `{showGlbs:false,maxGlbs:0,representation:"glb"}`. |
| `webrev:fallback-song-history-window:v2` | scalar numeric string; default 4, floor ≥0. |
| `webrev:avoid-current-plane-songs:v1` | string boolean; default true. |

Runtime-only (not durable): diversity policy/history, played/recent/unheard audio history, playback program, residency/travel policy, journey evolution, transition policies/recent choices, journey counters/cursor, layouts, load status, camera/focus state, and renderer resources.

## 23.6 Authored configuration and asset discovery

The active presentation JSON is schema version 2. Server-side component setup uses `import.meta.glob` to discover 2D (`png,jpg,jpeg,webp,avif,svg`), center (`*-center`), 3D (`glb,gltf`) and music (`mp3,wav,ogg,m4a,aac,flac`) modules. Names are filenames. A discovered asset is assigned to the first station whose `artworkName` is a filename prefix followed by `-`; assets without that match enter the global/unpaired library. Bundled `*-center` assets override a bare configured `centerImage` URL.

Authored top-level inputs currently consumed include `schemaVersion`, title, `rail`, `arrangement`, `stations`, `assetActions`, `assetMotion`, `assetEnvelope`, focus-audio/pairing data, and server-derived `assetsByArtwork`, `assetInventory`, `musicTracks`, `centerImagesByArtwork`, and `resolvedLinks`. Station inputs include stable `id`, `artworkName`, label/theme/text/reveal, display/layer/occlusion, center/main image, plus per-station sphere/camera/viewport/placement/interaction/focusAudio/debug/textPlane overrides. Actions are station, semantic link, raw URL, or text. Semantic links resolve from `config/links.json`; raw action URLs remain an explicitly supported action type.

Provenance order is generally **localStorage → station config → arrangement config → built-in default** for editable settings, while station assignment uses persisted override → discovery inference. Layout positions are generated using the authored seeded arrangement inputs, then mutated by simulation/editor/focus. Random GLB sampling uses `Math.random`, so the `seeded-once` label does not make all selection deterministic.

## 23.7 Coordinates and rendering

* `stationZ(i) = -i * rail.stationSpacing`; `stationCenter(i)` is the image/world center for that station. The station-local origin is therefore the main image center.
* `SceneObject.local` is relative to station center. World position is `stationCenter + local`. `anchor` is local; `camera-midpoint` recomputes an anchor between the camera and image center plus `anchorOffset`.
* Front hemisphere is positive local Z; back is negative. The entire object envelope/model is constrained inside the selected half of the station sphere. Fixed objects are immovable by default; free objects are dynamic.
* Camera world position is derived from current rail `cameraZ`, camera distance/placement, focus offsets or editor pose. Camera space applies translated world coordinates followed by yaw and pitch. Projection produces canvas pixels, positive depth, and perspective scale. `lastScreen` is `{x,y,radius,depth}` from the latest draw and is absent when no screen result was retained.
* Main images are Three.js 5.4×5.9 planes at station center, billboarded to the camera outside editor mode. Text is a separate transparent texture plane positioned in image-relative space with axis-angle rotation about the center horizontal line. GLB groups use world position, scalar `size`, and spin; loaded model bounds/radius feed containment and collision.
* Canvas CSS pixels and renderer pixels differ: Three renderer pixel ratio is capped at 2. Debug snapshot screen values are canvas/CSS coordinates, not device pixels.

## 23.8 Live journey and travel state machine

1. At rest, `arrivingAt` identifies the current/target plane and `arrived()` compares `cameraZ` to `targetZ`.
2. Selecting a visible GLB starts focus interpolation. Translation freezes at `baseLocal`, presentation bob/spin continues, and after 1450 ms focus settles and audio fades in.
3. `zone-cycle` advances when audio ends; `loop-item` loops. The journey list is anchored to the actually focused object and advances object-by-object.
4. At list end, cycle/song/coverage residency decides whether to wrap the current plane or call `continueJourneyToNextPlane`.
5. Plane continuation resolves and announces transition resources, counts a last→first full journey, builds the destination list, stores its first entry as pending, then requests travel.
6. Teleport sets destination immediately. Roller-coaster changes target Z and update moves by `rail.speed * dt`. Custom dispatches the cancelable hook; unclaimed custom travel teleports.
7. On arrival, a pending destination object is found in the current layout and normal `playJourneyEntry` resumes focus/audio. Missing objects simply prevent that focus continuation.

The implementation does not expose a first-class travel enum internally. Deep Debug derives `idle`, `roller-coaster`, or `focus-transition`; it cannot yet distinguish an in-flight claimed custom hook from teleport after the request. The pure `focusJourney.ts` intermission machine is not wired to this live path. “Intermission” in current rendering is transition-resource selection/event metadata, not guaranteed audio playback.

## 23.9 Music resolution precedence

For a focused object, an explicit persisted/configured pairing wins. For an unpaired GLB, candidates begin with the globally unassigned catalog (tracks not fixed to any GLB), remove that object's Track Exclusions, and—when enabled—prefer tracks not already represented on the current plane. Resolution then prefers session-unheard tracks, avoids the recent URL window, and relaxes constraints when a pool empties: allow recently heard, then allow previously heard, then fall back through the broader non-excluded catalog so silence is avoided where possible. Playback records URL in recent history and the session ledger; plane journey tracking records tracks for residency/current-plane avoidance.

Transition resources are separate: `preset` selects by completed-journey position; `pool` first evaluates each resource's clamped exact `probability` in array order, then chooses from remaining resources by nonnegative relative `weight` (default 1), with recent-history avoidance/relaxation. `inherit` uses the evolution preset sequence during the preset journey count, then the configured random pool. Transition lookup supports exact `from->to` and wildcard policies as normalized by source. Exact probability is sequential, not a normalized simultaneous distribution.

Journey prefixes, nested playlists, completion branches, conditional/additive/multiplicative modifiers, guaranteed follow-ups, and the seven-scope precedence (`journey → plane → transition → travel-mode → object → playlist → track`) are **proposed only**. No stable serialized orchestration ABI implements them today.

## 23.10 Random GLB and preview rules

The global unpaired uploaded-GLB pool supplies extras per plane. Count policy is station override → global → random integer 3–5. A number is floored ≥0, `all` uses inventory size, and range endpoints normalize/swap. Sampling is without replacement within one plane. Default diversity prefers no within-run duplicate and adjacent avoidance; recency multipliers are distance 1 = .5 and distance 2 = .8. The weighted sampler multiplies every applicable prior-plane factor with a floor of .0001, so “avoid” is preference rather than an absolute ban when inventory is constrained. Inventory shortage naturally returns fewer than requested; later planes may reuse assets. Selection uses `Math.random`; layout rebuilds can change selections.

Distant planes default to no GLBs. Preview policy can show up to a number or `all`, using `glb` or `icon`; representation `icon` is accepted by the contract, but the current renderer does not provide a complete separate icon resource pipeline. Main image/text visibility has independent renderer logic.

## 23.11 Renderer lifecycle and degradation

GLBs progress through acknowledged/loading/loaded/retrying/failed; attempt/error maps and events make failures observable. Rebuild pruning disposes geometry, materials and textures for no-longer-referenced objects. WebGL loss is prevented, announced, and restoration recreates renderer-held resources. The ordinary 2D canvas/site remains separate from experimental GLB loading. Missing main images use a generated fallback texture; audio autoplay rejection leaves the focus visible and emits a structured error; localStorage failures degrade to in-memory/default behavior; unhandled custom travel degrades to teleport.

# 24. Deep Debug / Agent Introspection API — current v1 foundation

`window.webrevDebug` is a read-only, JSON-serializable facade. It does not expose internal references and has no mutation commands.

```ts
interface WebRevDebugApiV1 {
  readonly schemaVersion: 1;
  getDebugSnapshot(): WebRevDebugSnapshotV1;
  getPlaneDebugState(stationId?: string): object | null;
  getObjectDebugState(nameOrId: string): object | null;
  getJourneyDebugState(): object;
  getRendererDebugState(): object;
  getAudioDebugState(): object;
  getRandomizationDebugState(): object;
  getMediaEnvelopeDebugState(): MediaEnvelopeRuntimeState;
  getGlbSelectionDebugState(stationId?: string): object | null;
}
```

The snapshot currently includes capture time/route/viewport; every plane and its identity/center/navigation flags/preview policy/resource residency/random sample; every layout object with local/world/latest-screen position, size/spin/hemisphere/visibility, motion/anchor/envelope/bounds, focus/audio/exclusion and GLB load/residency data; camera pose/target/arrival; derived travel state; journey cursor/counters/residency/pending entry; audio element and history; randomization policy/history; GLB selection-decision traces; active spatial media-envelope state (binding/program, trigger, resolved origin/radius, tile transforms/opacities and active cues); and renderer counts/context status.

### GLB selection explanation trace

`getGlbSelectionDebugState(stationId?)` returns the current plane's read-only explanation record for randomized GLB population. The same records are available under `getDebugSnapshot().randomization.glbSelectionDecisions`.

Each record includes:

- the resolved unpaired-count policy and target count
- every discovered GLB with its assigned station, saved focus track, pairing state, random-pool eligibility, hemisphere, and visibility
- GLBs assigned to the plane and paired GLBs guaranteed by current semantics
- the global unpaired candidate pool
- prior-plane history used by diversity rules
- candidate sets before diversity filtering, after within-run filtering, after adjacent-plane filtering, and in the fallback pool
- the final randomized GLBs selected for that plane
- a short explanation of the current pairing-to-random-pool rule

This is deliberately observational. It does not reroll, repair, reassign, pair, or otherwise mutate presentation state.

### Current limitations (do not infer these fields)

* Revision/build identity is available from `/.well-known/webrev.json`, not yet joined into the live snapshot.
* “Rendered last frame” means a visible object has a retained `lastScreen`; it is not a frame-numbered GPU draw receipt. Screen bounds are radius-based, not an exact projected GLB box.
* Main-image/text load failures, last context loss/restore timestamps, stale GPU count, travel source/initiator/progress, fade progress, unheard song candidates, song/transition resolver candidate/exclusion traces, authored-vs-storage provenance per field, and custom-travel in-flight state are not yet captured. GLB population selection is now traced separately.
* No `subscribeDebug` exists yet; callers poll or listen to the event inventory. No authorization boundary exists, so the snapshot intentionally excludes secrets and write operations.

### Proposed versioned target (not implemented)

A future schema v2 should add stable `build/revision`, per-value `{value,source}` provenance, frame identity, exact rendered/culling receipts, source/destination/progress/initiator for every travel mode, resolver decision traces, WebGL timestamps/stale resources, and a single `subscribeDebug(listener)` stream. Schema additions must be additive within a version; breaking changes require a new `schemaVersion` and migration notes. Stable IDs—not array indices—must link journey, plane, transition, travel mode, object, playlist and track records. Extension/provider and future WASM boundaries should consume serialized, validated records rather than renderer internals.

# 25. Current versus proposed capability matrix

| Area | Current | Proposed only |
|---|---|---|
| Revision inspection | Static schema-1 endpoint and core invariant | Runtime snapshot join, revision graph, authorized deployment metadata |
| Journey | Live object/plane loop; runtime program/residency/travel controls | Durable nested orchestration and full scoped inheritance |
| Travel | Teleport, rail interpolation, cancelable custom hook | Stable provider interface, effects segments, complete progress telemetry |
| Music | Pairing, exclusions, fallback history, transition probability/weight pools | Nested playlists, conditions/modifiers/branches/explanation ledger |
| Manifest | Presentation schema 2 config plus schema-1 style export | Validated portable import/publish manifest and migrations |
| Rendering | Canvas + isolated Three resources, status events, active spherical media envelopes with curved image/video tiles | Exact frame graph, stale-resource accounting, arbitrary/custom envelope shapes and full environment-volume authoring |
| Debug | Read-only `webrevDebug` schema 1 with GLB population decision traces | Subscription, broader song/transition provenance and decision traces, auth/redaction policy |
| Karaoke/effects | None in live renderer | Portable timed-performance format, warped credit plane, segment effects |

# 26. Known mismatches and technical debt

1. The previous API document omitted the complete event/storage/config/type inventories and the implemented preview, music-evolution and transition-resource APIs; this audit makes them explicit.
2. The live renderer and the pure `focusJourney.ts` helper contain two journey models; the helper is tested but unused by `SpatialPresentation`, creating divergence risk.
3. Runtime types are declared inside one `.astro` script and are not importable declarations; consumers must copy/infer them. Extracting a versioned contract module is the recommended next step.
4. `listAssets()` attempts are aggregated by IDs containing the asset name, whereas `getAssetRuntimeStatus()` uses the same heuristic and Deep Debug can use exact object ID; these summaries can differ for repeated instances.
5. GLB status is published by object but stored partly by asset name and partly by object ID. This prevents perfect per-instance failure inspection.
6. The manifest says `seeded-once`, but random GLB/music choices use `Math.random`; rebuilds are nondeterministic.
7. `representation:"icon"` is accepted without a complete distinct rendering contract.
8. Persistent browser overrides can supersede changed code/config indefinitely; only placement v3 documents intentional invalidation, and there is no user-visible provenance/migration report.
9. Proposed orchestration syntax and seven-scope precedence are not an implementation contract. Current transition pools provide only a small subset.
10. Deep Debug v1 is renderer-local and read-only by design. GLB population now exposes detailed candidate/filter/selection explanations, but subscription, revision join, exact draw receipts, and equivalent song/transition resolver explanations are still missing.

# 27. Source-of-truth map and recommended next step

* Browser API, renderer, configuration normalization, events, persistence, journey/music/random selection: `apps/playground/src/components/SpatialPresentation.astro`.
* Motion, sphere/coordinates, envelope/collision, editor camera, focus composition and legacy journey primitives: `apps/playground/src/lib/*.ts`.
* Authored presentation: `config/presentations/uniqueness-rewarded.json`; semantic navigation: `config/links.json`; origins/responsibilities: `config/websites.json`.
* Generic revision/health/provider/config APIs: `packages/core/src`; Astro route injection: `packages/astro/src`.
* Product intent only: `docs/journey` and `docs/proposals`; these do not override executable source.

**Recommended next implementation:** extract `WebRevDebugSnapshotV1`, browser API types, event-detail map, and normalized orchestration primitives into a small importable versioned contract module; add snapshot contract tests and a debug subscription driven by a single frame/state revision counter. Then add explicit provenance and resolver decision traces before expanding mutation/orchestration syntax. This stabilizes the API/ABI boundary while retaining unlimited upward composition across the seven required scopes.

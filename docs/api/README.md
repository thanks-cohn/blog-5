# WebRev Spatial Presentation API

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

# 7. Track History and Variety

The engine now keeps two distinct history concepts.

## Recent history

A short ordered window used to avoid immediate repetition.

Default:

```
2 tracks
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
- recent-song avoidance window: 2
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


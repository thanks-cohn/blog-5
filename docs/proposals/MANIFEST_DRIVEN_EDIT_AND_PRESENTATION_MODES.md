# Proposal: Manifest-Driven Edit Mode → Presentation Mode

## Status

Proposal for `blog-5` / WebRev spatial presentations.

## Summary

The current browser experience already behaves like an authoring tool: a creator can position GLBs, assign them to planes, pair songs, tune motion, adjust presentation settings, and export Style JSON.

This proposal formalizes that into a two-mode architecture:

1. **Edit Mode** — interactive authoring environment that produces a portable JSON presentation manifest.
2. **Presentation Mode** — read-only runtime that consumes that manifest as the source of truth and recreates the finished experience without relying on browser localStorage.

The intended flow is:

```
Edit Mode
  ↓
configure planes / GLBs / songs / positions / motion / journey rules
  ↓
Save / Export
  ↓
webrev-presentation.json
  ↓
Presentation Mode
  ↓
deterministic portable demo
```

## Problem

Today, several important authoring decisions can live only in browser-local state:

- GLB → plane assignments
- GLB → song pairings
- visibility and hemisphere placement
- motion configuration
- exact object placement
- playback settings
- unpaired GLB limits
- song fallback behavior
- recent-song avoidance window
- click-to-start journey behavior

This is useful while editing, but it is not suitable as the permanent source of truth for a public demo.

A visitor opening the presentation on another browser, phone, private tab, or fresh device should not need the creator's localStorage to reproduce the intended experience.

## Goal

Make every finished WebRev presentation portable, deterministic, shareable, versionable, and deployable through a declarative JSON manifest.

The manifest should describe the experience; the runtime should interpret it.

## Terminology

### Presentation Manifest

A portable JSON document that fully describes one finished presentation.

Suggested canonical name:

`webrev-presentation.json`

Possible type/API name:

`PresentationManifest`

### Edit Mode

Authoring mode.

Features:

- Settings visible
- asset library visible
- plane assignment controls
- GLB positioning
- motion controls
- song pairing
- journey/playback controls
- style exploration
- Save / Export JSON
- optional import/reload of an existing manifest

LocalStorage may be used as temporary editor persistence, but it is not the published source of truth.

### Presentation Mode

Read-only audience mode.

Features:

- consumes a manifest
- no Settings button
- no editor UI
- no authoring overlays
- no dependency on localStorage
- uses manifest placements and pairings
- preserves intended journey behavior
- retains only presentation-authored text, such as text positioned beneath the plane image

## Core Principle

**Edit Mode writes the experience. Presentation Mode reads the experience.**

The engine should not require hardcoded logic for individual planes such as `first-light`, `blue-room`, or `rose-archive`.

New planes should inherit the same generic runtime behavior automatically.

## Proposed Manifest Shape

Illustrative only; exact schema can evolve.

```json
{
  "schemaVersion": 1,
  "kind": "webrev-presentation",
  "id": "our-story-demo",
  "mode": "presentation",

  "ui": {
    "showSettings": false,
    "showEditor": false,
    "showRuntimeDebug": false,
    "showExtraChrome": false
  },

  "journey": {
    "startOnClick": true,
    "advanceToNextPlaneAfterAllSongs": true,
    "recentSongAvoidance": 2,
    "unpairedGlbLimit": 4
  },

  "planes": [
    {
      "id": "first-light",
      "image": "first-light-center.jpg",
      "text": {
        "title": "",
        "body": "The text shown beneath this image."
      },

      "assets": [
        {
          "name": "pug.glb",
          "visible": true,
          "hemisphere": "front",
          "position": {
            "x": 1.2,
            "y": 0.4,
            "z": 2.1
          },
          "size": 0.8,
          "spin": 0.25,
          "song": "our-spot.mp3",
          "motion": {
            "type": "fixed"
          }
        },

        {
          "name": "gingy.glb",
          "visible": true,
          "hemisphere": "front",
          "position": {
            "x": -1.5,
            "y": 0.7,
            "z": 1.8
          },
          "song": null,
          "motion": {
            "type": "free"
          }
        }
      ]
    }
  ]
}
```

## Source-of-Truth Priority

### Edit Mode

Suggested priority:

1. currently edited state
2. imported presentation manifest, if one was loaded
3. repository defaults
4. localStorage recovery state

The creator may Save/Export the current resolved state at any time.

### Presentation Mode

Suggested priority:

1. selected presentation manifest
2. safe engine defaults only when a manifest field is intentionally omitted

LocalStorage should not silently override the manifest.

This is important because a presentation URL should render the same intended experience for every visitor.

## JSON Must Capture

At minimum:

### Presentation metadata

- schema version
- presentation ID
- title
- optional description
- creation/export timestamp

### Plane definitions

- plane ID
- label
- image
- authored text
- ordering
- rail/journey relationship

### Assets

- GLB/image filename or asset ID
- plane assignment
- visibility
- hemisphere
- exact position
- size/scale
- spin/orientation where applicable
- motion configuration
- envelope/collision behavior
- any future effects configuration

### Music

- explicit GLB → song pairing
- unpaired GLBs
- unassigned-song pool behavior
- playback order/program
- playback scope
- volume/fades
- loop rules

### Journey rules

- click-to-start on/off
- right-click Play behavior
- object/song traversal
- next-plane transition
- auto-start behavior after arrival
- roller-coaster routing
- song-history fallback window
- number of unpaired GLBs allowed per plane
- future sequencing/pool rules

### Camera / spatial configuration

- sphere dimensions
- camera mode
- camera placement/distance
- viewport rules
- text-plane placement
- any presentation-specific camera settings

## Song Behavior Preservation

The manifest should capture current intended rules.

### Paired GLB

A paired GLB normally plays its paired song.

A user may explicitly choose another song from the experience right-click menu for a temporary play override.

### Unpaired GLB

An unpaired GLB selects from the globally unassigned-song pool.

Before selection:

1. read the last `N` songs actually played
2. remove those songs from fallback eligibility
3. choose from the remaining unassigned-song pool
4. if all unassigned songs are excluded, gracefully relax within that unassigned pool

Default:

```
recentSongAvoidance = 2
```

The API may increase or decrease `N`.

## API Direction

Suggested API surface:

```ts
type PresentationRuntimeMode = "edit" | "presentation";

interface WebRevPresentationApi {
  getRuntimeMode(): PresentationRuntimeMode;
  setRuntimeMode(mode: PresentationRuntimeMode): void;

  exportPresentationManifest(): PresentationManifest;
  loadPresentationManifest(manifest: PresentationManifest): void;
  validatePresentationManifest(manifest: unknown): ManifestValidationResult;

  getRecentSongAvoidance(): number;
  setRecentSongAvoidance(count: number): number;

  getUnpairedGlbLimit(stationId?: string): number;
  setUnpairedGlbLimit(count: number, stationId?: string): number;
}
```

Future additions may include:

```ts
loadPresentationManifestFromUrl(url)
resetToManifest()
compareCurrentStateToManifest()
getDirtyState()
```

## Presentation Mode UI Contract

When `mode = "presentation"`:

Hidden by default:

- Settings
- Style exploration tools
- asset picker
- pairing controls
- editor camera controls
- debug controls
- authoring-only explanatory text
- development/status chrome

Still visible:

- plane artwork
- authored text intentionally belonging to the plane
- GLBs / 2D objects
- journey controls that are part of the audience experience
- focus overlay when required
- presentation-authored effects

The intention is that Presentation Mode feels like the artwork/demo itself rather than an editor.

## Asset Resolution

Manifest entries should identify assets independently of historical filename conventions.

Legacy prefixes such as:

`first-light-*.glb`

may remain useful as import hints only.

They must not be required by Presentation Mode.

Preferred architecture:

```
global asset library
    ↓
manifest plane assignment
    ↓
runtime scene
```

This ensures every future plane automatically receives the same capabilities.

## Editing Workflow

### Create

1. Open presentation in Edit Mode.
2. Add/select uploaded assets from the global library.
3. Move assets onto desired planes.
4. position and style them.
5. pair songs where desired.
6. configure fallback/journey behavior.
7. test the journey.
8. Save.
9. Export manifest JSON.

### Reopen

1. Open Edit Mode.
2. Import/load an existing manifest.
3. Runtime reconstructs the authored state.
4. Continue editing.
5. Export a new version.

### Publish

1. Commit or otherwise host the chosen manifest.
2. Presentation URL specifies which manifest to load.
3. Runtime enters Presentation Mode.
4. Visitors receive the same authored experience without editor-local state.

## URL / Demo Direction

Possible future routing:

```
/uniqueness-rewarded?presentation=our-story
```

resolves to:

```
/presentations/our-story.json
```

Alternative explicit route:

```
/presentations/our-story
```

The engine remains shared; only the manifest changes.

## Repository Layout

Suggested:

```
apps/playground/
  src/
  presentations/
    our-story.json
    wedding-demo.json
    gallery-demo.json
```

or:

```
public/
  presentations/
    our-story.json
```

Final path should follow whichever asset-loading strategy produces the cleanest static Pages deployment.

## Validation

Presentation manifests should be schema-validated before use.

Validation should catch:

- missing plane IDs
- references to nonexistent assets
- references to nonexistent songs
- invalid positions/scales
- invalid runtime modes
- duplicate IDs
- unsupported schema versions
- malformed playback programs

Presentation Mode should fail gracefully rather than partially inventing configuration.

## Versioning

Every manifest carries:

```json
{
  "schemaVersion": 1
}
```

Future engine changes should use migration/normalization functions rather than silently breaking old demos.

Goal:

A presentation authored today should remain reproducible later.

## Relationship to Current Style JSON

The existing Style Exploration snapshot is the beginning of this architecture.

Recommended evolution:

```
Style Snapshot
    ↓
normalize / formalize
    ↓
PresentationManifest
```

The current snapshot already contains valuable pieces:

- assetStations
- assetFocusAudio
- assetPlacement
- assetMotion
- spatialEnvelope
- stationSettings
- playback program
- unpaired GLB limits
- journey click-start
- object positions

Rather than discard this work, the presentation manifest should formalize and stabilize it.

## Backward Compatibility

LocalStorage remains useful for:

- autosave
- recovery
- unsaved editor experimentation
- personal editor preferences

But localStorage should no longer define a published presentation.

Old filename routing remains useful for:

- initial import
- legacy project migration

But filenames should no longer determine the finished presentation structure.

## New Plane Guarantee

A major acceptance condition:

> Adding a fourth, fifth, or hundredth plane must not require duplicating special-case asset, pairing, picker, or playback code.

A new plane supplied through the manifest should automatically support:

- global asset selection
- GLB placement
- visibility
- movement
- song pairing
- unpaired fallback songs
- recent-history avoidance
- journey traversal
- roller-coaster transition
- presentation-mode rendering

## Acceptance Criteria

The proposal is successfully implemented when:

1. A creator can configure a presentation entirely in Edit Mode.
2. Save/Export produces one valid portable JSON manifest.
3. A clean browser with empty localStorage can load that manifest.
4. The clean browser reconstructs the same planes, GLBs, positions, pairings, motion, and journey behavior.
5. Presentation Mode contains no Settings/editor UI.
6. Presentation Mode preserves authored plane text.
7. Filename prefixes are not required for assets already represented by the manifest.
8. Paired GLBs retain their paired songs.
9. Unpaired GLBs use the unassigned-song fallback/history rules.
10. Recent-song avoidance `N` is configurable.
11. New planes inherit all generic functionality without plane-specific code.
12. Manifest validation prevents malformed presentations from silently producing undefined behavior.

## Suggested Implementation Phases

### Phase 1 — Formalize schema

- define `PresentationManifest`
- map current Style JSON into it
- add validation
- add export API

### Phase 2 — Manifest import

- load JSON
- hydrate plane state
- hydrate placement
- hydrate pairings
- hydrate playback rules
- rebuild layouts once after hydration

### Phase 3 — Presentation Mode

- runtime mode switch
- hide authoring UI
- ignore localStorage overrides
- render solely from manifest + safe defaults

### Phase 4 — Demo routing

- hosted manifests
- URL-selected presentations
- multiple demos from one engine

### Phase 5 — Durable migration/versioning

- schema migrations
- old manifest compatibility
- import diagnostics
- optional diff/current-dirty-state tooling

## Design Principle

The engine should become analogous to a media player:

**the engine is the player; the manifest is the presentation.**

Creators manipulate the experience visually in Edit Mode, export the resulting declarative description, and Presentation Mode faithfully performs that description anywhere.

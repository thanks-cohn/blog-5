# Proposal: General Spatial Media Envelopes and Choreographed Surface Media

Status: Full proposal  
Initial consumer: `uniqueness-rewarded` in `blog-5`  
Initial trigger: active song during focused-object playback  
Architecture goal: generic enough to bind to any future trigger without redesign

---

## 1. Purpose

This proposal defines a general **Spatial Media Envelope** system for WebRev spatial presentations.

A Spatial Media Envelope is a temporary or persistent 3D surface/volume that can host images, MP4/WebM video, GIFs, animated images, generated visuals, shaders, or future media types. The first implementation is an inward-facing sphere whose inner surface becomes a curved media stage around the viewer.

The first project use is deliberately specific:

- a focused object is active;
- a specific song resolves;
- that song activates a media-envelope program;
- a sphere grows outward from the focused object;
- the sphere becomes large enough to encompass both the current plane composition and the following plane composition, with breathing room;
- media appears on the sphere's concave interior surface;
- the current and next main center panels remain unobscured;
- media initially appears in an evenly spaced, watchable grid/checkerboard-like formation;
- timed cues can make one media item grow dramatically while the others fade, shrink, retreat, or disappear.

The **runtime contract must not be song-specific**. Song binding is only the first trigger adapter.

The long-term model is:

```text
trigger
  ↓
binding
  ↓
media-envelope program
  ↓
geometry + protected regions + layout + choreography
```

A trigger may later be:

- a song;
- an object;
- a plane arrival;
- a journey-segment progress threshold;
- a timestamp;
- a user click;
- a route event;
- an animation cue;
- a custom runtime event;
- a future external signal.

---

## 2. Core Design Principle

The engine should expose **general primitives** and let projects compose them.

Do not build:

```text
SongSphere
```

Build:

```text
SpatialMediaEnvelope
+
MediaEnvelopeBinding
+
MediaEnvelopeProgram
```

Then this project can say:

```text
when track X plays
→ activate program Y
```

without making music a permanent requirement of the system.

---

## 3. Terminology

### Spatial Media Envelope

The overall spatial surface/volume and its lifecycle.

Initial shape:

```text
sphere
```

Future shapes may include:

- ellipsoid;
- capsule;
- tunnel;
- ribbon;
- cylinder;
- dome;
- warped plane;
- spline surface;
- custom mesh;
- procedural surface.

### Media Surface

The renderable surface on which media appears.

For a sphere, the media surface is the **inside shell**.

### Media Tile

One media item attached to or mapped onto the surface.

A tile may contain:

- MP4;
- WebM;
- GIF;
- animated WebP;
- image;
- image sequence;
- future live canvas;
- procedural shader;
- generated texture;
- custom media provider.

### Protected Region

A region that media must not visually obscure.

For the first project:

- current plane main center image;
- next plane main center image.

### Layout

The rule determining how tiles occupy the envelope.

Initial modes:

- `grid`;
- `hero`;
- `grid-with-hero`.

### Choreography

Time-based or event-based transformations of the envelope and its tiles.

Examples:

- grow tile;
- shrink tile;
- fade tile;
- hide tile after threshold;
- restore grid;
- change spacing;
- change opacity;
- change layout;
- swap media;
- change envelope size;
- future morph between shapes.

---

## 4. First Project Behavior

For `uniqueness-rewarded`, the intended first behavior is:

1. visitor clicks a 3D object;
2. focus mode begins;
3. the object's resolved song becomes active;
4. if that song has a media-envelope binding, the bound program activates;
5. a sphere begins at the focused object's spatial anchor;
6. the sphere grows until it contains:
   - the current plane main composition region;
   - the following plane main composition region;
   - configurable extra padding;
7. the camera views media on the **concave inner surface** of the sphere;
8. media is arranged in an evenly spaced grid-like formation;
9. each tile conforms to sphere curvature;
10. each tile's visual bottom remains upright relative to world ground so it stays watchable;
11. tile placement avoids protected current/next center-panel view regions;
12. at authored moments, one media tile may grow into a large hero;
13. neighboring or secondary tiles may fade, shrink, or disappear after authored thresholds;
14. when the song/focus/program ends, the envelope exits according to its lifecycle rule.

---

## 5. Geometry and Envelope Sizing

### 5.1 Origin

Initial origin rule:

```json
{
  "origin": {
    "mode": "focused-object",
    "offset": { "x": 0, "y": 0, "z": 0 }
  }
}
```

Future origin modes may include:

- current plane center;
- next plane center;
- midpoint between planes;
- camera;
- explicit world/station coordinate;
- named object;
- custom resolver.

### 5.2 Required coverage

The first project requires the sphere volume to contain both the current and following plane's important visual regions.

Conceptually:

```text
requiredRadius =
  maximum distance from sphere origin
  to every required protected/composition bound
  + padding
```

The engine should derive this from actual world-space bounds rather than a fixed magic radius.

### 5.3 Bounds contract

A region provider should expose world-space bounds.

Illustrative type:

```ts
type SpatialBounds = {
  center: { x: number; y: number; z: number };
  halfExtents: { x: number; y: number; z: number };
};
```

A media-envelope program can request semantic bounds:

```json
{
  "coverage": {
    "include": [
      "current-main-panel",
      "next-main-panel"
    ],
    "padding": 3
  }
}
```

Future include targets may be:

- current plane;
- next plane;
- object;
- camera frustum region;
- named group;
- journey segment;
- custom bounds provider.

### 5.4 Growth

Envelope growth is separate from final radius resolution.

Example:

```json
{
  "growth": {
    "mode": "timed",
    "durationMs": 1200,
    "easing": "easeOutCubic"
  }
}
```

Supported initial modes:

- `instant`;
- `timed`;
- `ease-out`;
- `spring`.

---

## 6. Concave / Inward-Facing Rendering

The initial sphere is viewed from the inside.

The camera should perceive media wrapping around it like a curved theater or dome.

The media is therefore not a set of unrelated flat planes floating near an invisible sphere.

The media must visually conform to the sphere surface.

Implementation options include:

- inward-facing sphere geometry with UV regions;
- back-side rendering;
- curved segment meshes;
- tessellated tile meshes projected to the sphere;
- future shader-driven projection.

For v1, **independent curved tile meshes** are recommended.

Why:

- each tile can move independently;
- each tile can grow independently;
- each tile can disappear independently;
- tile spacing is straightforward;
- protected-region avoidance is easier;
- future crowding is easier;
- future non-spherical envelopes can reuse the same conceptual tile contract.

---

## 7. Surface Coordinates

Each tile should resolve to a stable position on the envelope surface.

For a sphere, useful coordinates are:

```ts
type SphericalSurfaceCoordinate = {
  azimuthDeg: number;
  elevationDeg: number;
};
```

The engine resolves that coordinate into a world-space patch on the sphere.

A tile may also have:

- angular width;
- angular height;
- local scale;
- depth offset from shell;
- local rotation;
- opacity;
- z-order / priority.

Example:

```json
{
  "surface": {
    "azimuthDeg": -24,
    "elevationDeg": 16,
    "angularWidthDeg": 18,
    "angularHeightDeg": 11
  }
}
```

---

## 8. Grid / Checkerboard Layout

The first multi-media formation should be regular and visually calm.

The desired effect is a grid/checkerboard-like field with even spacing on the sphere's interior.

Illustrative configuration:

```json
{
  "layout": {
    "mode": "grid",
    "distribution": "spherical-bands",
    "rows": 3,
    "columns": 5,
    "horizontalArcDeg": 150,
    "verticalArcDeg": 90,
    "gapDeg": 5
  }
}
```

The layout resolver should:

1. establish an allowed visible surface region;
2. divide it into stable cells;
3. remove or shift cells that conflict with protected regions;
4. assign media items to remaining cells;
5. preserve even spacing as much as possible;
6. keep deterministic ordering unless randomization is requested.

Future layout modes:

- hex-like;
- rings;
- Fibonacci sphere;
- seeded scatter;
- authored coordinates;
- camera-weighted;
- content-weighted;
- custom plugin resolver.

---

## 9. Watchable Orientation

A tile may be curved to the sphere while still having a semantic "up" and "bottom."

For this project, the default rule is:

> The visual bottom of every media item should remain perpendicular/upright relative to world ground.

This prevents the grid from twisting around the sphere in ways that make video unpleasant to watch.

Illustrative configuration:

```json
{
  "orientation": {
    "mode": "upright-to-world",
    "worldUp": [0, 1, 0],
    "allowSurfaceCurvature": true
  }
}
```

Interpretation:

- the patch conforms to the sphere;
- the image/video is still curved;
- its local vertical direction is stabilized against world up;
- the tile does not arbitrarily roll because of spherical coordinates.

Future modes:

- `surface-native`;
- `upright-to-world`;
- `upright-to-camera`;
- `billboard`;
- `authored-angle`;
- `custom`.

---

## 10. Protected Regions

Protected regions are mandatory for the initial project.

Media must not obscure:

- the current main center image;
- the next main center image.

This should be solved as a composition constraint, not by placing an opaque mask over the media after the fact.

### 10.1 View-aware protection

The important property is what the camera sees.

Therefore the runtime should support protected regions derived from projected screen bounds.

Conceptually:

```text
world bounds
  ↓
project into current camera
  ↓
expand by screen-space padding
  ↓
mark corresponding surface directions as unavailable
```

### 10.2 Protection modes

Initial modes:

- `avoid` — do not place tiles there;
- `fade-near` — fade tiles approaching region;
- `clip` — clip surface rendering from region.

For this project, default should be `avoid`.

Example:

```json
{
  "protectedRegions": [
    {
      "target": "current-main-panel",
      "mode": "avoid",
      "paddingPx": 48
    },
    {
      "target": "next-main-panel",
      "mode": "avoid",
      "paddingPx": 48
    }
  ]
}
```

---

## 11. Media Sources

The system should distinguish **media identity** from **layout identity**.

Example media catalog:

```json
{
  "media": [
    {
      "id": "memory-a",
      "type": "video",
      "src": "media/memory-a.mp4",
      "loop": true,
      "muted": true
    },
    {
      "id": "memory-b",
      "type": "gif",
      "src": "media/memory-b.gif"
    },
    {
      "id": "portrait-c",
      "type": "image",
      "src": "media/portrait-c.webp"
    }
  ]
}
```

Initial supported source types should be kept small:

- `video`;
- `image`;
- animated image where browser support already handles it.

A source registry should make future providers possible without changing layout code.

---

## 12. Choreography Timeline

Each envelope program may define timed cues.

The time source for the first implementation is the active song's playback time.

The timeline itself should be generic enough to use other clocks later.

Example:

```json
{
  "timeline": [
    {
      "at": 0,
      "action": "show-layout",
      "layout": "grid"
    },
    {
      "at": 18.5,
      "action": "promote",
      "mediaId": "memory-b",
      "targetScale": 3.4,
      "durationMs": 1700
    },
    {
      "at": 19.1,
      "action": "fade-others",
      "except": ["memory-b"],
      "when": {
        "source": "media-scale",
        "mediaId": "memory-b",
        "gte": 1.7
      },
      "durationMs": 700
    }
  ]
}
```

This supports the desired transition:

```text
grid visible
    ↓
one tile begins growing
    ↓
tile crosses threshold
    ↓
other tiles fade/disappear
    ↓
hero tile dominates
```

### Timeline actions for v1

- `show`;
- `hide`;
- `fade`;
- `scale`;
- `promote`;
- `show-layout`;
- `set-opacity`;
- `restore-layout`.

Future actions:

- move;
- crowd;
- push-neighbors;
- replace media;
- envelope resize;
- envelope morph;
- shader transition;
- split;
- merge;
- ripple;
- wave;
- audio-reactive transforms.

---

## 13. Threshold-Based Behavior

Not every transition should depend only on a timestamp.

The proposal should support simple state thresholds.

Example:

```json
{
  "when": {
    "source": "media-scale",
    "mediaId": "hero",
    "gte": 0.68
  },
  "action": "hide-others"
}
```

Threshold sources may later include:

- scale;
- opacity;
- envelope radius;
- journey progress;
- audio amplitude;
- beat phase;
- camera distance;
- arbitrary custom runtime values.

This is important because the user's desired transition is semantic:

> when one image becomes large enough, the others should disappear.

That should not require guessing the exact millisecond forever.

---

## 14. Hero Media

The system should explicitly support a dominant media state.

A hero is not a separate media type.

It is a role/state applied to an existing tile.

Example:

```json
{
  "hero": {
    "mediaId": "memory-b",
    "scale": 3.5,
    "centerPolicy": "best-visible-region",
    "respectProtectedRegions": true
  }
}
```

A hero may:

- grow along the curved surface;
- expand across multiple former grid cells;
- remain curved;
- preserve its aspect ratio;
- avoid protected panels;
- reduce surrounding media visibility.

Future versions may allow hero media to deform the envelope itself.

---

## 15. Future Crowding and Surface Competition

A later version should allow media items to compete for surface area.

Conceptually:

```text
tile grows
  ↓
requests more surface territory
  ↓
neighboring tiles shrink / move / disappear / get pushed
```

Potential policy:

```json
{
  "surfaceCompetition": {
    "mode": "crowd",
    "priority": "hero-first",
    "overflow": "hide-lowest-priority"
  }
}
```

Possible overflow behaviors:

- shrink;
- move;
- stack;
- fade;
- hide;
- push along surface;
- move behind camera;
- custom.

This is intentionally future scope, but the v1 data model should not make it impossible.

---

## 16. Generic Trigger and Binding Layer

This is the architectural point that prevents the feature from becoming song-specific.

### 16.1 Binding

```ts
type MediaEnvelopeBinding = {
  id: string;
  trigger: MediaEnvelopeTrigger;
  programId: string;
  priority?: number;
};
```

### 16.2 Trigger

Illustrative trigger union:

```ts
type MediaEnvelopeTrigger =
  | { type: "song"; trackId: string }
  | { type: "object-focus"; assetName: string }
  | { type: "station-enter"; stationId: string }
  | { type: "journey-progress"; segmentId: string; gte: number }
  | { type: "time"; clockId: string; atSeconds: number }
  | { type: "event"; eventName: string }
  | { type: "custom"; resolverId: string; options?: Record<string, unknown> };
```

The first implementation only needs `song`.

The API shape should nevertheless live above the song resolver.

### 16.3 Program

```ts
type MediaEnvelopeProgram = {
  id: string;
  envelope: MediaEnvelopeGeometry;
  coverage?: MediaEnvelopeCoverage;
  surface: MediaSurfacePolicy;
  protectedRegions?: ProtectedRegionPolicy[];
  media: MediaSource[];
  layout: MediaLayout;
  choreography?: MediaChoreography;
  lifecycle?: MediaEnvelopeLifecycle;
};
```

---

## 17. Lifecycle

A clean lifecycle is required.

### Inactive

No media-envelope resources are resident except optionally preloaded media.

### Activating

- binding matches trigger;
- program resolves;
- required spatial bounds resolve;
- envelope radius resolves;
- media resources begin/resume loading;
- envelope grows/fades in.

### Active

- tiles are placed;
- protected-region constraints are updated;
- choreography clock advances;
- tile media plays.

### Transitioning

- layout changes;
- hero promotion occurs;
- tiles fade/hide;
- future envelope morphing may occur.

### Deactivating

Triggered by:

- song end;
- focus end;
- trigger no longer valid;
- explicit program cue;
- new higher-priority envelope replacing it.

### Inactive again

Video playback pauses/stops according to resource policy and meshes are released or pooled.

---

## 18. Clock Abstraction

Even though the initial choreography is synchronized to a song, timeline code should depend on a generic clock interface.

Illustrative:

```ts
type PerformanceClock = {
  id: string;
  nowSeconds(): number;
  durationSeconds?(): number | null;
};
```

Initial clock adapter:

```text
audio element currentTime
```

Future clocks:

- journey progress;
- wall time;
- video time;
- animation timeline;
- custom event clock.

This keeps choreography reusable outside music.

---

## 19. Example Initial Project Configuration

Illustrative only:

```json
{
  "mediaEnvelopePrograms": [
    {
      "id": "memory-sphere-one",
      "envelope": {
        "shape": "sphere",
        "origin": {
          "mode": "focused-object"
        },
        "growth": {
          "mode": "timed",
          "durationMs": 1200,
          "easing": "easeOutCubic"
        }
      },
      "coverage": {
        "include": [
          "current-main-panel",
          "next-main-panel"
        ],
        "padding": 3
      },
      "surface": {
        "side": "inside",
        "orientation": {
          "mode": "upright-to-world"
        }
      },
      "protectedRegions": [
        {
          "target": "current-main-panel",
          "mode": "avoid",
          "paddingPx": 48
        },
        {
          "target": "next-main-panel",
          "mode": "avoid",
          "paddingPx": 48
        }
      ],
      "layout": {
        "mode": "grid",
        "distribution": "spherical-bands",
        "rows": 3,
        "columns": 5,
        "gapDeg": 5
      },
      "media": [
        {
          "id": "clip-a",
          "type": "video",
          "src": "media/clip-a.mp4",
          "loop": true,
          "muted": true
        },
        {
          "id": "clip-b",
          "type": "video",
          "src": "media/clip-b.mp4",
          "loop": true,
          "muted": true
        },
        {
          "id": "still-c",
          "type": "image",
          "src": "media/still-c.webp"
        }
      ],
      "choreography": {
        "clock": "binding",
        "cues": [
          {
            "at": 0,
            "action": "show-layout",
            "layout": "grid"
          },
          {
            "at": 18.5,
            "action": "promote",
            "mediaId": "clip-b",
            "targetScale": 3.4,
            "durationMs": 1700
          },
          {
            "at": 18.5,
            "action": "fade-others",
            "except": ["clip-b"],
            "when": {
              "source": "media-scale",
              "mediaId": "clip-b",
              "gte": 1.7
            },
            "durationMs": 700
          }
        ]
      }
    }
  ],
  "mediaEnvelopeBindings": [
    {
      "id": "song-memory-sphere-one",
      "trigger": {
        "type": "song",
        "trackId": "example-song.mp3"
      },
      "programId": "memory-sphere-one"
    }
  ]
}
```

The important split is:

```text
program defines WHAT happens
binding defines WHEN/WHY it activates
```

---

## 20. Runtime API Direction

Suggested program API:

```ts
listMediaEnvelopePrograms(): MediaEnvelopeProgram[];
getMediaEnvelopeProgram(id: string): MediaEnvelopeProgram | null;
setMediaEnvelopeProgram(program: MediaEnvelopeProgram): void;
removeMediaEnvelopeProgram(id: string): void;
```

Suggested binding API:

```ts
listMediaEnvelopeBindings(): MediaEnvelopeBinding[];
setMediaEnvelopeBinding(binding: MediaEnvelopeBinding): void;
removeMediaEnvelopeBinding(id: string): void;
resolveMediaEnvelopeBindings(event: MediaEnvelopeTriggerEvent): MediaEnvelopeBinding[];
```

Suggested runtime control API:

```ts
activateMediaEnvelope(programId: string, context?: object): void;
deactivateMediaEnvelope(id?: string): void;
getActiveMediaEnvelopeState(): MediaEnvelopeRuntimeState | null;
```

Suggested future custom hooks:

```ts
registerMediaEnvelopeTriggerResolver(id, resolver);
registerMediaEnvelopeShape(id, shapeProvider);
registerMediaSurfaceLayout(id, layoutProvider);
registerMediaSourceProvider(id, provider);
registerMediaEnvelopeAction(id, actionHandler);
```

Do not require these plugin points in v1. Preserve the architecture so they can be added without rewriting authored content.

---

## 21. Debug / Inspection Contract

This system must be inspectable from the beginning.

Suggested debug state:

```ts
type MediaEnvelopeDebugState = {
  active: boolean;
  bindingId?: string;
  programId?: string;
  trigger?: object;
  clockSeconds?: number;
  shape?: string;
  origin?: Vec3;
  resolvedRadius?: number;
  requiredBounds?: object[];
  protectedRegions?: object[];
  tileCount?: number;
  tiles?: Array<{
    mediaId: string;
    visible: boolean;
    surfaceCoordinate: object;
    scale: number;
    opacity: number;
    hero: boolean;
    excludedBy?: string[];
  }>;
  activeCues?: string[];
};
```

A future debug API should expose something like:

```js
webrevDebug.getMediaEnvelopeDebugState()
```

Important questions it should answer:

- Why did this envelope activate?
- Which binding matched?
- Which program is active?
- Which clock is driving it?
- How was radius calculated?
- Which bounds had to fit?
- Which media tiles were rejected because of protected regions?
- Which cue caused a tile to grow or disappear?

This follows WebRev's existing observability principle: if the runtime knows, agents should not have to infer it.

---

## 22. Performance Requirements

The first implementation should remain low-end friendly.

Recommended constraints:

- only create envelope geometry while active;
- reuse/pool curved tile geometry when possible;
- avoid decoding every media file simultaneously;
- preload only the next likely program where practical;
- pause videos that are invisible;
- avoid one video texture per invisible/occluded tile;
- cap simultaneously playing video textures by project policy;
- allow image fallback/poster frames;
- respect reduced-motion and future low-power modes;
- do not block the ordinary presentation if media decoding fails.

The presentation must remain navigable if:

- a video fails to load;
- a GIF fails;
- a codec is unsupported;
- GPU resources are constrained.

Failure should degrade to missing tile/poster/skip, not a broken ride.

---

## 23. Resource Policy

Media programs should be able to describe loading behavior.

Example:

```json
{
  "resources": {
    "preload": "next-bound-program",
    "inactiveVideo": "pause",
    "hiddenVideo": "pause",
    "releaseAfterMs": 30000,
    "maxActiveVideoTextures": 6
  }
}
```

These numbers remain project policy, not universal engine constants.

---

## 24. First Implementation Scope

The first implementation should deliberately stay small.

### Must support

- generic program registry;
- generic binding registry;
- `song` trigger adapter;
- sphere envelope;
- focused-object origin;
- computed radius enclosing current + next main-panel regions;
- configurable padding;
- inward-facing surface;
- curved tile meshes;
- image and MP4/WebM media;
- even grid layout;
- upright-to-world tile orientation;
- protected current/next panel regions;
- song-time choreography clock;
- grow/promote one tile;
- fade/hide other tiles at time or threshold;
- teardown on song/focus end;
- debug snapshot of active state.

### Explicitly defer

- arbitrary custom envelope meshes;
- physics-driven crowding;
- complex surface packing;
- beat detection;
- audio spectrum analysis;
- live external streams;
- multiple simultaneous envelopes;
- envelope-to-envelope collision;
- fully visual editor;
- procedural shaders;
- user-authored scripting.

---

## 25. Acceptance Criteria for v1

The first implementation is successful when:

1. a configured song can activate a sphere without modifying generic focus logic;
2. the sphere originates from the focused object;
3. its resolved radius contains the configured current and next plane composition bounds plus padding;
4. media is rendered on the inner curved surface;
5. media appears evenly spaced in the initial grid mode;
6. tiles remain visually upright relative to world ground;
7. current and next main center panels remain visible and are not obscured by media tiles;
8. a timed cue can grow one media tile dramatically;
9. other tiles can fade or disappear when that hero crosses an authored threshold;
10. the envelope cleans up when the binding ends;
11. media failure does not break the presentation;
12. debug state explains the binding, radius, tiles, exclusions, and active cues;
13. the same program can later be activated through a non-song trigger without redesigning the program schema.

---

## 26. Future Direction

The long-term goal is a general spatial-performance API.

A future creator should be able to express:

```text
When anything happens,
activate any spatial media program,
on any envelope shape,
using any media source,
with any layout,
driven by any clock,
and choreograph it through composable actions.
```

Examples:

- a song summons a curved memory sphere;
- arriving at a plane generates a panoramic video dome;
- a journey midpoint opens a tunnel of animated images;
- clicking a GLB creates a temporary ribbon of videos;
- one media item grows and pushes others away;
- multiple regions compete for surface area;
- an external event changes the shape of the envelope;
- a future AEXIS scene uses the same API for in-world cinematic surfaces.

The initial song-bound sphere is therefore not a special effect dead end.

It is the first concrete consumer of a general **Spatial Media Envelope** contract.

---

## 27. Summary

For the first project, a specific song may summon a large concave media sphere around the focused-object experience.

The sphere:

- grows from the focused object;
- is sized from real spatial bounds;
- contains the current and next plane regions with padding;
- carries curved media on its inner surface;
- lays media out in an even, readable grid;
- keeps each tile upright;
- protects the current and next main center images from obstruction;
- supports one large hero image/video;
- supports timed and threshold-based transitions where other media fades or disappears.

Architecturally, however, the API is not tied to music.

Music is only the first trigger.

The durable abstraction is:

```text
Trigger → Binding → Spatial Media Envelope Program
```

That gives this project the exact music-sphere behavior it needs now while leaving the same system open to almost any spatial media behavior later.

# Proposal: Viewport-Anchored Media Surfaces and Programmable Sequence Layouts

## Status

Early architecture proposal for `blog-5` / WebRev spatial presentations.

This proposal is intentionally broader than a "GIF floor." The first desired experience is a floor-like field of animated media, but the architecture should define a reusable **Media Surface** primitive that can later be placed as a floor, wall, ceiling, portal, floating field, sphere interior, or other presentation surface.

The API should remain the architecture. A future visual Studio should author the same underlying data rather than becoming a separate behavior system.

---

## Summary

WebRev should support presentation surfaces whose visible media can be:

- a single image or GIF;
- a set of GIFs;
- local video;
- a YouTube source;
- a compatible embeddable source;
- another supported media provider later;
- a programmable sequence assembled from any supported media source.

A surface may be:

- world-locked;
- object-locked;
- camera-relative;
- viewport-locked;
- or hybrid.

The motivating experience is a **viewport-locked floor-like media field**.

The field should remain compositionally attached to the viewer's viewport so the creator can control what is visible and how it is arranged even while the camera moves. It can still use perspective, tilt, depth, and floor-like projection so that it reads as spatial rather than as a conventional flat HUD.

A future Studio should allow creators to visually author exact arrangements by dragging, scaling, spacing, rotating, tilting, and reserving safe regions directly against a live viewport preview.

The core model should separate:

```text
Media Source
    ↓
Media Sequence
    ↓
Surface Layout
    ↓
Surface Anchor / Projection
    ↓
Rendered Media Surface
```

This separation is important. The engine should not create unrelated systems called "GIF Floor," "YouTube Floor," "Video Wall," etc.

---

# 1. Design Principle

The central principle is:

> What appears, when it appears, where it appears, and what it is anchored to are separate concerns.

The engine should model them independently.

At minimum:

```text
MediaSequence = what appears and in what behavioral order
SurfaceLayout = where each visible item appears
SurfaceAnchor = what coordinate system the layout follows
Projection = how the layout visually reads in space
```

This lets one sequence be reused across multiple surface presentations, and one layout system be reused across many media types.

---

# 2. Media Sources

The source model should be media-provider-neutral.

Illustrative shape:

```ts
type MediaSource =
  | {
      type: "image" | "gif" | "video";
      src: string;
    }
  | {
      type: "youtube";
      src: string;
    }
  | {
      type: "embed";
      src: string;
      provider?: string;
    }
  | {
      type: "custom";
      adapter: string;
      options?: Record<string, unknown>;
    };
```

A surface should not need to understand provider-specific details beyond what its renderer/adapter requires.

For unsupported embeds, the engine should be able to expose a graceful fallback rather than making the surface contract itself provider-specific.

---

# 3. Media Sequences

A Media Surface may reference one source or a **Media Sequence**.

The sequence system should support both intentional authored order and controlled randomization.

Desired behaviors include:

- play the first two or three items in a fixed order;
- intentionally repeat one of those items;
- then enter a randomized pool;
- avoid replaying anything used in the last 2, 4, or N selections;
- prohibit immediate repetition;
- choose a defined number of randomized items before restarting;
- restart from the beginning, a named step, or another rule;
- reserve a forced finale;
- later support weighted choices or named sub-pools.

Example:

```text
A
B
C
B        ← intentional authored repeat
↓
random pool item
random pool item
random pool item
random pool item
↓
restart
```

Illustrative data:

```ts
type MediaSequence = {
  id: string;

  intro?: MediaSequenceStep[];

  pool?: MediaSource[];

  rules?: {
    randomizePool?: boolean;
    avoidRecent?: number;
    noImmediateRepeat?: boolean;
    poolSelectionsBeforeRestart?: number;

    restart?: {
      mode: "beginning" | "intro" | "step" | "continue";
      stepId?: string;
    };
  };
};

type MediaSequenceStep =
  | {
      type: "show";
      media: MediaSource;
      repeat?: number;
    }
  | {
      type: "pool";
      poolId?: string;
      count?: number;
      avoidRecent?: number;
    };
```

The exact type shape may evolve. The important requirement is that intentional repetition and randomized selection are both first-class rather than hacks.

---

# 4. Anti-Repeat Memory

Random should not mean careless repetition.

A sequence should be able to maintain recent-selection memory.

Examples:

```text
avoidRecent: 2
avoidRecent: 4
avoidRecent: 8
```

If `avoidRecent: 4`, an item selected within the previous four eligible random selections should not be selected again unless the pool is too small to satisfy the rule.

When a constraint cannot be satisfied, behavior should be deterministic and inspectable. For example:

1. preserve `noImmediateRepeat` if possible;
2. relax the oldest recent-history exclusion first;
3. never silently deadlock the sequence.

This allows small pools to remain usable.

The sequence runtime should expose enough state for a future Studio/debugger to show:

- current item;
- current sequence step;
- recent-history queue;
- remaining eligible candidates;
- restart count;
- random seed when deterministic playback is requested.

---

# 5. Viewport-Anchored Surfaces

The motivating floor should support a mode where its arrangement is **locked to the visible viewport**.

This does not mean the result must look like a flat overlay.

The viewport provides the stable composition frame. The renderer may still project that authored composition through perspective so it visually behaves like a floor beneath or ahead of the viewer.

Illustrative surface:

```ts
type MediaSurface = {
  id: string;

  anchor: {
    space: "world" | "object" | "camera" | "viewport" | "hybrid";
    targetId?: string;
  };

  projection: {
    mode: "flat" | "floor" | "wall" | "ceiling" | "custom";
    perspective?: boolean;
    tiltDegrees?: number;
    depth?: number;
  };

  media: MediaSource | MediaSequence;

  layout: SurfaceLayout;
};
```

For the initial desired experience:

```ts
anchor.space = "viewport"
projection.mode = "floor"
```

The media field therefore stays compositionally dependable while still appearing to occupy a spatial floor.

---

# 6. Anchor Modes

## `world`

Normal scene geometry.

The surface exists at a fixed location in world coordinates.

## `object`

The surface follows a plane, GLB, station, or other scene object.

## `camera`

The surface exists in camera-relative 3D space.

This can provide real relative depth while following camera movement.

## `viewport`

The authored arrangement is expressed primarily in normalized viewport coordinates.

This is the preferred initial mode for the proposed media floor because it guarantees composition.

## `hybrid`

The surface may occupy world/camera space while applying bounded viewport correction to preserve important composition.

Hybrid should remain an advanced mode rather than becoming the default.

---

# 7. Normalized Viewport Coordinates

Viewport-authored layouts should avoid hardcoding pixel positions as their canonical representation.

Prefer normalized coordinates such as:

```text
x: 0.0 → 1.0
y: 0.0 → 1.0
```

Example:

```ts
{
  x: 0.38,
  y: 0.72,
  scale: 1.1,
  rotationDegrees: 2
}
```

This gives arrangements a better chance of surviving:

- desktop;
- mobile;
- ultrawide;
- resized browser windows;
- different device-pixel ratios.

Pixel values may still exist as optional local offsets or editor conveniences.

---

# 8. Surface Layout

A Media Surface should not assume one fixed grid.

Initial layout modes can include:

- `grid`
- `authored`
- `scattered`
- `ring`
- `custom`

The initial floor can use an evenly spaced grid while preserving the ability to author exact arrangements later.

Illustrative preset layout:

```ts
layout: {
  mode: "grid",

  spacing: {
    x: 0.18,
    y: 0.22
  },

  safeArea: {
    top: 0.08,
    right: 0.06,
    bottom: 0.08,
    left: 0.06
  }
}
```

Illustrative authored layout:

```ts
layout: {
  mode: "authored",

  slots: [
    {
      id: "left",
      x: 0.12,
      y: 0.72,
      scale: 0.8,
      rotationDegrees: -4
    },
    {
      id: "center",
      x: 0.38,
      y: 0.68,
      scale: 1.1,
      rotationDegrees: 2
    },
    {
      id: "right",
      x: 0.67,
      y: 0.74,
      scale: 0.9,
      rotationDegrees: 5
    }
  ]
}
```

---

# 9. Layout Slots versus Media Identity

An authored slot should not necessarily be permanently bound to one GIF.

This distinction is important.

The Studio may define:

```text
slot A
slot B
slot C
slot D
```

while the sequence decides which eligible media occupies those slots at a given moment.

This permits:

- stable composition with changing media;
- randomized media without randomized geometry;
- intentionally fixed hero positions;
- reserved focal areas;
- future synchronized swaps;
- media sequences that animate through a designer-authored composition.

A slot may optionally pin a specific item, pool, role, or sequence channel.

---

# 10. Safe Areas and Occlusion Rules

The layout system should support explicit regions where generated media should not be placed.

This is important for the existing WebRev presentation model, where a main center image, focused object, text, or other hero content may already occupy the viewport.

Possible constraints:

```ts
safeArea: {
  top: 0.08,
  right: 0.06,
  bottom: 0.08,
  left: 0.06
}

exclusionZones: [
  {
    type: "viewport-rect",
    x: 0.32,
    y: 0.18,
    width: 0.36,
    height: 0.42
  }
]
```

Later the exclusion system may reference live scene objects or projected bounds instead of only static rectangles.

The goal is to allow the engine to say:

> fill the visible composition with media, but do not cover the main image or focal object.

---

# 11. Future Studio Authoring

A future Studio should provide visual authoring over the exact same `MediaSurface`, `MediaSequence`, and `SurfaceLayout` contracts.

The creator should be able to:

- select a surface;
- switch anchor mode;
- preview world/camera/viewport behavior;
- drag media slots directly over the live viewport;
- resize slots;
- rotate slots;
- change tilt/perspective;
- adjust spacing;
- create exclusion zones;
- reserve a hero region;
- define intro items;
- define randomized pools;
- set recent-history avoidance;
- deliberately repeat a chosen step;
- choose restart behavior;
- preview the sequence repeatedly;
- save the resulting arrangement as data.

Studio should write normalized data rather than baking viewport-specific pixel positions into runtime code.

The desired relationship is:

> API defines what arrangements are possible. Studio lets a person compose them by eye.

---

# 12. Surface Roles

Although the first target is a floor, the API should allow the same primitive to be assigned different roles.

Examples:

```text
floor
wall
ceiling
portal
backdrop
floating-field
sphere-interior
custom
```

A role is primarily authoring/rendering intent. It should not create a separate sequence engine.

For example, the same GIF sequence could be shown:

- beneath the viewer as a floor;
- behind the station as a wall;
- around the viewer inside a sphere;
- as a viewport-corrected field;
- on several independent floating planes.

---

# 13. Media Timing

Different media types do not share one natural duration.

The sequence contract should therefore allow timing policy.

Examples:

```ts
timing: {
  mode: "intrinsic"
}
```

```ts
timing: {
  mode: "duration",
  durationMs: 6000
}
```

```ts
timing: {
  mode: "signal",
  signal: "music:beat-group-end"
}
```

For GIFs, `intrinsic` may mean allow a complete animation cycle before the sequence advances when reliable duration metadata is available.

Later, music/world events may drive transitions.

The surface system should not be coupled to audio, but it should be compatible with the existing Music Flow and future timing/orchestration systems.

---

# 14. Transition Behavior

Media changes should optionally use transition policies:

- cut;
- crossfade;
- fade-through-transparent;
- scale;
- slide;
- custom.

Illustrative:

```ts
transition: {
  mode: "crossfade",
  durationMs: 800
}
```

Transitions belong to the presentation layer and should not change Media Sequence selection semantics.

---

# 15. Multiple Concurrent Media

A surface sequence may eventually control more than one visible item at once.

The architecture should therefore avoid assuming:

```text
sequence = one current GIF
```

Instead, the surface should be able to render a **selection set** into layout slots.

Possible later behavior:

```text
choose 6 eligible GIFs
place them into 6 authored slots
after N seconds replace 2 of them
preserve the other 4
maintain avoidRecent history across replacements
```

This makes the surface useful as a living field rather than merely a slideshow.

An initial implementation may start with simpler whole-set replacement.

---

# 16. Deterministic Randomness

For authored presentations, "random" should optionally be replayable.

A sequence may accept:

```ts
random: {
  mode: "session" | "seeded";
  seed?: string;
}
```

Seeded playback is useful for:

- repeatable demos;
- debugging;
- recording;
- sharing a composition;
- automated testing.

Session randomness can remain the normal experiential mode.

---

# 17. Relationship to Existing Music Flow

The existing Music Flow proposal already establishes a useful principle:

> Simple actions compose into complex behavior.

Media Sequence should follow the same philosophy.

Conceptually:

```text
show
repeat
queue
mix
avoid
continue
restart
custom
```

The media system does not need to literally reuse the audio scheduler implementation, but the two systems should use compatible orchestration ideas where sensible.

Future orchestration may synchronize:

- music selection;
- media selection;
- surface transitions;
- camera changes;
- text;
- journey effects.

That synchronization should happen above the individual media renderer rather than being hardcoded into GIF behavior.

---

# 18. Relationship to Spatial Environment Spheres

The existing Spatial Environment Sphere proposal defines stable 3D volumes around a station.

Media Surfaces should be able to participate in those environments without requiring them.

Examples:

- a world-locked media plane inside a sphere;
- a viewport-locked floor while other GLBs remain sphere-relative;
- media wrapped around the sphere interior;
- floating media slots placed in sphere coordinates.

The systems are complementary:

```text
Environment Sphere = optional spatial coordinate volume
Media Surface = media-bearing presentation primitive
```

---

# 19. Suggested API Direction

The current public runtime is exposed through:

```ts
window.webrevPresentationSettings
```

This proposal does **not** require immediately adding every capability to the current public API.

When promoted from proposal to implementation, likely runtime concepts include:

```ts
api.listMediaSurfaces()
api.getMediaSurface(id)
api.setMediaSurface(id, surface)
api.removeMediaSurface(id)

api.getMediaSequence(id)
api.setMediaSequence(id, sequence)

api.getSurfaceLayout(id)
api.setSurfaceLayout(id, layout)

api.getMediaSurfaceRuntime(id)
```

The current API documentation should only list methods once they actually exist.

This proposal therefore defines the architectural target without falsely documenting unimplemented runtime methods as current functionality.

---

# 20. Illustrative Complete Example

```ts
const floor: MediaSurface = {
  id: "memory-floor",

  anchor: {
    space: "viewport"
  },

  projection: {
    mode: "floor",
    perspective: true,
    tiltDegrees: 68,
    depth: 0.72
  },

  media: {
    id: "memory-floor-sequence",

    intro: [
      {
        type: "show",
        media: { type: "gif", src: "/media/a.gif" }
      },
      {
        type: "show",
        media: { type: "gif", src: "/media/b.gif" },
        repeat: 2
      },
      {
        type: "show",
        media: { type: "gif", src: "/media/c.gif" }
      }
    ],

    pool: [
      { type: "gif", src: "/media/d.gif" },
      { type: "gif", src: "/media/e.gif" },
      { type: "gif", src: "/media/f.gif" },
      { type: "gif", src: "/media/g.gif" },
      { type: "youtube", src: "https://www.youtube.com/watch?v=example" }
    ],

    rules: {
      randomizePool: true,
      avoidRecent: 4,
      noImmediateRepeat: true,
      poolSelectionsBeforeRestart: 6,
      restart: {
        mode: "intro"
      }
    }
  },

  layout: {
    mode: "grid",

    spacing: {
      x: 0.18,
      y: 0.22
    },

    safeArea: {
      top: 0.08,
      right: 0.06,
      bottom: 0.08,
      left: 0.06
    }
  }
};
```

This example is illustrative rather than a frozen schema.

---

# 21. Initial Implementation Slice

A sensible first implementation can remain small.

Support:

1. one Media Surface;
2. `viewport` anchor;
3. `floor` projection;
4. GIF/image sources;
5. grid layout;
6. fixed ordered intro;
7. randomized pool;
8. `avoidRecent`;
9. `noImmediateRepeat`;
10. restart after a configured number of pool selections.

Then expand to:

- authored slots;
- video;
- YouTube;
- approved embed adapters;
- concurrent media sets;
- visual Studio editing;
- custom projections;
- hybrid anchoring;
- event/music synchronization.

The architectural contract should be designed so those later additions do not require replacing the first version.

---

# 22. Non-Goals

This proposal does not require:

- arbitrary remote HTML to be trusted by default;
- every website to be embeddable;
- pixel-perfect identical layouts on every aspect ratio;
- replacing normal world-space geometry;
- forcing Media Surfaces onto simple projects;
- merging media sequencing directly into Music Flow;
- building the full Studio immediately.

The first goal is a clean primitive with room to grow.

---

# 23. Acceptance Direction

The first viewport-floor implementation should eventually be considered successful when:

- a creator can configure multiple GIFs as one surface;
- an authored opening sequence can play in a fixed order;
- an item can intentionally repeat;
- playback can continue into a randomized pool;
- recent items are avoided according to a configurable history length;
- the layout remains compositionally tied to the viewport while the camera moves;
- the result still visually reads as a floor through projection/perspective;
- the main presentation focal area can be kept clear;
- the sequence can restart predictably;
- the runtime state can be inspected;
- future Studio authoring can modify the same data model rather than requiring a second system.

---

## Final Principle

The feature should begin as something visually simple and delightful:

> a living floor made from memories, GIFs, videos, or other media.

But the engine contract should describe something much more general:

> a programmable media-bearing surface whose content sequence, spatial arrangement, projection, and anchoring are independent and composable.

That gives WebRev a primitive that can grow from one beautiful floor into an authored media environment without turning every new visual idea into a new subsystem.

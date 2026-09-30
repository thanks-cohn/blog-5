# Journey Segment Effects and Optional Spatial Environment Spheres

Status: Proposal

## Purpose

This proposal defines two related but independent spatial-presentation primitives:

1. **Journey Segment Effects** — authored effects and assets that live in the route between one plane/station and another.
2. **Optional Spatial Environment Spheres** — per-plane 3D coordinate volumes that can be enabled when a creator wants stable environmental placement around a settled station.

Neither system is mandatory. A simple project can continue to use ordinary planes, main images, floating assets, and the rail ride without either feature.

The intent is to expand the spatial soundscape/presentation format without turning every project into an overconfigured scene.

---

## 1. Journey Segment Effects

### Problem

The route between planes should be authorable space, not merely empty travel time.

A creator may want the rider to:

- enter fog immediately after leaving a plane;
- pass through or between generated cloud GLBs;
- ride beneath or through a waterfall;
- move through mist, rain, sparks, leaves, petals, debris, stars, papers, text fragments, screens, arches, or other scene elements;
- have the effect intensify in the middle of the route;
- have it clear as the next plane approaches.

These assets do not belong to either endpoint plane. They belong to the **journey segment between them**.

### Core model

A segment is identified by its endpoints:

```json
{
  "fromStationId": "first-light",
  "toStationId": "blue-room"
}
```

The segment may then contain one or more effects.

```json
{
  "journeySegments": [
    {
      "fromStationId": "first-light",
      "toStationId": "blue-room",
      "effects": []
    }
  ]
}
```

### Progress-based placement

Segment behavior should use normalized progress:

```text
0.0 = just left the source plane
0.5 = midpoint of the ride
1.0 = arrival at the destination plane
```

This keeps the authoring model independent of exact station spacing or rail speed.

### Example: fog after plane 1, clearing near plane 2

```json
{
  "journeySegments": [
    {
      "fromStationId": "first-light",
      "toStationId": "blue-room",
      "effects": [
        {
          "id": "fog-passage",
          "kind": "asset-field",
          "assets": [
            "transition-fog-a.glb",
            "transition-fog-b.glb",
            "transition-fog-c.glb"
          ],
          "placement": {
            "space": "rail-relative",
            "startProgress": 0.12,
            "endProgress": 0.82,
            "radius": 6,
            "spread": 0.8
          },
          "visibility": {
            "fadeInStart": 0.10,
            "fadeInEnd": 0.24,
            "fadeOutStart": 0.64,
            "fadeOutEnd": 0.86
          }
        }
      ]
    }
  ]
}
```

This supports the specific desired composition:

1. leave plane 1;
2. pass the main image;
3. fog/cloud assets begin appearing shortly afterward;
4. density builds around the rider;
5. visibility clears as plane 2 comes closer.

### Example: explicit opacity curve

Effects may optionally use a curve rather than simple fade ranges.

```json
{
  "opacityCurve": [
    { "progress": 0.0, "opacity": 0.0 },
    { "progress": 0.2, "opacity": 0.4 },
    { "progress": 0.45, "opacity": 0.95 },
    { "progress": 0.7, "opacity": 0.45 },
    { "progress": 0.9, "opacity": 0.0 }
  ]
}
```

### Effect categories

The API should avoid hardcoding separate one-off systems for fog, clouds, waterfalls, etc. Instead, use composable effect kinds.

Initial useful kinds:

- `asset-field`
- `particle-field`
- `curtain`
- `volume`
- `light-field`
- `audio-zone`
- `text-field`

A fog field and cloud field can both be `asset-field` effects with different assets and visibility behavior.

A waterfall may use `curtain` or a GLB-based `asset-field`.

### Examples

#### Cloud tunnel

```json
{
  "id": "cloud-tunnel",
  "kind": "asset-field",
  "assets": [
    "cloud-soft-a.glb",
    "cloud-soft-b.glb",
    "cloud-soft-c.glb"
  ],
  "placement": {
    "space": "rail-relative",
    "startProgress": 0.18,
    "endProgress": 0.78,
    "radius": 8
  }
}
```

#### Passing beneath a waterfall

```json
{
  "id": "waterfall-crossing",
  "kind": "curtain",
  "asset": "waterfall-sheet.glb",
  "placement": {
    "space": "rail-relative",
    "progress": 0.48,
    "offset": {
      "x": 0,
      "y": 4,
      "z": 0
    }
  },
  "behavior": {
    "passThrough": true
  }
}
```

The system should allow the rider to pass:

- underneath;
- through;
- beside;
- between;

depending on placement and authored geometry.

### Semantic modes

An effect may optionally describe how it participates in the experience:

- `decorative` — visual atmosphere only;
- `immersive` — intended to surround or be passed through;
- `occluding` — intentionally blocks or softens visibility;
- `interactive` — can trigger another action;
- `audio-reactive` — may respond to music/timing later.

These modes should not require separate rendering engines. They are behavioral metadata.

### Future segment capabilities

Later versions may support:

- segment-specific lighting;
- sound or music transitions;
- camera overrides;
- field density curves;
- speed-dependent effects;
- interaction triggers;
- timed text;
- video surfaces;
- collisions or avoidance;
- route branches;
- procedural generation;
- seeded randomness;
- entry and exit events.

The v1 implementation should remain much smaller.

---

## 2. Optional Spatial Environment Sphere

### Purpose

Once the rider settles at a plane, a creator may optionally enable a spatial environment volume around that station.

This is **not a default feature** and is not necessarily a visible sphere.

Its primary purpose is to provide a stable 3D coordinate system for placing environmental assets around the station.

Examples include:

- lights;
- images;
- GLBs;
- decorative geometry;
- moons;
- screens;
- fog sources;
- reflectors;
- environmental props;
- distant objects;
- background elements.

### Key principle

The sphere is an authoring volume and coordinate scaffold.

It may be:

- invisible;
- transparent;
- visible only while editing;
- intentionally rendered by a particular project.

It must not imply that all station environments are enclosed bubbles.

### Basic configuration

```json
{
  "environmentSphere": {
    "enabled": true,
    "radius": 18,
    "visibleInEditor": true,
    "visibleInPresentation": false,
    "placementMode": "surface-and-volume"
  }
}
```

Default:

```json
{
  "environmentSphere": {
    "enabled": false
  }
}
```

### Placement modes

The environment sphere should support at least:

- `surface` — assets live on the conceptual sphere surface;
- `volume` — assets may occupy any coordinate inside the volume;
- `surface-and-volume` — both.

### Cartesian coordinates

```json
{
  "asset": "station-lamp.glb",
  "position": {
    "space": "environment-sphere",
    "x": 4.2,
    "y": 2.1,
    "z": -6.8
  }
}
```

### Spherical coordinates

```json
{
  "asset": "moon.glb",
  "position": {
    "space": "environment-sphere",
    "azimuth": 42,
    "elevation": 18,
    "radius": 15
  }
}
```

Both coordinate forms should resolve into stable station-local 3D coordinates.

### Stable coordinates

The main reason for the environment sphere is repeatability.

If a creator places a light above-left or an image behind the viewer, its position should survive:

- reloads;
- camera movement;
- changes to ordinary floating-object simulation;
- rail travel away from and back to the station.

Environment placement is authored state, not random placement.

---

## 3. Environment Assets

Environment assets should be distinct from ordinary floating assets.

A station may therefore conceptually contain:

```text
Station
├─ main image
├─ ordinary floating 2D/3D assets
├─ focal/music-linked objects
├─ optional environment sphere
│  ├─ fixed images
│  ├─ fixed GLBs
│  ├─ lights
│  ├─ fog / atmosphere
│  └─ background/environment objects
└─ entry/exit journey segments
```

The environment sphere should not automatically absorb every ordinary station asset.

Creators explicitly place things into the environment coordinate space when they want stable environmental composition.

---

## 4. Lighting

A station environment sphere may optionally contain lighting instructions.

```json
{
  "environmentSphere": {
    "enabled": true,
    "lighting": {
      "ambientIntensity": 0.45,
      "lights": [
        {
          "id": "warm-key",
          "type": "point",
          "position": {
            "space": "environment-sphere",
            "x": -4,
            "y": 6,
            "z": 3
          },
          "intensity": 1.2
        }
      ]
    }
  }
}
```

The environment sphere is useful here because lights can be positioned in the same coordinate system as environmental imagery and GLBs.

Lighting remains optional.

---

## 5. Images and Background Elements

The sphere may allow images to exist at established positions in 3D space rather than only as floating simulated objects.

Example:

```json
{
  "asset": "blue-room-window-memory.webp",
  "kind": "2d",
  "position": {
    "space": "environment-sphere",
    "azimuth": -80,
    "elevation": 8,
    "radius": 16
  },
  "billboard": false
}
```

This allows:

- fixed wall-like images;
- background photographs;
- panels behind the camera;
- decorative horizons;
- image constellations.

---

## 6. Relation to Existing Station Sphere

The project already has a sphere used for ordinary asset placement and hemisphere behavior.

The proposed environment sphere should not silently replace or overload that behavior.

Recommended distinction:

### Existing asset sphere

Purpose:

- ordinary floating-object organization;
- front/back hemisphere placement;
- collision bounds;
- creator manipulation of normal station assets.

### Optional environment sphere

Purpose:

- stable environmental coordinates;
- lights;
- fixed imagery;
- environmental GLBs;
- intentional 3D composition around a settled station.

The implementations may eventually share geometry/math utilities, but their semantics should remain separate.

---

## 7. Relationship Between Journey Segments and Environment Spheres

The two systems meet at station arrival and departure but remain independently configurable.

Example journey:

```text
Plane 1 environment
      ↓
leave station
      ↓
fog begins
      ↓
dense cloud field
      ↓
pass beneath waterfall
      ↓
fog clears
      ↓
Plane 2 environment activates
```

This allows the route itself to become part of the authored composition.

---

## 8. Lifecycle

A useful lifecycle is:

### Departing

1. station is active;
2. creator/user requests next plane;
3. local station environment begins exit behavior if configured;
4. journey segment activates;
5. rail ride continues normally.

### Traveling

1. normalized segment progress advances from 0 to 1;
2. segment effects resolve from that progress;
3. assets/effects render in rail-relative space;
4. effects may fade, move, or react according to the segment definition.

### Arriving

1. segment effects fade/clear;
2. rider reaches destination;
3. segment deactivates;
4. destination environment sphere activates if enabled;
5. station presentation settles.

This must preserve the visible ride rather than introducing cuts.

---

## 9. API Principles

### Optional by default

No environment sphere or segment effect should appear unless explicitly enabled/configured.

### Route-relative authoring

Journey effects should be authored relative to the route rather than fragile global coordinates whenever possible.

### Stable station-local authoring

Environment assets should use stable station-local coordinates.

### Composition over special cases

Fog, clouds, waterfalls, rain, and similar effects should be configurations of general primitives rather than separate bespoke systems.

### Deterministic by default

Random distribution should be seeded or explicitly requested.

### Inspectable

The runtime API should expose:

- active station;
- active journey segment;
- current segment progress;
- active segment effects;
- current environment sphere state;
- resolved environment asset coordinates.

### Serializable

All authored configuration should be serializable to project files.

---

## 10. Possible API Shape

```ts
type JourneySegment = {
  id?: string;
  fromStationId: string;
  toStationId: string;
  effects?: JourneySegmentEffect[];
};

type JourneySegmentEffect = {
  id: string;
  kind:
    | "asset-field"
    | "particle-field"
    | "curtain"
    | "volume"
    | "light-field"
    | "audio-zone"
    | "text-field";
  mode?: "decorative" | "immersive" | "occluding" | "interactive" | "audio-reactive";
  placement?: SegmentPlacement;
  visibility?: SegmentVisibility;
  behavior?: Record<string, unknown>;
};

type EnvironmentSphere = {
  enabled: boolean;
  radius?: number;
  visibleInEditor?: boolean;
  visibleInPresentation?: boolean;
  placementMode?: "surface" | "volume" | "surface-and-volume";
  assets?: EnvironmentAsset[];
  lighting?: EnvironmentLighting;
};
```

---

## 11. Suggested v1 Scope

The first implementation should deliberately avoid building the whole future system.

### Journey Segment v1

Support:

- `journeySegments`;
- source/destination station IDs;
- GLB and 2D asset fields;
- rail-relative placement;
- normalized progress;
- fade-in/fade-out;
- fixed or seeded distribution;
- clear-near-arrival behavior.

This is enough for:

- fog;
- clouds;
- waterfall sheets;
- floating debris;
- image fields;
- simple atmospheric corridors.

### Environment Sphere v1

Support:

- disabled by default;
- configurable radius;
- editor visibility;
- presentation visibility;
- Cartesian placement;
- spherical placement;
- fixed 2D/3D assets;
- basic lighting positions.

No physics requirement in v1.

---

## 12. Future Editor UX

The creator-facing editor may eventually expose this visually.

### Journey segment editor

Possible controls:

- select source and destination plane;
- scrub route progress;
- add effect;
- place effect around rail;
- define start/end;
- preview ride;
- edit fade curve.

### Environment sphere editor

Possible controls:

- Enable Environment Sphere;
- Show Sphere;
- Hide Sphere;
- Radius;
- Surface / Volume / Both;
- Add Asset;
- Add Light;
- Move / rotate / scale asset;
- numeric XYZ coordinates;
- azimuth/elevation/radius coordinates;
- preview from station camera;
- preview from free camera.

The sphere itself may render as a faint transparent wireframe only during editing.

---

## 13. Non-goals

This proposal does not require:

- making environment spheres the default;
- enclosing every plane in a visible globe;
- replacing ordinary floating assets;
- replacing the existing station asset sphere;
- forcing effects onto every route;
- making fog or clouds mandatory;
- turning the rail ride into a cutscene;
- building full volumetric rendering in the first implementation.

---

## 14. Summary

The format should treat both **destinations** and **the travel between them** as authored spatial material.

Journey Segment Effects make the rail route itself composable:

- fog after departure;
- generated clouds surrounding the rider;
- waterfall crossings;
- atmospheric tunnels;
- imagery and objects along the ride;
- effects that clear as the next station approaches.

Optional Spatial Environment Spheres give a settled plane a stable 3D authoring volume:

- exact asset coordinates;
- lights;
- images;
- GLBs;
- environmental objects;
- surface or volumetric placement.

Both features are optional.

Together they make it possible for a creator to author not only what the viewer sees at each plane, but also **what it feels like to travel from one plane to the next and what spatial world exists around each destination.**

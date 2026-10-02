# Proposal: Per-Plane Spatial Spheres, Gravity Wells, and Free-Flow Object Migration

## Status

Early architecture proposal for `blog-5` / WebRev spatial presentations.

This proposal is intentionally separate from portable save/load and music authoring.

Its purpose is to define a reusable spatial-motion system in which each plane can own one or more invisible spheres that influence free-moving objects.

## Core Idea

Each plane may define its own spatial field made from:

- one larger interaction sphere
- one or more smaller sphere zones
- fixed anchor points
- free-flow objects
- local gravitational influence
- inter-sphere gravitational influence

The visible experience should feel alive, loosely predictable, and different each time without becoming random noise.

The guiding principle is:

> Structured forces produce emergent motion.

## Large Interaction Sphere

A plane may have a larger outer sphere representing its broad manipulation and free-flow region.

This larger sphere can support:

- pulling objects closer to the viewer
- pushing objects farther away
- dragging objects through space
- defining the broad region in which objects may move
- editor visualization
- future interaction constraints

The sphere does not need to be visible during presentation mode.

It may appear only as an editor gizmo.

## Smaller Sphere Zones

Inside or around the plane, creators may define smaller sphere zones around fixed anchor points.

Each small sphere can act as:

- a spawn region
- a loose home region
- a gravity well
- an orbit region
- a local randomization region
- a movement influence region

Objects do not need to remain trapped inside their source sphere.

They may leave and travel through the broader plane space.

## Free-Flow Mode

Objects may be marked as `freeFlow`.

A free-flow object:

- may leave its current sphere
- keeps velocity and inertia
- may be influenced by multiple sphere wells
- may drift between zones
- may orbit
- may overshoot
- may slingshot
- may settle into another sphere
- may remain unbound for a period

This should create motion that looks authored even though the exact path is generated from a compact rule set.

## Important Interaction Rule: Approach-Induced External Amplification

The intended behavior is not a simple handoff where the current sphere loses strength.

Instead:

1. Object X is already inside Sphere A.
2. Sphere A continues exerting its normal influence on X.
3. Object Y approaches Sphere A.
4. The approach of Y acts as a trigger.
5. X becomes temporarily more sensitive to the gravitational influence of other spheres.
6. Those other spheres may now pull X strongly enough to alter its path or draw it away.
7. Sphere A does not need to weaken for this to happen.

In other words:

> The approaching object increases the resident object's susceptibility to outside wells.

This can cause arrivals to produce departures.

## Example

```text
Before approach:

Sphere A -> X        strong local influence
Sphere B -> X        weak outside influence
Sphere C -> X        weak outside influence


Y approaches Sphere A:

Sphere A -> X        unchanged
Sphere B -> X        amplified
Sphere C -> X        amplified


Result:

X may remain,
curve outward,
orbit differently,
or migrate toward B/C.
```

## Why This Matters

This creates a more interesting system than static magnets.

A new object entering a region can disturb the local population without a direct collision.

Possible emergent effects:

- one arrival ejects another object
- one migration triggers another migration elsewhere
- objects form temporary streams between spheres
- chain reactions travel across a plane
- groups appear to breathe or reorganize
- repeated scenes remain recognizable but not identical

## Controlled Variation

Gravity strength should not be perfectly uniform.

Different spheres and different encounters may vary slightly.

Useful parameters may include:

```ts
type SphereGravity = {
  baseStrength: number
  variance: number
  radius: number
  falloff: number
  orbitBias: number
  maxAcceleration: number
  externalAmplification: number
  amplificationVariance: number
  amplificationDuration: number
}
```

Objects may also have movement personality:

```ts
type FreeFlowMotion = {
  mass: number
  inertia: number
  drag: number
  attractionResponse: number
  wander: number
  maxSpeed: number
}
```

The important requirement is that variation remains bounded.

The system should feel different, not arbitrary.

## Per-Plane Ownership

Every plane may define its own independent sphere system.

Conceptually:

```text
Plane
├── interactionSphere
├── sphereZones[]
│   ├── anchor
│   ├── radius
│   ├── gravity
│   ├── spawnPool
│   └── motionRules
└── freeFlowObjects[]
```

This lets one plane be calm and orbital while another is energetic and migratory.

## Sphere Zone Example

```json
{
  "id": "sphere-a",
  "anchor": [2.0, 1.2, -4.5],
  "radius": 3.5,

  "gravity": {
    "baseStrength": 1.0,
    "variance": 0.2,
    "falloff": 1.4,
    "orbitBias": 0.15,
    "externalAmplification": 1.8,
    "amplificationVariance": 0.3,
    "amplificationDuration": 2.4
  },

  "spawnPool": [
    "object-a",
    "object-b",
    "object-c"
  ]
}
```

## Approach Detection

The triggering object does not need to cross the sphere boundary before amplification begins.

Each sphere may have a configurable approach shell.

Example:

```ts
type ApproachTrigger = {
  startRadius: number
  peakRadius: number
  decayRadius: number
}
```

This gives the motion time to bend naturally rather than changing only at an exact boundary.

## Amplification Scope

The first implementation should allow the amplification to target:

- all resident free-flow objects
- the nearest resident object
- a random resident subset
- objects matching a tag

Default recommendation:

```text
nearest few resident free-flow objects
```

This avoids every arrival destabilizing the entire plane.

## Randomization

Randomness should affect degree, not fundamental rules.

Good randomized values:

- pull multiplier
- response delay
- orbital bias
- amplification intensity
- amplification duration
- slight directional wander

Avoid fully random teleport-like motion.

A fixed seed should optionally make the system reproducible.

## Editor UX

Desktop:

- right-click plane
- Add Sphere Zone
- Move Anchor
- Resize Sphere
- Set Gravity
- Set Spawn Pool
- Toggle Free Flow
- Preview Motion

Phone/tablet:

- long-press plane or anchor
- expose equivalent touch controls

In editor mode the user may see translucent spheres and influence shells.

In presentation mode those helpers disappear.

## Performance Direction

The system should be designed for low-end-first execution.

Possible implementation rules:

- spatial partitioning per plane
- distance culling
- only evaluate nearby wells
- cap maximum active wells per object
- cap active approach-trigger relationships
- fixed-timestep or bounded-step physics
- sleep objects when visually stable
- deterministic seeded variation where useful

Do not require full general-purpose rigid-body physics.

This can be a lightweight field-force system.

## Save Format Integration

The future portable world format should serialize these sphere definitions as declarative state.

Example:

```json
{
  "planes": [
    {
      "id": "plane-001",
      "interactionSphere": {
        "radius": 20
      },
      "sphereZones": [
        {
          "id": "sphere-a",
          "anchor": [2, 1, -4],
          "radius": 3.5,
          "gravity": {
            "baseStrength": 1.0,
            "externalAmplification": 1.8
          }
        }
      ]
    }
  ]
}
```

No replay log should be required to reconstruct the authored field layout.

## Product Principle

The creator should not have to animate every path.

They define:

- where the spheres are
- how large they are
- how strong they are
- what can spawn there
- how strongly arrivals disturb residents

The engine produces the motion.

That preserves the project's broader goal:

> A few intelligently placed numbers should be able to produce a world that feels alive.

## Non-Goals

This proposal does not yet define:

- collision physics
- rigid-body simulation
- multiplayer synchronization
- exact integrator mathematics
- visual rendering of editor gizmos
- audio-reactive gravity
- cross-plane migration

Those can be layered on later without changing the core field model.

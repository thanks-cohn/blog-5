# Transparent Warped Credit-Text Plane

## Status

Standalone Blog 5 proposal.

## Core Idea

Blog 5 should support a cinematic text-overlay system where words scroll upward through the world like a space-opera credit crawl, but the text is attached to a live spatial plane rather than rendered as a conventional flat UI overlay.

The plane is **transparent by default**.

Its main purpose is to act as an invisible carrier surface that determines:

- text perspective,
- text curvature,
- text path,
- text tilt,
- text scale over depth,
- and live deformation behavior.

The viewer should usually perceive only the words floating through the scene, not the plane itself.

## Default Behavior

The baseline effect is an upward credit crawl:

1. Text enters from below or another configured origin.
2. It moves upward continuously.
3. The transparent carrier plane may tilt away from the viewer.
4. That tilt determines the apparent receding shape of the words.
5. The plane may be curved, bowed, twisted, tapered, or otherwise shaped.
6. The text follows that surface exactly.
7. The text exits or fades at the far edge.

A flat plane gives a simple vertical crawl.

A tilted plane gives a classic receding cinematic crawl.

A curved plane creates an arcing stream of text.

A warped plane creates a more dreamlike or expressive presentation.

## Transparent Carrier Surface

The plane should normally render with no visible material.

Possible modes:

- `transparent` — default; only the text is visible.
- `debug` — shows the carrier mesh for authoring.
- `tinted` — optional artistic surface.
- `material` — optional future textured or shader-driven surface.

The transparent plane must still remain fully active for geometry, clipping, deformation, event targeting, and text mapping.

In other words:

> Invisible does not mean inactive.

## Plane Shape Determines Word Shape

The visual shape of the writing should be derived from the carrier surface.

Possible surface controls:

- width,
- height,
- tilt,
- yaw,
- roll,
- curvature,
- horizontal bow,
- vertical bow,
- taper,
- twist,
- wave amplitude,
- wave frequency,
- pinch,
- stretch,
- perspective depth,
- entrance edge,
- exit edge,
- subdivision density.

The text remains mapped to the plane while it moves.

This means changing the plane changes the presentation without changing the underlying words.

## Sound-Triggered Warping

Special sound effects should be able to deform the transparent text plane while the words are moving.

Examples:

- bass hit -> outward pulse,
- whoosh -> backward bend,
- impact -> traveling ripple,
- reverse sound -> inward pull,
- swell -> widening or stretching,
- glitch -> segmented displacement,
- rumble -> slow oscillation,
- transition cue -> temporary fold or twist.

Because the text is attached to the plane, the words warp naturally with it.

The sound is not merely changing font properties. It is changing the geometry carrying the text.

## Effect Lifecycle

A deformation should normally be temporary.

Suggested phases:

- attack,
- peak,
- sustain,
- release,
- settle.

Example:

```json
{
  "effect": "plane-ripple",
  "target": "credit-text-plane",
  "attackMs": 80,
  "durationMs": 650,
  "releaseMs": 400,
  "strength": 0.7
}
```

Afterward the transparent plane returns to its authored base shape unless the event explicitly changes persistent state.

## Event Sources

Warping may eventually be driven by:

- authored timeline markers,
- sound-effect start events,
- beat markers,
- audio envelopes,
- frequency-band analysis,
- API calls,
- or scripted scene events.

The initial implementation should prioritize deterministic authored cues.

## Readability Modes

Two modes should exist.

### Cinematic readable

Warping is limited so the crawl remains easy to read.

### Expressive distortion

Text may stretch, skew, fold, disappear around curves, fragment visually, or become briefly abstract.

This distinction should be intentional and configurable.

## Architectural Separation

This system should remain separate from the karaoke/timed-performance format.

The karaoke system may later provide timing events to it, but the warped text plane should be reusable for:

- credits,
- narration,
- lyrics,
- memories,
- dedications,
- transitions,
- story passages,
- scene introductions,
- atmospheric writing,
- and cinematic overlays.

## Suggested API Shape

```js
creditTextPlane.create({
  id: "memory-crawl",
  visiblePlane: false,
  transparent: true,
  direction: "up",
  tilt: 58,
  curvature: 0.18,
  speed: 0.42,
  readabilityMode: "cinematic"
});

creditTextPlane.setText("memory-crawl", text);

creditTextPlane.triggerEffect("memory-crawl", {
  type: "ripple",
  strength: 0.65,
  durationMs: 900
});
```

## Editor Behavior

For authoring, the editor may temporarily show:

- mesh wireframe,
- bounds,
- control points,
- deformation handles,
- entrance/exit edges,
- text UV guides,
- and preview paths.

At runtime these guides disappear and the carrier remains transparent.

## Acceptance Criteria

The first useful implementation should support:

1. a transparent text carrier plane,
2. upward scrolling text,
3. plane tilt controlling perspective,
4. at least one curvature control,
5. text following live plane deformation,
6. one sound- or event-triggered warp effect,
7. return-to-base geometry after the effect,
8. optional debug visualization,
9. no requirement that the plane itself be visible,
10. separation from karaoke-specific logic.

## Design Principle

The text should feel like it belongs to the world.

The plane is usually invisible.

The words are what the viewer sees.

The plane is what gives those words shape.

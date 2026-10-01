# Proposal: Music Flow — Simple Listener Controls over a Composable Playback Program

## Status

Early architecture proposal for `blog-5` / WebRev spatial presentations.

This is intentionally a starting point. The goal is to establish a clean vocabulary and API direction now, then expand it later once the presentation/journey system is more settled.

## Summary

WebRev should support music behavior that is:

- intuitive for ordinary listeners
- simple enough to control from a right-click menu
- expressive enough for advanced creators
- composable enough for developers to build arbitrarily complex playback behavior later

The user-facing concept should be called **Music Flow**.

The internal developer-facing concept can remain a **Playback Program** composed from small playback instructions.

The central design principle is:

> Simple actions compose into complex behavior.

The UI should never become the architecture.

The API should be the architecture, and the right-click menu should simply generate API instructions.

## Why "Music Flow"

Terms such as "pin" or "program" are useful internally but can feel technical or permanent.

Listeners already understand concepts like:

- Play next
- Repeat
- Queue
- Mix
- Stay here
- Continue
- Move on

These should be the language exposed in the experience UI.

Internally, those actions map to explicit machine-readable playback instructions.

## Listener-Facing Vocabulary

Initial vocabulary:

### Play next

Play a selected song once, then resume the current Music Flow.

### Play for…

Play a selected song for a chosen number of plays.

Example:

```
Play October for 3 plays
```

After the requested plays finish, normal playback resumes unless another instruction follows.

### Queue

Play selected songs in a chosen order.

Example:

```
October
Amor
Time
```

### Mix

Choose songs from a pool according to the normal fallback/randomization rules.

A Mix may come from:

- globally unassigned songs
- a named pool
- selected songs
- future custom sources

### Repeat

Repeat a song, queue, mix, or other instruction.

### Avoid

Temporarily exclude songs according to policy.

Examples:

- avoid last 2 played songs
- avoid songs already represented on this plane
- avoid a named set
- future custom exclusions

### Stay

Control how long the presentation remains on the current plane.

Examples:

- stay for 2 full cycles
- stay for 10 songs
- stay until 75% of the eligible catalog has played

### Continue

Return to the normal/default Music Flow.

### Travel

Move to another plane using a selected travel strategy.

Supported core travel strategies:

- `teleport`
- `roller-coaster`
- `custom`

### Custom

Developer extension point for behavior not built into the core engine.

## Example Listener Experience

A creator right-clicks an unpaired GLB and selects:

```
Music Flow
  Play this song
  Play for…
  Queue songs…
  Mix after this
  Stay on this plane…
  Then continue normally
```

A simple configuration might read:

```
Play October 3×
Then Amor
Then Mix
Stay here for 10 songs
Then Roller Coaster to next plane
```

The creator does not need to understand the internal playback scheduler.

## Internal Model

The engine should represent Music Flow as a list or graph of composable instructions.

Illustrative type:

```ts
type PlaybackInstruction =
  | {
      type: "play";
      track: string;
      repeat?: number;
    }
  | {
      type: "queue";
      tracks: string[];
      repeat?: number;
    }
  | {
      type: "mix";
      source: "unassigned" | "pool" | "tracks";
      poolId?: string;
      tracks?: string[];
      count?: number;
      order?: "ordered" | "random";
      avoidRecent?: number;
      avoidCurrentPlane?: boolean;
    }
  | {
      type: "stay";
      policy:
        | { mode: "cycles"; value: number }
        | { mode: "songs"; value: number }
        | { mode: "coverage"; value: number };
    }
  | {
      type: "travel";
      mode: "teleport" | "roller-coaster" | "custom";
      destination: "next" | "previous" | string;
      customTravelId?: string;
    }
  | {
      type: "continue";
    }
  | {
      type: "custom";
      id: string;
      options?: Record<string, unknown>;
    };
```

This shape is illustrative and may evolve.

## Playback Program

A complete Music Flow can be represented as:

```ts
type PlaybackProgram = {
  instructions: PlaybackInstruction[];
};
```

Example:

```json
{
  "instructions": [
    {
      "type": "play",
      "track": "october.mp3",
      "repeat": 3
    },
    {
      "type": "queue",
      "tracks": [
        "amor.mp3",
        "time.mp3"
      ]
    },
    {
      "type": "mix",
      "source": "unassigned",
      "count": 5,
      "order": "random",
      "avoidRecent": 2,
      "avoidCurrentPlane": true
    },
    {
      "type": "stay",
      "policy": {
        "mode": "songs",
        "value": 10
      }
    },
    {
      "type": "travel",
      "mode": "roller-coaster",
      "destination": "next"
    }
  ]
}
```

## Temporary vs Permanent Pairing

A major distinction must remain clear.

### Fixed pairing

A GLB may have a permanent/default paired song.

That song remains the normal song for that object.

### Temporary Music Flow instruction

A user may choose another song for the object for a limited number of plays.

Example:

```
Play Amor here 3×
Then continue normally
```

This should not rewrite the GLB's permanent pairing.

It is a runtime or presentation-level instruction layered above the base pairing.

## Unpaired GLB Behavior

The current fallback behavior remains useful as the default Mix behavior.

An unpaired GLB should normally choose from:

```
globally unassigned songs
  - recently played songs
  - songs already represented on the current plane
  = preferred fallback pool
```

Current default:

```
avoidRecent = 2
avoidCurrentPlane = true
```

If the preferred pool is exhausted, the resolver may relax constraints in a defined order while remaining inside the globally unassigned pool.

## Fresh Resolution on Repeated Visits

An unpaired GLB should not permanently receive one fallback song.

Each encounter should be able to resolve a fresh eligible song.

This enables:

- multiple cycles on one plane
- a plane exposing many songs over time
- repeated visits producing different music
- long-running presentations without obvious repetition

## Plane Residency

Music Flow should cooperate with the existing plane residency system.

Supported policies:

### Cycles

```json
{
  "mode": "cycles",
  "value": 2
}
```

Stay for 2 full object/song cycles.

### Songs

```json
{
  "mode": "songs",
  "value": 10
}
```

Stay until 10 songs have played.

### Coverage

```json
{
  "mode": "coverage",
  "value": 75
}
```

Stay until approximately 75% of the eligible catalog has been represented.

## Travel Strategies

Music Flow should not assume only one way of moving between planes.

Core travel strategy names:

### teleport

Instant/programmatic navigation.

Intended for:

- editor actions
- direct API navigation
- development/debugging
- non-cinematic transitions

### roller-coaster

Built-in cinematic rail transition.

Intended for the normal audience journey.

### custom

Developer-defined transition.

Example:

```ts
setPlaneTravelMode("custom", "fade-through-stars");
```

The core runtime should expose a stable hook/event so custom travel systems can be implemented without rewriting the journey scheduler.

Unhandled custom travel should fail safely to a defined fallback, preferably `roller-coaster`.

## API Direction

The current API already contains useful primitives:

```
sequence
pools
repeat
order
residency
travelMode
```

These should evolve into a clearer instruction-based layer rather than be discarded.

Suggested future API:

```ts
getPlaybackProgram(): PlaybackProgram;

setPlaybackProgram(program: PlaybackProgram): PlaybackProgram;

appendPlaybackInstruction(
  instruction: PlaybackInstruction
): PlaybackProgram;

prependPlaybackInstruction(
  instruction: PlaybackInstruction
): PlaybackProgram;

removePlaybackInstruction(
  instructionId: string
): PlaybackProgram;

clearPlaybackProgram(): PlaybackProgram;
```

Object-specific temporary Music Flow:

```ts
setObjectPlaybackProgram(
  assetName: string,
  program: PlaybackProgram
): PlaybackProgram;

getObjectPlaybackProgram(
  assetName: string
): PlaybackProgram | null;

clearObjectPlaybackProgram(
  assetName: string
): void;
```

Plane-level Music Flow:

```ts
setPlanePlaybackProgram(
  stationId: string,
  program: PlaybackProgram
): PlaybackProgram;
```

Presentation-wide Music Flow:

```ts
setGlobalPlaybackProgram(
  program: PlaybackProgram
): PlaybackProgram;
```

## Precedence

The scheduler needs a documented priority order.

Suggested initial precedence:

```
temporary object instruction
↓
plane Music Flow instruction
↓
presentation/global Music Flow instruction
↓
fixed GLB pairing
↓
unpaired fallback Mix
```

A future version may make precedence configurable.

## Resume Semantics

Every temporary instruction should be explicit about what happens afterward.

Default behavior:

```
temporary instruction completes
↓
resume prior Music Flow
```

This enables:

```
Play October 3×
Then resume
```

without rewriting the underlying presentation.

The internal model may represent this with a stack, continuation, or instruction pointer.

## Right-Click Menu Philosophy

The right-click menu should remain approachable.

Do not expose the entire engine grammar at once.

Suggested simple menu:

```
Music Flow

Play this
Play for…
Play next
Queue…
Mix after this
Stay here…
Travel after…
Continue normally
```

Advanced configuration can later open a dedicated editor.

The important architectural rule:

> The menu generates API instructions. It does not contain playback logic itself.

## Future Advanced Editor

Later, creators may need a dedicated visual Music Flow editor.

Possible representation:

```
[ Play October ×3 ]
        ↓
[ Queue: Amor → Time ]
        ↓
[ Mix unassigned ×5 ]
        ↓
[ Stay until 75% ]
        ↓
[ Roller Coaster → Next ]
```

This editor could eventually support:

- drag-and-drop ordering
- nested groups
- conditional branches
- reusable named pools
- reusable macros
- developer-defined custom nodes

## Extensibility

The engine should avoid enumerating every possible future behavior in one enormous type.

Instead, the core should offer a small number of stable primitives plus custom extension points.

Suggested philosophy:

```
simple core primitives
+
composition
+
custom instructions
=
open-ended behavior
```

This allows developers to build upward indefinitely.

## Relationship to Presentation Manifest

Music Flow programs should be serializable into the future `PresentationManifest`.

Example:

```json
{
  "musicFlow": {
    "instructions": [
      {
        "type": "play",
        "track": "october.mp3",
        "repeat": 3
      },
      {
        "type": "mix",
        "source": "unassigned",
        "avoidRecent": 2,
        "avoidCurrentPlane": true
      }
    ]
  }
}
```

This allows Edit Mode to author Music Flow and Presentation Mode to reproduce it exactly.

## Versioning

Music Flow instructions should be versionable.

Suggested:

```json
{
  "schemaVersion": 1,
  "kind": "webrev-music-flow"
}
```

Old playback programs should eventually be migrated/normalized rather than silently broken.

## Acceptance Direction

The first implementation does not need every advanced feature.

A good initial milestone is:

1. listener-facing term is **Music Flow**
2. API formalizes a playback instruction type
3. `play`, `queue`, `mix`, `stay`, `travel`, and `continue` exist as conceptual primitives
4. temporary instructions do not overwrite permanent pairings
5. unpaired GLBs continue resolving fresh fallback songs
6. recent-song and current-plane exclusions remain configurable
7. plane residency remains configurable
8. travel remains explicitly separated into `teleport`, `roller-coaster`, and `custom`
9. all programs remain JSON-serializable
10. the right-click menu remains simple and maps directly to the API

## Long-Term Direction

The long-term architecture is not a traditional playlist.

It is a small declarative **spatial media orchestration system**.

The presentation engine should be able to express flows such as:

```
Play A ×2
→ Queue B, C
→ Mix unassigned songs ×4
→ Stay until 70% catalog coverage
→ Play D
→ Custom transition
→ Next plane
```

while ordinary users only need to understand:

```
Play
Queue
Mix
Repeat
Stay
Continue
Travel
```

That balance — simple vocabulary over a composable API — is the core design goal.

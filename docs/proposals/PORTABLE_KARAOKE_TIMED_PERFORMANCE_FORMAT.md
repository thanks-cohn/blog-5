# Proposal: Portable Karaoke and Timed-Performance Format

## Status

Proposed for `blog-5` as a foundational media format and API contract.

## Summary

The long-term goal is not merely to add karaoke to blog-5.

The goal is to define a **portable, standardized timed-performance format** that can be authored once, consumed by blog-5, and also remain useful outside of WebRev/AEXIS.

The format should describe:

- the canonical media timeline
- timed text
- sections
- paragraphs
- lines
- words
- optional syllables
- synchronization offsets
- optional presentation metadata
- optional provider metadata

The core format should be platform-agnostic.

YouTube is the first reference media provider because it gives creators a simple, portable canonical source without requiring them to download or host the underlying video themselves.

WebRev then becomes one sophisticated consumer of the format, using the timed data to render spatial karaoke, object choreography, embedded media floors, effects, camera behavior, and journey orchestration.

## Core Principle

> The choreography belongs to the recording timeline, not to YouTube.

YouTube is a transport and player.

The timed-performance file is the portable authored artifact.

If the same recording is later supplied through another compatible source with the same timeline and offset, the performance should behave the same way.

## First Implementation Contract

The simplest supported package should require:

1. a canonical YouTube video reference
2. a portable karaoke/performance file
3. a defined synchronization origin

For example:

```text
performance time 0.000
=
YouTube time 4.820
```

The timed-performance data is then evaluated against the media clock.

## Media-Driven Synchronization

The player clock is authoritative.

The engine should not merely start two independent clocks at the same moment and hope they remain synchronized.

Instead:

```text
media currentTime
        |
        v
timed-performance resolver
        |
        +--> active line
        +--> active word
        +--> active syllable
        +--> active animation
        +--> object cue
        +--> camera cue
        +--> presentation state
```

This allows the experience to remain synchronized through:

- pause
- resume
- seek
- buffering
- restart
- loop
- playback-rate changes where supported
- minor clock drift

If the media jumps directly to 155 seconds, the renderer should reconstruct the correct performance state for 155 seconds instead of simulating every cue that occurred before it.

## Portable Core vs WebRev Extensions

The portable core should avoid requiring WebRev-specific spatial concepts.

A third-party player should be able to ignore WebRev extensions and still understand the karaoke timing.

Conceptually:

```json
{
  "format": "aexis-performance",
  "version": "1.0",
  "media": {},
  "metadata": {},
  "sections": [],
  "lines": [],
  "extensions": {}
}
```

The `extensions` object may contain optional implementation-specific information.

For example:

```json
{
  "extensions": {
    "webrev": {
      "surface": "background",
      "enter": "fade-rise",
      "karaokeStyle": "progressive"
    }
  }
}
```

A generic player can ignore that block.

WebRev can use it.

## Canonical Media Reference

The performance should identify the recording against which it was authored.

Initial form:

```json
{
  "media": {
    "canonical": {
      "provider": "youtube",
      "id": "VIDEO_ID"
    },
    "offset": 4.82
  }
}
```

Possible future form:

```json
{
  "media": {
    "canonical": {
      "provider": "youtube",
      "id": "VIDEO_ID",
      "duration": 243.81
    },
    "offset": 4.82,
    "alternates": [
      {
        "provider": "local",
        "key": "song.mp4",
        "offset": 4.82
      },
      {
        "provider": "cloudflare-r2",
        "key": "library/song.mp4",
        "offset": 4.82
      }
    ]
  }
}
```

The format therefore does not fundamentally depend on YouTube.

YouTube is simply the first canonical reference provider.

## Timing Granularity

The format should support several optional levels of timing detail:

```text
recording
  -> sections
      -> paragraphs
          -> lines
              -> words
                  -> syllables
```

A basic file may contain only line-level timing.

A more precise file may include word timing.

A highly authored karaoke file may include syllable timing.

No consumer should require the most detailed representation when a simpler one is sufficient.

## Example Portable File

```json
{
  "format": "aexis-performance",
  "version": "1.0",

  "media": {
    "canonical": {
      "provider": "youtube",
      "id": "VIDEO_ID"
    },
    "offset": 4.82
  },

  "metadata": {
    "title": "Example Song",
    "artist": "Example Artist"
  },

  "sections": [
    {
      "id": "verse-1",
      "type": "verse",
      "start": 12.4,
      "end": 31.8
    }
  ],

  "lines": [
    {
      "id": "verse-1-line-1",
      "section": "verse-1",
      "start": 12.4,
      "end": 16.8,
      "text": "Example lyric line",
      "words": [
        {
          "text": "Example",
          "start": 12.4,
          "end": 13.6
        },
        {
          "text": "lyric",
          "start": 13.6,
          "end": 14.8
        },
        {
          "text": "line",
          "start": 14.8,
          "end": 16.8
        }
      ]
    }
  ]
}
```

## Presentation Model in blog-5

blog-5 should use the portable file as performance data, then apply its own spatial presentation system.

The intended first signature composition is:

```text
BACK / FREE SPACE
-> karaoke and timed text

CENTER
-> focal GLB / object

FLOOR PLANE
-> embedded canonical video
```

The karaoke remains behind or around the focal object.

The embedded source video becomes the floor beneath the object.

The video does not need to be a karaoke video.

It may simply be:

- the original music video
- an album-art upload
- a performance video
- a lyricless visual
- another source representing the same canonical recording

The timed-performance file supplies the karaoke independently.

## Near-Term vs Future Presentation Scope

The immediate implementation priority remains the independent music and orchestration system.

The embedded-video floor should be treated as a later presentation layer, not a prerequisite for the first music journey work.

The intended progression is:

```text
independent music engine
-> journey orchestration
-> portable timed-performance format
-> media-backed presentation surfaces
-> embedded video floor
-> richer camera-aware spatial performances
```

This preserves a clean foundation and prevents the visual layer from becoming coupled to basic playback logic.

## Embedded Video Floor

For YouTube-backed performances, blog-5 should be able to place the embedded video visually as the floor plane beneath the focal object.

Conceptually:

```text
              timed text

              [ GLB ]

          /-------------\
         /  YouTube      \
        /   video floor   \
       /-------------------\
```

The implementation should preserve the media player's actual playback semantics while visually integrating the player into the spatial composition.

The player remains the timing authority.


## Camera-Aware Video Floor

The floor video should belong to the focal object's presentation rig.

It should not behave like an unfinished static rectangle left behind in world space when the camera moves.

At the same time, it should not become a flat screen-locked HUD element.

The goal is a spatial surface that remains convincingly underneath the object while dynamically maintaining a strong relationship to the active camera.

Conceptually:

```text
Object Presentation Rig
├─ focal object
├─ rear karaoke surface
├─ floor video surface
└─ camera-relative presentation rules
```

When the camera travels, rotates, approaches, or leaves the object, the floor may adapt its orientation, perspective, apparent size, distance, tilt, visibility, and framing while continuing to read as a spatial floor beneath the object.

The desired behavior is:

```text
camera travels
      |
      v
presentation rig adapts
      |
      v
video remains a deliberate visible floor
```

rather than:

```text
camera travels
      |
      v
video becomes a tiny, unreadable, accidental trapezoid
```

Possible future configuration:

```ts
floorPresentation: {
  followCamera: true,
  keepUnderObject: true,
  maintainReadability: true,
  minScreenCoverage: 0.22,
  maxTilt: 68
}
```

These values are illustrative. The underlying principle matters more than the exact API.

### Living-Screen Aesthetic

A long-term visual inspiration is the feeling of a world populated by active screens and media surfaces: many displays producing synchronized visual material as part of the environment rather than appearing as ordinary UI panels.

The intended aesthetic is a dense animated-media environment in which screens are embedded into the world, media continues while the camera moves, and video surfaces become part of the scene's identity.

As the camera travels between objects, glimpses of active floor videos should make the world feel inhabited by simultaneous performances rather than expose unfinished geometry or inactive presentation surfaces.


## Separation of Responsibilities

The architecture should keep four concerns distinct.

### Media

Where the song or video comes from.

Examples:

- YouTube
- local audio
- local video
- Cloudflare R2
- MEGA
- another provider

### Performance File

What occurs at each timestamp.

Examples:

- active lyric line
- word highlighting
- syllable highlighting
- paragraph reveal
- animation hints
- cue metadata

### Presentation

Where and how those cues appear.

Examples:

- background karaoke
- floor video
- text motion
- object choreography
- camera movement
- visual effects

### Journey

What performance comes before or after this one.

Examples:

- next song
- next playlist
- restart
- overflow
- repeat
- stop
- jump to another checkpoint

This separation keeps each layer understandable and reusable.

## Musical Timing

The format may support both absolute time and musical time.

Absolute timing:

```json
{
  "start": 12.4,
  "end": 16.8
}
```

Optional musical metadata:

```json
{
  "music": {
    "bpm": 148,
    "meter": "4/4",
    "beatOffset": 0
  }
}
```

Presentation extensions may then describe motion in beats rather than seconds:

```json
{
  "duration": {
    "beats": 2
  }
}
```

This allows animations to naturally follow musical tempo while preserving exact media synchronization.

## Platform-Agnostic Goal

The standard should be useful even without blog-5.

A compliant third-party player should be able to consume the portable core and implement:

- line karaoke
- word karaoke
- syllable karaoke
- timed captions
- timed poetry
- timed spoken-word presentations

without needing to understand WebRev's spatial engine.

Likewise, blog-5 should not require files to have been authored inside blog-5.

A valid timed-performance file produced elsewhere should be loadable into the project.

## Optional Interchange

Where useful, import/export adapters may later support existing timed-text ecosystems.

Potential adapters may include:

- LRC
- WebVTT
- TTML
- SRT
- ASS/SSA
- other karaoke or subtitle formats

These should be treated as interoperability layers rather than limiting the native format to the least-common-denominator capabilities of older formats.

The native format may preserve richer structure while still offering conversion paths.

## Stable IDs and Versioning

Every authored entity should support stable identifiers.

Examples:

```text
section: verse-1
paragraph: verse-1-p1
line: verse-1-line-2
word: verse-1-line-2-word-4
```

The format must include an explicit version field.

Future revisions should favor additive evolution and compatibility.

Consumers should ignore unknown optional extension fields whenever safe.

## Validation

A validator should eventually be able to identify:

- invalid or overlapping ranges
- end times before start times
- words outside their parent line
- syllables outside their parent word
- references to missing sections
- invalid media offsets
- malformed provider references
- unsupported required extensions

Validation should distinguish errors from warnings.

## Authoring Philosophy

The format should be easy to produce at several sophistication levels.

### Minimal

```text
YouTube URL
+ line text
+ line start/end times
```

### Better

```text
sections
+ line timing
+ word timing
```

### Advanced

```text
paragraphs
+ words
+ syllables
+ musical metadata
+ animation hints
+ WebRev presentation extensions
```

This allows both casual creators and highly precise authors to use the same standard.

## Relationship to the Journey Orchestration API

The timed-performance format and Journey API should remain separate but composable.

The Journey system answers:

> What should play next?

The timed-performance format answers:

> What should happen at this moment inside the current performance?

This means the same performance file may be placed inside many different journeys.

Likewise, the same journey engine may orchestrate media that has no karaoke file at all.

## Future API Shape

Conceptually:

```ts
interface TimedPerformance {
  format: string;
  version: string;
  media: MediaReference;
  metadata?: PerformanceMetadata;
  sections?: SectionCue[];
  paragraphs?: ParagraphCue[];
  lines: LineCue[];
  extensions?: Record<string, unknown>;
}

interface PerformanceClock {
  currentTime(): number;
  duration(): number | null;
  seek(time: number): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
}

interface PerformanceResolver {
  resolve(time: number): ResolvedPerformanceState;
}
```

The renderer should consume `ResolvedPerformanceState`, not depend directly on YouTube.

That is how provider independence is maintained.

## Long-Term Vision

The end vision is a family of portable karaoke and timed-performance files that work naturally inside blog-5 but are not trapped inside it.

A creator should be able to publish:

```text
canonical media reference
+
portable performance file
```

and any compatible consumer should have enough information to faithfully reproduce the timed text performance.

WebRev then adds its own strengths:

- spatial presentation
- embedded video floors
- focal objects
- camera choreography
- timed effects
- multi-plane journeys
- playlist orchestration
- overflow behavior
- deep programmable control flow

The standard should remain simpler than the applications built on top of it.

## Design Goal

Build the karaoke/performance format as a durable foundation:

- portable
- standardized
- provider-independent
- deterministic
- inspectable
- versioned
- extensible
- easy to author at a basic level
- capable of extreme precision when desired
- useful inside and outside WebRev

The first implementation may be centered on YouTube, but the format itself should be designed so that YouTube can eventually be replaced by any media provider capable of exposing the same recording timeline.

That is the core architectural commitment.

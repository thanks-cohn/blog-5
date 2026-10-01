# Proposal: Oversphere Cinematic Mode

## Status

Proposal only.

This proposal extends the generic Spatial Media Envelope system with a long-form **Cinematic Mode** intended for movie-night-style playback.

It is deliberately built as a reusable mode over the existing media-envelope API rather than as a project-specific video hack.

---

## Intent

A creator should be able to provide a media URL and enter a cinematic presentation in which the envelope moves closer to the viewer and becomes a large, fully visible curved movie surface.

The intended feeling is:

> the movie is over us rather than merely playing on a flat rectangle in front of us.

The media should remain completely visible, readable, and comfortably framed even while following the curvature of the envelope.

Initial sources may be ordinary HTTPS MP4/WebM URLs, including CDN or Cloudflare-hosted media.

---

## Core behavior

Cinematic Mode should:

1. accept an explicit media URL;
2. resolve it through the ordinary media-source/provider contract;
3. create or reuse a Spatial Media Envelope;
4. bring the envelope surface inward toward the viewer;
5. reserve enough angular area for the entire movie frame;
6. preserve the movie's aspect ratio;
7. keep the whole frame visible instead of cropping it into a normal oversphere tile;
8. use inward-facing curved geometry so the image feels overhead/around the viewer;
9. provide ordinary video controls through the runtime API;
10. cleanly restore the prior presentation state on exit.

The first implementation can support direct MP4/WebM URLs. Provider adapters such as HLS/DASH/YouTube-like sources can remain separate concerns.

---

## Relationship to ordinary Oversphere playback

Normal oversphere behavior currently treats video as one media tile selected during focused object/song playback.

Cinematic Mode is different:

- it is intentional long-form viewing;
- it prioritizes full-frame visibility over grid placement;
- the envelope may move substantially closer;
- the media surface may occupy most of the usable visual hemisphere;
- normal randomized oversphere selection should pause or yield while cinematic playback is active.

It should still use the same underlying media-envelope contracts for media source, lifecycle, rendering, debugging, and cleanup.

---

## Proposed API

Illustrative only:

```ts
type CinematicModeSource = {
  src: string;
  type?: "video";
  title?: string;
};

type CinematicModeConfig = {
  source: CinematicModeSource;

  envelope?: {
    shape?: "sphere";
    distanceMode?: "cinematic-fit" | "explicit";
    distance?: number;
    curvature?: number;
  };

  framing?: {
    mode?: "contain";
    preserveAspectRatio?: boolean;
    horizontalCoverageDeg?: number;
    verticalCoverageDeg?: number;
    safePaddingDeg?: number;
  };

  playback?: {
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    volume?: number;
    startAtSeconds?: number;
  };

  environment?: {
    dimWorld?: boolean;
    dimAmount?: number;
    suppressOrdinaryOversphere?: boolean;
  };
};
```

Runtime direction:

```ts
api.enterCinematicMode(config)
api.exitCinematicMode()

api.getCinematicModeState()

api.playCinematicMedia()
api.pauseCinematicMedia()
api.seekCinematicMedia(seconds)
api.setCinematicVolume(volume)
```

The generic media-envelope API should remain the lower-level primitive. Cinematic Mode is a convenience orchestration layer.

---

## Cinematic fit

The most important rendering rule is **full movie visibility**.

The renderer should solve envelope placement from:

- viewer/camera position;
- desired movie aspect ratio;
- viewport aspect ratio;
- safe padding;
- maximum desired angular coverage;
- sphere curvature;
- current camera orientation.

The result should place the movie close enough to feel immersive while still keeping the complete rectangle visible.

Conceptually:

```text
viewer
  ↓
cinematic-fit resolver
  ↓
closest comfortable envelope distance
that still contains the complete media frame
inside the protected viewing area
```

This differs from normal oversphere radius calculation, which is primarily concerned with enclosing scene composition.

---

## Curved full-frame surface

The movie should not be split into unrelated grid tiles.

A recommended first implementation is one large tessellated patch projected onto the inside of the sphere.

Requirements:

- preserve UV continuity;
- preserve source aspect ratio;
- no arbitrary tangent rotation;
- world-up remains visually stable;
- center of the movie remains approximately in the viewer's principal viewing direction;
- curvature should be adjustable;
- a zero/low-curvature option may later flatten the patch while retaining cinematic positioning.

---

## Movie Night behavior

A presentation may expose an action such as:

```text
Movie Night ♥
```

or equivalent project-authored UI.

Entering Movie Night could:

- suspend ordinary focus-song advancement;
- suspend random oversphere-video selection;
- dim or visually quiet the surrounding world;
- move the cinematic envelope inward;
- start the supplied movie URL;
- retain Escape / explicit exit behavior;
- restore the prior focus/journey/audio state when finished or exited.

The exact UI label is presentation-specific. The engine contract should only expose the mode.

---

## URL sources

Cinematic Mode should accept ordinary URLs rather than requiring repository-hosted media.

Example:

```ts
api.enterCinematicMode({
  source: {
    src: "https://cdn.example.com/movie-night/movie.mp4",
    type: "video"
  }
});
```

The runtime should not special-case Cloudflare. It should consume a normal URL and let provider/network rules remain external.

The host must still supply browser-compatible playback behavior such as correct MIME types and any necessary CORS/range support.

---

## Cinematic audio policy

Cinematic Mode should treat **the video's own audio as a first-class soundtrack source**.

The default movie-night behavior should be:

- video audio enabled;
- ordinary music-player playback paused or muted while the cinematic source is active;
- the prior music-player state remembered so it can resume cleanly when Cinematic Mode exits.

However, Cinematic Mode should also support a deliberate layered-audio option for more experimental presentations.

A creator may choose to keep the ordinary music playlist running underneath the video at a reduced volume while the movie audio remains primary.

Illustrative policy:

```ts
type CinematicAudioPolicy =
  | {
      mode: "video-only";
      videoVolume?: number;
      suspendMusicPlayer?: true;
    }
  | {
      mode: "video-with-background-music";
      videoVolume?: number;
      musicVolume?: number;
      keepPlaylistAdvancing?: boolean;
    }
  | {
      mode: "music-only";
      videoMuted?: true;
      musicVolume?: number;
    };
```

The normal default should be equivalent to:

```ts
{
  mode: "video-only",
  videoVolume: 1,
  suspendMusicPlayer: true
}
```

A more playful presentation could instead request:

```ts
{
  mode: "video-with-background-music",
  videoVolume: 1,
  musicVolume: 0.15,
  keepPlaylistAdvancing: true
}
```

This allows the existing playlist to continue in the same presentation context at low volume without requiring the cinematic video to be paired to a song.

The audio sources must remain independently controllable. Cinematic Mode should not merge them into one hidden gain value.

Recommended runtime controls:

```ts
api.setCinematicAudioPolicy(policy)
api.getCinematicAudioPolicy()

api.setCinematicVideoVolume(volume)
api.setCinematicBackgroundMusicVolume(volume)
```

When Cinematic Mode exits, the runtime should restore the prior music-player state and volume unless the caller explicitly requests otherwise.

This distinction is important:

```text
cinematic video
  ├─ visual source
  └─ primary movie audio

ordinary music player
  └─ optional independent background layer
```

The cinematic source therefore does **not** need a song pairing to have audio.

---

## Intermission location policy

If Cinematic Mode keeps the ordinary playlist running underneath the movie, it may also expose a location choice for intermissions.

The intended audience-facing choice is conceptually:

```text
Stay at Location
Change Location During Intermission
```

This should be an explicit cinematic policy rather than an automatic side effect of playlist advancement.

A useful API shape is:

```ts
type CinematicIntermissionLocationPolicy =
  | {
      mode: "stay";
    }
  | {
      mode: "change-during-intermission";
      travelMode?: "inherit" | "teleport" | "roller-coaster" | "custom";
      customTravelId?: string;
    };
```

Behavior:

- `stay` keeps the current plane/location fixed for the entire cinematic session;
- `change-during-intermission` allows location travel only while the movie is in an intermission state;
- the movie itself must not continue visually while the travel transition is happening unless explicitly authored;
- once travel finishes, the cinematic surface is re-resolved for the new location and the movie resumes from the same playback position or the next authored chapter/intermission boundary;
- the underlying playlist may continue advancing during the intermission when its audio policy allows it;
- location travel must never be triggered merely because a background song ended while the movie is actively playing.

This preserves the distinction between:

```text
movie playback clock
playlist/music clock
world/location journey clock
```

They may interact, but none should silently control the others.

Suggested runtime methods:

```ts
api.getCinematicIntermissionLocationPolicy()
api.setCinematicIntermissionLocationPolicy(policy)

api.beginCinematicIntermission()
api.endCinematicIntermission()
```

A future authored intermission could also define:

```ts
{
  atSeconds: 3600,
  durationSeconds: 600,
  allowLocationChange: true
}
```

or chapter-based boundaries.

The default should remain conservative:

```ts
{ mode: "stay" }
```

so entering Cinematic Mode never unexpectedly moves the audience.

---

## Authored intermission programs

Cinematic Mode should support **authored intermission programs**, not merely a binary location switch.

The key rule is that ordinary track changes do **not** have to move the audience.

A cinematic session may keep location completely fixed while background songs continue changing.

Location movement becomes an explicit intermission action rather than an automatic consequence of playlist progress.

For example:

```text
movie playing
↓
background song 1
↓
background song 2
↓
background song 3
↓
background song 4
↓
background song 5
↓
INTERMISSION
↓
optional intermission audio
↓
oversphere intermission clip / animation
↓
optional location transition
↓
custom intermission actions
↓
resume movie
```

This should be expressed as a general authored program.

Illustrative shape:

```ts
type CinematicIntermissionTrigger =
  | { type: "after-songs"; count: number }
  | { type: "movie-time"; atSeconds: number }
  | { type: "chapter"; chapterId: string }
  | { type: "manual" }
  | { type: "custom"; resolverId: string; options?: Record<string, unknown> };

type CinematicIntermissionProgram = {
  id: string;

  trigger: CinematicIntermissionTrigger;

  movie?: {
    pause?: boolean;
    resumeAfter?: boolean;
  };

  music?: {
    keepPlaylistRunning?: boolean;
    intermissionAudioSrc?: string;
    intermissionAudioVolume?: number;
    restorePreviousMusicState?: boolean;
  };

  oversphere?: {
    mediaSrc?: string;
    mediaType?: "video" | "image" | "animation";
    loop?: boolean;
    waitForEnd?: boolean;
    programId?: string;
  };

  location?: {
    mode?: "stay" | "change";
    travelMode?: "inherit" | "teleport" | "roller-coaster" | "custom";
    customTravelId?: string;
    destinationResolverId?: string;
  };

  customActions?: Array<{
    actionId: string;
    options?: Record<string, unknown>;
  }>;
};
```

A simple movie-night configuration might say:

```ts
{
  id: "movie-night-break",
  trigger: {
    type: "after-songs",
    count: 5
  },
  movie: {
    pause: true,
    resumeAfter: true
  },
  music: {
    intermissionAudioSrc: "/audio/intermission.mp3",
    restorePreviousMusicState: true
  },
  oversphere: {
    mediaSrc: "/intermission/break.mp4",
    mediaType: "video",
    waitForEnd: true
  },
  location: {
    mode: "change",
    travelMode: "roller-coaster"
  }
}
```

This produces:

```text
5 songs have elapsed
→ pause movie
→ play intermission audio
→ show intermission media on oversphere
→ travel to next location
→ finish authored intermission actions
→ restore movie surface at new location
→ resume movie
```

### Fixed-location sessions

The location may remain fixed for the entire cinematic session even while:

- songs change;
- playlists advance;
- intermission media plays;
- intermission audio plays.

This should be represented explicitly:

```ts
location: {
  mode: "stay"
}
```

Track progression therefore has no implicit travel authority.

### Custom intermission code

Intermission programs should provide a stable extension point for presentation-specific behavior.

The engine should not attempt to enumerate every possible intermission action.

Instead, creators may register custom actions/resolvers behind explicit identifiers.

Conceptually:

```ts
api.registerCinematicIntermissionAction(
  "lower-the-lights",
  async (context, options) => {
    // presentation-specific behavior
  }
);
```

Then an authored intermission may call it:

```ts
customActions: [
  {
    actionId: "lower-the-lights",
    options: {
      durationMs: 2000
    }
  }
]
```

Possible custom actions include:

- change sky/lighting;
- animate scene objects;
- move the camera;
- open/close doors;
- spawn temporary scenery;
- run dialogue;
- trigger particles;
- alter shaders;
- change music;
- display text;
- wait for viewer interaction;
- call project-specific journey logic;
- perform any future presentation-defined operation.

The core engine only needs the contract, ordering, cancellation, and debugging.

### Intermission visual + playlist pairing

An intermission may pair a **specific oversphere video/animation** with its own temporary playlist.

This does not require the video and playlist to share one playback clock. By default, they simply occupy the same authored intermission window:

```text
intermission starts
├─ play intermission video on oversphere
└─ start intermission playlist
      ↓
both run during the same break
      ↓
intermission completion rule decides when to continue
```

Illustrative configuration:

```ts
{
  id: "movie-night-break",
  trigger: {
    type: "after-songs",
    count: 5
  },

  oversphere: {
    mediaSrc: "/intermission/city-night.mp4",
    mediaType: "video",
    loop: true
  },

  playlist: {
    tracks: [
      "/music/intermission-01.mp3",
      "/music/intermission-02.mp3",
      "/music/intermission-03.mp3"
    ],
    order: "ordered",
    loop: true,
    volume: 0.35
  },

  completion: {
    mode: "manual-or-duration",
    durationSeconds: 600
  }
}
```

The engine should also allow a named playlist/pool instead of embedding track URLs:

```ts
playlist: {
  playlistId: "movie-night-intermission",
  order: "random",
  loop: true,
  volume: 0.25
}
```

Possible playlist policies:

```ts
type CinematicIntermissionPlaylist = {
  playlistId?: string;
  tracks?: string[];
  order?: "ordered" | "random";
  loop?: boolean;
  volume?: number;
  startTrackId?: string;
  keepAdvancing?: boolean;
};
```

The intermission program may then choose how the break ends independently of either media stream:

```ts
type CinematicIntermissionCompletion =
  | { mode: "video-ended" }
  | { mode: "playlist-ended" }
  | { mode: "duration"; durationSeconds: number }
  | { mode: "manual" }
  | { mode: "manual-or-duration"; durationSeconds: number }
  | { mode: "custom"; resolverId: string; options?: Record<string, unknown> };
```

That separation is intentional.

A looping intermission video can continue while several songs play. A short visual can finish while the playlist keeps going. A custom action can decide when the break is complete.

Future tighter synchronization can be authored explicitly, for example:

- advance the video chapter when a track changes;
- start a particular song at a video cue;
- crossfade the playlist when an animation reaches a marker;
- trigger location travel after a selected track ends.

Those are choreography rules layered on top of two independent media clocks rather than assumptions baked into the player.

---

### Intermission execution model

A future runtime should treat the intermission as a small deterministic program.

Suggested lifecycle:

```text
idle
→ triggered
→ pausing-movie
→ intermission-audio
→ intermission-visual
→ optional-travel
→ custom-actions
→ restoring-cinematic-surface
→ resuming-movie
→ idle
```

Individual phases may be omitted.

Actions should be composable and ordered.

A useful future API direction:

```ts
api.listCinematicIntermissionPrograms()
api.setCinematicIntermissionProgram(program)
api.removeCinematicIntermissionProgram(id)

api.beginCinematicIntermission(id)
api.cancelCinematicIntermission()
api.getCinematicIntermissionState()
```

### Debugging

Deep Debug should expose enough information to explain why an intermission started and what it is currently doing:

```ts
{
  active: true,
  programId: "movie-night-break",
  trigger: {
    type: "after-songs",
    count: 5
  },
  songsSinceLastIntermission: 5,
  phase: "intermission-visual",
  locationMode: "change",
  currentActionId: null,
  movieResumeTimeSeconds: 3812.4
}
```

This preserves the engine's existing inspectable/agent-readable philosophy.

---

## Long-form playback lifecycle

Cinematic playback should expose a richer lifecycle than ordinary looping oversphere videos:

```text
inactive
→ entering
→ loading
→ ready
→ playing
→ paused
→ ended
→ exiting
→ inactive
```

Useful events may include:

- `webrev:cinematic-entering`
- `webrev:cinematic-ready`
- `webrev:cinematic-play`
- `webrev:cinematic-pause`
- `webrev:cinematic-ended`
- `webrev:cinematic-exited`

These should be observational events rather than hidden control channels.

---

## Debugging

Deep Debug should eventually expose:

```ts
{
  active: true,
  sourceUrl,
  playbackState,
  currentTime,
  duration,
  resolvedEnvelopeDistance,
  resolvedRadius,
  curvature,
  projectedMovieBounds,
  viewportSafeBounds,
  fullFrameVisible,
  ordinaryOversphereSuppressed
}
```

The debug state should make it obvious why a movie was placed at a particular distance.

---

## Performance

Cinematic Mode normally needs only one active video texture, so it can be simpler than a multi-tile media envelope.

Recommended behavior:

- one decoded long-form video at a time;
- release prior oversphere video textures when cinematic mode suppresses them;
- use the browser video element as the timing/playback authority;
- avoid unnecessarily high tessellation;
- adapt patch tessellation to curvature and display size;
- allow lower-resolution streams where supplied by a future provider.

---

## API layering

The intended architecture is:

```text
Video URL / Provider
        ↓
Media Source
        ↓
Cinematic Mode orchestration
        ↓
Spatial Media Envelope
        ↓
Curved full-frame movie surface
        ↓
Renderer
```

Cinematic Mode should therefore not create a second independent media renderer.

---

## Future directions

The same mode could later support:

- synchronized group/movie-night sessions;
- subtitles/captions;
- stereo or spatial audio;
- HLS/DASH adaptive streaming;
- external provider adapters;
- live streams;
- chapter markers;
- cinematic lighting tied to video color/brightness;
- curved trailers or pre-roll;
- multiple viewers/cameras;
- authored entrance/exit choreography;
- “screen grows over us” transitions;
- temporary world freezing while the movie runs;
- local/remote playback controls.

---

## Acceptance criteria for a future v1

A future implementation is successful when:

1. a creator can provide a direct MP4/WebM URL;
2. the engine enters Cinematic Mode without changing generic renderer architecture;
3. one large curved video patch appears on the inner envelope;
4. the complete frame remains visible;
5. the envelope is visibly closer/more immersive than ordinary oversphere playback;
6. aspect ratio is preserved;
7. ordinary randomized oversphere playback yields while cinematic mode is active;
8. video controls and `ended` state are observable;
9. exit restores the prior presentation state;
10. Deep Debug explains the resolved cinematic placement.


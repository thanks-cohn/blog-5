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


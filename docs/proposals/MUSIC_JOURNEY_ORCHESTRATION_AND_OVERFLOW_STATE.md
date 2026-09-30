# Proposal: Music Journey Orchestration, Create Your Own, and Overflow State

## Status

Proposed for `blog-5 v2`.

## Summary

The visible music experience in blog-5 should remain simple and approachable, while the underlying API supports sophisticated audiovisual orchestration.

The default experience should be immediately understandable:

- Songs are paired with visual items such as GLBs.
- The active song determines the visual focus when a pairing exists.
- Songs play through the current plane in order.
- When a plane is finished, playback continues to the next plane.
- After the final song on the final plane, the entire journey restarts from the first plane by default.
- `Loop Plane` keeps playback on the current plane.
- `Loop All` restores the complete multi-plane journey.
- `Randomize` may alter ordering without requiring the viewer to understand the orchestration model.
- `Create Your Own` exposes a simple visual editor over the same API.

The UX is a simple face over a much richer playback engine.

## Product Principle

> The viewer gets a simple music experience. The API gets an orchestration language.

The right-click UI should expose a small number of understandable controls while allowing developers, agents, presets, and future editors to define arbitrarily complex playback programs underneath.

## Desktop Right-Click Experience

The default desktop context menu should expose:

- Previous Song
- Next Song
- Loop Plane
- Loop All
- Randomize
- Song picker / jump-to-song
- Create Your Own

The user should never need to understand the underlying orchestration schema to use the experience.

## Default Journey Behavior

The normal blog-5 v2 journey is ordered and continuous.

```text
Plane 1
  Song A -> Song B -> Song C
        |
        v
Plane 2
  Song D -> Song E
        |
        v
Plane 3
  Song F -> Song G
        |
        v
restart at Plane 1 / Song A
```

The default end behavior is `restart`, not `stop`.

This makes the world feel perpetual rather than like a conventional playlist that reaches an endpoint and dies.

## Visual Handoff Rule

Playback progression is not merely audio progression.

When the next song has a visual pairing:

1. Resolve the paired plane and visual item.
2. Move to that plane if necessary.
3. Focus the paired item.
4. Begin or continue the associated focus experience.
5. Play the selected song.

Audio and visual journey state should therefore be orchestrated together.

## Create Your Own

The desktop context menu should include:

`Create Your Own...`

This opens a compact playlist/journey builder.

```text
CREATE YOUR OWN

[ + Add Songs ]

Playlists
-----------------------
[ + New Playlist ]

Morning
Favorites
Weird Ones

Journey
-----------------------
1. Morning
2. Favorites
3. Weird Ones

After Journey
[x] Restart from beginning

[ Play ]
```

Users should be able to:

- add songs from their device
- create multiple playlists
- reorder songs within a playlist
- reorder playlists within a journey
- choose ordered or randomized playback
- choose repeat behavior
- play the result immediately

Restart-from-beginning should be the default.

## Playlist-of-Playlists Model

A Journey can contain multiple playlists.

```text
Journey
  -> Playlist A
  -> Playlist B
  -> Playlist C
  -> restart Journey
```

Each playlist can have independent behavior.

```text
Playlist A
  order: ordered
  songs: 1, 2, 3

Playlist B
  order: random
  songs: 4, 7, 9

Playlist C
  order: ordered
  songs: 5, 6
```

The journey can then simply be:

```text
A -> B -> C -> restart
```

## Overflow State

A core requirement is that a user's journey may contain more songs than there are visual items with explicit song pairings.

This must not be treated as an error.

It is a first-class playback condition called **Overflow State**.

### Rule

A song-to-item pairing is persistent and is never destroyed simply because the active journey contains unpaired songs.

If the journey contains:

```text
Song 1 -> Song 2 -> Song 3 -> Song 4 -> Song 5
```

and only Songs 1, 2, and 5 have pairings:

```text
Song 1 -> paired visual
Song 2 -> paired visual
Song 3 -> OVERFLOW
Song 4 -> OVERFLOW
Song 5 -> paired visual
-> restart journey
```

During Overflow State:

- the selected song plays normally
- the engine does not substitute the item's default song
- the engine does not delete or alter any existing pairing
- the visual journey remains alive
- when a later track has a valid pairing, normal visual focus resumes
- the overall playlist/journey continues uninterrupted

This allows accidental discovery of strong new song/visual combinations.

A user may hear an unpaired track over an existing scene and decide that the combination works exceptionally well, then create a pairing afterward.

### Default Overflow Policy

```text
overflowPolicy: "continue-journey"
```

Possible future policies may include:

```text
continue-journey
hold-current-visual
use-plane-visual
random-compatible-item
pause-for-pairing
skip-unpaired
```

For blog-5 v2, the default is `continue-journey`.

## Orchestration API

The engine should support programs substantially more expressive than the initial UX.

Illustrative model:

```ts
type JourneyProgram = {
  id: string;
  restart: boolean;
  overflowPolicy: OverflowPolicy;
  sequence: JourneyNode[];
};

type JourneyNode =
  | {
      type: "track";
      trackId: string;
      repeat?: number;
    }
  | {
      type: "playlist";
      playlistId: string;
      repeat?: number | "forever";
    }
  | {
      type: "pool";
      poolId: string;
      choose?: number;
      repeat?: number | "forever";
    }
  | {
      type: "plane";
      planeId: string;
    };

type PlaylistDefinition = {
  id: string;
  order: "ordered" | "random";
  items: string[];
};

type PoolDefinition = {
  id: string;
  tracks?: string[];
  playlists?: string[];
  order: "ordered" | "random";
};
```

Future programs should be able to express:

```text
PLAYLIST A x2
-> PLAYLIST B randomized
-> SONG X once
-> choose 3 from RANDOM POOL C
-> PLAYLIST D
-> move to Plane 4
-> PLAYLIST E
-> restart the entire Journey
```

The API should eventually support nesting, deterministic sections, randomized pools, repeat counts, forever loops, track-level steps, playlist-level steps, and plane transitions.

## UX Is Not the Engine

The visual editor must not become the playback engine.

The UX writes a playback program.

This allows multiple interfaces over the same orchestration layer:

- right-click menu
- Create Your Own visual builder
- advanced timeline editor
- AI agent
- JSON/API callers
- imported presets
- cloud-storage libraries

The simple demo and the advanced engine therefore remain decoupled.

## Local Media and Zero-Backend Default

For the first version, user-selected songs should not be uploaded to GitHub or to a WebRev server.

The browser should treat "upload" as "load into this browser."

Initial implementation:

```text
File picker
-> browser File object
-> object URL
-> HTMLAudioElement
```

Example:

```js
const url = URL.createObjectURL(file);
```

This means:

- GitHub Pages hosts only the application
- personal songs remain on the user's device
- WebRev pays no media-storage or media-egress cost
- millions of users can use local music without uploading those songs into the repository

The initial memory-backed version may disappear after refresh/tab close.

## Browser Library Persistence

A later default provider should use IndexedDB to persist selected media locally in the browser.

Conceptually:

```text
GitHub Pages application
        |
        +-- journey metadata -> IndexedDB
        +-- playlist metadata -> IndexedDB
        +-- local audio blobs -> IndexedDB
        +-- song/visual pairings -> IndexedDB
```

This remains device-local and does not turn WebRev into a storage provider.

Browser storage quotas and browser data eviction must be treated as limitations; it should not be marketed as permanent cloud storage.

## Storage Provider Abstraction

The music engine should not care where a song physically lives.

Use a provider abstraction such as:

```ts
interface MediaSourceProvider {
  list(): Promise<MediaItem[]>;
  open(id: string): Promise<Blob | string>;
  import(files: File[]): Promise<MediaItem[]>;
  remove(id: string): Promise<void>;
}
```

Potential providers:

```text
MemoryProvider
BrowserLibraryProvider
LocalFileProvider
CloudflareR2Provider
MegaProvider
GoogleDriveProvider
DropboxProvider
S3Provider
URLProvider
```

A track references a provider resource rather than assuming a repository file:

```ts
{
  id: "song-123",
  title: "Example Song",
  source: {
    provider: "browser-library",
    key: "f821..."
  }
}
```

## Future Cloud Architecture

Later, users should be able to connect storage they control.

```text
Add Music From

My Device
Browser Library
Cloudflare R2
MEGA
Google Drive
Dropbox
S3-compatible storage
URL
```

WebRev provides the orchestration layer.

The storage provider stores the bytes.

The browser retrieves the media.

The engine understands the media resource independently of where it lives.

This architecture also creates a natural bridge to the existing Cloudflare remote-storage/downloader work: a user's R2 bucket could become one of the media providers without forcing WebRev itself to host the library.

## Pairings Are Persistent Metadata

Song/visual pairings are separate from journey composition.

A pairing may exist even when the paired song is not currently being used.

A custom journey may temporarily ignore default pairings.

Overflow State may temporarily contain unpaired tracks.

None of these operations should delete pairings.

Conceptually:

```ts
type MediaVisualPairing = {
  trackId: string;
  planeId: string;
  assetName: string;
};
```

The playback engine resolves these pairings at runtime.

## Design Goal

blog-5 v2 should demonstrate a paradox intentionally:

**The experience should feel tiny. The architecture should feel enormous.**

A casual visitor should understand the controls immediately.

A creator should be able to build playlists and playlist journeys without learning an API.

An advanced user should eventually be able to construct complex audiovisual programs.

An AI agent should be able to manipulate the same underlying program directly.

And a user's music should remain local or live in storage they control unless they explicitly choose otherwise.

## Initial Implementation Priority

1. Keep default ordered cross-plane looping.
2. Keep Loop Plane, Loop All, Previous, Next, Randomize, and song picker.
3. Add Create Your Own.
4. Add local browser file selection using object URLs.
5. Add playlist creation and ordering.
6. Add playlist-of-playlists Journey ordering.
7. Default Journey end behavior to restart.
8. Implement Overflow State with `continue-journey`.
9. Preserve all default song/visual pairings as independent metadata.
10. Add IndexedDB-backed BrowserLibraryProvider.
11. Expand the orchestration schema for pools, nesting, repeat counts, and agent-driven composition.
12. Add optional external storage providers later.

## Acceptance Criteria for the First Create Your Own Version

A user can:

1. open `Create Your Own` from the desktop music menu
2. select local audio files without uploading them to WebRev or GitHub
3. create at least three playlists
4. order those playlists into a Journey
5. reorder tracks inside each playlist
6. choose ordered or random behavior
7. play the Journey
8. reach the end and automatically restart from the beginning by default
9. use more songs than there are paired visual items without breaking playback
10. enter Overflow State for unpaired songs
11. automatically resume visual focus when a later paired song is reached
12. return to the default journey without losing stored song/visual pairings

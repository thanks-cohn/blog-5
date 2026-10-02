# Proposal: Portable World Packs, Media Authoring, and Seamless Object/Media Import

## Status

Early architecture proposal for `blog-5` / WebRev spatial presentations.

This proposal complements the existing Music Flow proposal. Music Flow defines playback behavior; this proposal defines how creators add media and objects, bind them together, save the authored state, and later restore or share the complete experience.

## Goal

Make authoring feel immediate enough that a normal user can:

1. add a song,
2. add or import a 3D object,
3. pair the song with the object,
4. position it,
5. choose behavior,
6. arrange playlists and queues,
7. save,
8. reopen the entire world later exactly as authored.

The creator should not need to understand scene graphs, coordinates, asset pipelines, or low-level playback internals.

The guiding principle is:

> Upload, place, pair, save.

## Interaction Entry Points

Desktop:

- right-click an object, plane, or media surface
- choose media or behavior actions from a compact contextual menu

Phone/tablet:

- click-and-hold / long-press
- expose the same actions in a touch-friendly sheet or radial menu

The menu is only a user interface over the underlying API.

## Media Authoring

The API should support adding songs directly to the current world.

Initial creator actions:

- Add Song
- Replace Song
- Add to Playlist
- Create Playlist
- Arrange Playlist
- Add to Queue
- Play Next
- Remove from Queue
- Pair Song With Object
- Pair Playlist With Object
- Set as Plane Music
- Set as World Music

Playlists are persistent authored structures.

Queues are ordered playback state that may be persistent when explicitly saved.

## Object Import

Objects should be importable without requiring special-case architecture per source.

Initial sources:

- local upload
- URL-backed asset
- future Sketchfab integration
- future AEXIS/WebRev asset library

A future desktop Sketchfab flow may allow the user to browse or log in, select/download a model, then import it into the world.

After import, every asset should become a normal world asset regardless of origin.

The runtime should not care whether a GLB came from:

- Sketchfab
- local disk
- CDN
- project library
- another future provider

## Seamless Object + Song Pairing

The authoring model should make a combined object/media action feel atomic from the user's perspective.

Example:

1. upload object
2. upload song
3. pair
4. place
5. save

Internally, the pairing remains declarative rather than becoming a new file format.

Example:

```json
{
  "id": "object-001",
  "asset": "assets/models/object.glb",
  "mediaBinding": {
    "type": "song",
    "target": "song-001",
    "action": "play"
  }
}
```

The same model can later support:

- playlists
- queues
- video
- GIFs
- text
- links
- scripted actions
- journeys

## Portable World Format

The project needs a portable save format that represents the entire authored experience.

Working name:

```
.aexis
```

Alternative names may be chosen later. The architecture must not depend on the extension name.

The file should be a package/container, preferably ZIP-compatible internally.

Example:

```text
our-world.aexis

manifest.json
assets/
  audio/
  models/
  images/
  gifs/
  video/
thumbnails/
metadata/
```

## What the World Pack Must Preserve

The manifest should be sufficient to reconstruct the current authored state without replaying the user's editing history.

It should preserve at minimum:

- world title and metadata
- main images
- background images
- images attached to planes
- 3D objects
- asset source references
- embedded local assets
- object transforms
- object scale
- object rotation
- object placement
- fixed/free state
- bobbing state
- spinning state
- start positions
- per-object media bindings
- songs
- playlists
- queues
- playback configuration
- per-plane media configuration
- plane configuration
- camera configuration
- future sphere/gravity configuration
- future journey configuration
- user-facing settings required to reconstruct the presentation

## Embedded vs Referenced Assets

The format should support both:

### Embedded

The asset bytes are contained inside the world pack.

Best for:

- portability
- sharing
- offline reopening
- archival reliability

### Referenced

The manifest stores a stable URL or asset identifier.

Best for:

- large remote libraries
- CDN-backed assets
- externally maintained media

A save/export option can later choose between:

- lightweight referenced pack
- fully portable embedded pack

## Canonical State, Not Replay-Only State

The save format must always contain the complete current state.

Do not require an edit replay log to reconstruct the world.

Bad dependency:

```text
move left
rotate
move forward
attach song
resize
```

Required canonical state:

```json
{
  "position": [1.2, 0.4, -3.8],
  "rotation": [0, 1.3, 0],
  "scale": 1.0,
  "song": "song-001"
}
```

This keeps loading deterministic and makes long-term compatibility much easier.

## Optional History Later

Undo, redo, replay, or authored construction history can later be stored separately.

Example:

```json
{
  "history": [
    {
      "type": "move",
      "object": "object-001",
      "to": [1, 2, 3]
    },
    {
      "type": "attach-song",
      "object": "object-001",
      "song": "song-001"
    }
  ]
}
```

History is optional metadata.

The canonical manifest remains authoritative.

## Example Manifest Shape

```json
{
  "format": "aexis-world",
  "version": 1,

  "world": {
    "title": "Our World",
    "mainImage": "assets/images/main.jpg"
  },

  "media": {
    "songs": [
      {
        "id": "song-001",
        "source": "assets/audio/song.mp3",
        "title": "Our Song"
      }
    ],

    "playlists": [
      {
        "id": "playlist-main",
        "items": ["song-001", "song-002"],
        "mode": "ordered",
        "repeat": true
      }
    ],

    "queue": [
      "song-003",
      "song-001"
    ]
  },

  "objects": [
    {
      "id": "object-001",
      "asset": "assets/models/object.glb",

      "transform": {
        "position": [1.2, 0.4, -3.8],
        "rotation": [0, 1.3, 0],
        "scale": 1
      },

      "behavior": {
        "mode": "bobbing",
        "fixed": false,
        "spin": true
      },

      "mediaBinding": {
        "type": "song",
        "target": "song-001"
      }
    }
  ],

  "planes": [],
  "cameras": {},
  "settings": {}
}
```

## API Direction

The API should expose stable primitives rather than UI-specific commands.

Conceptual examples:

```ts
world.assets.add(...)
world.media.addSong(...)
world.media.createPlaylist(...)
world.media.queue(...)
world.objects.add(...)
world.objects.bindMedia(...)
world.objects.setTransform(...)
world.objects.setBehavior(...)
world.save(...)
world.load(...)
```

Right-click and long-press menus call these APIs.

Future external editors and agents should call the same APIs.

## Save / Load Experience

The simplest experience should be:

```text
Edit -> Save World
Open World -> Restore Everything
```

The user should not need to manually re-upload songs or models after reopening a fully embedded world pack.

## Compatibility

Every world pack should carry:

- format identifier
- format version
- optional engine minimum version
- optional migration metadata

The loader should prefer migration over rejection when older fields can be translated safely.

Unknown optional fields should generally be ignored rather than causing a hard failure.

## Product Principle

The long-term goal is maximal utility with minimal friction.

A user should be able to build something emotionally or visually complex while performing actions that feel ordinary:

- upload
- drag
- grab
- position
- pair
- queue
- save

The complexity belongs in the engine and API, not in the user's workflow.

## Non-Goals

This proposal does not yet define:

- account/cloud synchronization
- collaborative editing
- rights management for copyrighted media
- Sketchfab authentication details
- exact binary package implementation
- asset compression policy
- history/replay implementation

Those can be designed separately once the portable canonical format is established.

# Blog 5 Journey Vision

## Purpose

This document explains the intended **experience**, not merely the current implementation.

Blog 5 is becoming a spatial presentation engine where music, objects, images, text, and movement through planes form one continuous journey.

The experience should feel authored, alive, varied, and replayable without becoming unpredictable chaos.

The central idea is:

> The visitor moves through objects.  
> The objects reveal music.  
> The music changes over time.  
> The plane decides when the journey is complete.  
> Travel carries the visitor onward.

---

# 1. The Plane

A plane is a spatial presentation zone.

A plane can contain:

- a central image/artwork
- authored text
- paired GLB objects
- additional unpaired GLB objects
- 2D objects
- motion rules
- music behavior
- a residency rule
- a travel strategy

The same generic engine should support the first, second, third, fourth, and future planes.

There should not be bespoke logic for every new plane.

---

# 2. The Core Object Mix

The intended common presentation pattern is:

```
explicitly authored / paired GLBs
+
3–5 additional unpaired GLBs
=
the live object set for this visit
```

For example:

```
3 paired GLBs
+ 4 random unpaired GLBs
= 7 visible journey objects
```

The extra count is not permanently hardcoded.

It is controlled through the API and can be:

- a fixed number
- a randomized range
- all objects for editing/debugging

Current default:

```ts
{ mode: "range", min: 3, max: 5 }
```

---

# 3. Object-First Journey

This is one of the most important rules.

The normal journey is **object-first**, not song-catalog-first.

If a plane contains:

```
6 visible GLBs
```

then one ordinary cycle contains:

```
6 object visits
```

The music catalog must not silently create 10, 20, or 100 additional journey steps by reusing those six objects.

That older song-first behavior was useful during an earlier design stage, but it conflicts with the newer vision.

---

# 4. Starting the Journey

Default behavior:

- click a GLB
- that object becomes the starting point
- its music begins
- Right moves forward through the remaining objects
- Left can move backward through object steps

The journey can start at any object rather than forcing the visitor to begin at object 1.

The object sequence rotates around the chosen starting object.

If click-to-start is disabled:

- clicking can remain exploratory
- right-click → **Play This** starts the journey instead

---

# 5. Leaving a Focused Object

The visitor must always have an understandable escape.

Supported experience:

- right-click → **Leave for now <3**
- press **Escape**

Both return from the focused GLB experience to the plane.

Leaving the focused object is not the same as travelling to another plane.

---

# 6. Paired GLBs

A paired GLB has an authored/default song.

Example:

```
ring.glb → our-spot.mp3
```

Normal behavior:

- entering that GLB plays its paired song
- short-term history does not randomly replace the pairing
- the pairing remains stable unless a higher-level Music Flow instruction explicitly overrides it
- temporary overrides should not destroy the authored pairing

A paired object is therefore an authored musical anchor.

---

# 7. Unpaired GLBs

An unpaired GLB is deliberately flexible.

It does not own one permanent fallback song.

Instead:

> every time the journey encounters an unpaired GLB, the engine resolves a fresh eligible track.

This is what allows a plane to feel different on repeat cycles and future repeat visits.

---

# 8. Globally Unassigned Song Pool

Dynamic fallback songs come from the **globally unassigned pool**.

That means songs permanently paired to some GLB are not casually stolen for random fallback duty.

Conceptually:

```
all songs
− songs explicitly paired to GLBs
=
unassigned fallback pool
```

This gives authored pairings priority while leaving a flexible catalog for variety.

---

# 9. Track Exclusions

Every GLB can have its own **Track Exclusions**.

Conceptually:

```
flint.glb
  must not play:
    october.mp3
    amor.mp3
```

This exclusion applies specifically to that object.

It is separate from:

- global pairing
- recent history
- plane-level avoidance
- long-term played history

Future UI wording may be simpler, such as:

> Don't play this song on this object

The API concept remains Track Exclusions.

---

# 10. Two Kinds of Listening Memory

The engine needs both short and long memory.

## Recent history

Tracks the last `N` plays.

Current default:

```
N = 2
```

Purpose:

- prevent immediate repetition
- avoid A → B → A → B fatigue
- provide local variety

## Session played ledger

Tracks every catalog song that has already been heard during the current presentation session.

Purpose:

- prefer genuinely new songs
- gradually reveal more of the catalog
- make long journeys feel exploratory

The ledger is a preference system, not another source of journey length.

---

# 11. Unpaired Track Selection Priority

When an unpaired GLB needs a song, the ideal candidate pool is:

```
globally unassigned songs
− this object's Track Exclusions
− recent tracks
− songs represented on this plane
− songs already heard in the session
```

That produces the highest-value pool:

> songs the visitor has not heard yet.

## First priority

Choose an eligible song that has **never been played in this session**.

## Second priority

Once all suitable unheard songs have been exhausted, allow previously heard songs while still maintaining the important variety constraints:

- not one of the recent tracks
- not already represented on this plane
- not excluded for this GLB

## Emergency fallback

If the catalog is too small to mathematically satisfy every condition, the engine can progressively relax constraints rather than stop the experience.

The normal goal remains:

```
unheard first
→ non-recent
→ plane-safe
→ graceful fallback
```

---

# 12. Songs Already on the Plane

A fallback song should normally avoid songs already represented on the current plane.

This includes authored paired music and music the journey has already used on that plane.

Why:

If a plane already contains:

```
Object A → Song X
Object B → Song Y
```

then an unpaired Object C should preferably expose:

```
Song Z
```

rather than repeating X or Y.

This makes each plane feel musically broader.

---

# 13. Completing a Plane

The default conceptual rule is:

> To complete one cycle of a plane, visit every visible GLB once.

This is independent of how large the song catalog is.

For example:

```
2 objects = 2 steps
7 objects = 7 steps
```

There should be no invisible hidden count created simply because more songs exist.

---

# 14. Plane Residency

A creator may intentionally want the visitor to remain on a plane longer than one object cycle.

That is explicit through **Plane Residency**.

Supported concepts:

## Cycles

```
Stay for 2 complete object cycles.
```

This gives unpaired GLBs another opportunity to resolve different songs.

## Song count

```
Stay until 10 songs have played.
```

This can expose more of the catalog even when the plane only has a handful of objects.

## Coverage

```
Stay until 75% of the eligible catalog has been heard.
```

This allows a presentation to prioritize musical exploration.

Residency is explicit.

It must not be confused with:

- object count
- song catalog size
- playlist-entry count

---

# 15. Why Repeat Cycles Matter

Suppose a plane has:

```
3 paired GLBs
4 unpaired GLBs
```

One cycle visits seven objects.

Cycle 1 might produce:

```
paired A
paired B
paired C
unheard fallback D
unheard fallback E
unheard fallback F
unheard fallback G
```

If residency requests another cycle, the four unpaired objects can resolve again:

```
unheard fallback H
unheard fallback I
unheard fallback J
unheard fallback K
```

Thus a single spatial plane can reveal a large music catalog without creating invisible duplicate object steps.

---

# 16. Travel Is Separate from Playback

Once the plane residency condition is satisfied, the journey may move onward.

Travel is its own strategy.

This separation is deliberate.

The journey engine answers:

> Are we ready to leave?

The travel system answers:

> How do we get there?

---

# 17. Travel Strategies

## Teleport

Instant/programmatic movement.

Use cases:

- Edit Mode
- debugging
- APIs
- jumping directly to a station
- non-cinematic navigation

## Roller Coaster

The built-in cinematic route.

This is the normal audience-facing journey transition.

The visitor physically rides toward the next plane.

## Custom

Extension point for developers.

Examples might eventually include:

- dissolve through stars
- tunnel warp
- falling transition
- elevator
- doorway
- vehicle
- user-authored WebGL sequence

The core engine should not need rewriting for each new transition.

---

# 18. Future Music Flow

The journey is expected to gain a listener-friendly orchestration layer called **Music Flow**.

The audience/creator-facing vocabulary should remain intuitive:

- Play
- Play next
- Play for…
- Queue
- Mix
- Repeat
- Stay
- Continue
- Travel

Underneath, the engine can compose arbitrarily sophisticated instructions.

Example:

```
Play October ×3
→ Queue Amor, Time
→ Mix unassigned songs ×5
→ Stay until 70% coverage
→ Roller Coaster to next plane
```

The simple UI should generate API instructions.

The UI itself should never become the scheduler.

---

# 19. Temporary Song Instructions

A future right-click Music Flow control may say:

```
Play this song here 3 times
Then continue normally
```

This is not a permanent pairing.

Conceptually:

```
temporary instruction
→ completes
→ resume underlying object/plane flow
```

This distinction keeps authoring state clean.

---

# 20. Future Media Providers

The architecture should eventually allow sources beyond locally hosted audio.

Potential provider model:

```ts
MediaSource
PlaybackInstruction
PlaneResidency
TravelStrategy
```

A future plane or lane may reference:

- local uploaded tracks
- CDN/R2 tracks
- YouTube playlists
- other supported media providers
- developer-defined providers

Example future concept:

```
Plane A
→ YouTube Playlist A
→ finish / residency condition
→ Playlist B
→ travel onward
```

Track Exclusions and history policies should remain provider-independent wherever technically possible.

---

# 21. Playlist / Lane Vision

A future lane may be connected to a playlist or pool.

When its configured condition is satisfied:

- advance to another playlist
- advance to another lane
- advance to another plane
- execute custom Music Flow
- invoke a travel strategy

The goal is not to hardcode YouTube into the journey engine.

The goal is a provider adapter architecture where the scheduler receives normalized playable media items.

---

# 22. Edit Mode and Presentation Mode

Long-term authoring flow:

```
Edit Mode
→ visually build experience
→ export Presentation Manifest
→ Presentation Mode consumes manifest
```

The finished presentation should not depend on the creator's browser localStorage.

The manifest should eventually contain:

- plane ordering
- asset assignment
- positions
- visibility
- motion
- fixed song pairings
- Track Exclusions
- unpaired count policy
- history/avoidance policy
- Music Flow
- residency
- travel strategy
- text
- camera/spatial settings

---

# 23. Future Interface Philosophy

The runtime/API should be predictable and boring in the best way:

- typed
- declarative
- documented
- serializable
- stable

The user interface is free to become experimental.

Possible future editor direction:

- floating translucent fields
- spatial playlist nodes
- linked planes
- visual exclusion lists
- draggable Music Flow blocks
- 3D control surfaces
- a Serial Experiments Lain-inspired terminal/control-space aesthetic

The artistic interface sits above the same documented API.

---

# 24. Replayability Goal

A presentation should be authored without becoming identical every time.

Stable elements:

- paired objects
- authored text
- plane layout
- major journey structure
- creator-defined constraints

Variable elements:

- which 3–5 unpaired GLBs appear
- which eligible unassigned songs they receive
- which unheard tracks are discovered first
- future randomized Music Flow pools

The desired feeling is:

> recognizably the same journey, but not mechanically identical.

---

# 25. Creator Control

Randomness must always be bounded by explicit rules.

Creators should be able to control:

- fixed vs random extra-object count
- minimum/maximum extra objects
- Track Exclusions
- recent-history size
- current-plane avoidance
- pairing
- residency
- playback order
- travel strategy
- future Music Flow instructions

“Random” should mean:

> choose creatively from the creator-approved space.

Not:

> ignore the creator's intent.

---

# 26. Current Defaults

Current intended baseline:

```
Extra unpaired GLBs:
  random 3–5

Recent song avoidance:
  last 2

Prefer unheard songs:
  yes

Avoid songs already on current plane:
  yes

Object Track Exclusions:
  supported

Normal journey cycle:
  visit every visible GLB once

Default plane residency:
  1 cycle

Audience travel:
  roller-coaster

Programmatic/edit travel:
  teleport

Custom travel:
  extension point available

Click object to start journey:
  enabled by default

Leave focused object:
  right-click “Leave for now <3”
  or Escape
```

---

# 27. Design Principle

The system should increasingly separate four concerns:

```
WHAT EXISTS
Asset / media library

WHAT MAY PLAY
Pairings / pools / exclusions / history

HOW LONG WE STAY
Residency

HOW WE MOVE
Travel strategy
```

Keeping these concepts separate prevents accidental hidden behavior.

---

# 28. North Star

A visitor should be able to enter at one object and naturally travel through an entire authored world.

They should not need to understand the scheduler.

They should simply experience:

- an object
- a song
- another object
- another song
- new music when possible
- no irritating immediate repetition
- coherent movement through a plane
- a cinematic transition
- another world waiting ahead

Meanwhile, creators and developers should be able to make that journey as simple or as intricate as they want through the API.


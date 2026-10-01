# Proposal: Randomized Love Quote Plaques

## Status

Proposal only.

This proposal extends the current lower white text plaque into a data-driven, session-aware presentation system.

The goal is to let plaque text come from JSON, let each plaque use an authored or randomized font family, and let the runtime avoid obvious quote repetition across nearby planes while still allowing creators to explicitly lock text/font choices when desired.

---

## Intent

The white plaque at the bottom of each plane should no longer require hard-coded text.

Instead, plaque content should be resolved from a project data source:

```text
love_quotes.json
```

The runtime should be able to choose a quote and font for a plane, remember what was recently used, and avoid showing the same quote too close together.

At the same time, the generic API should allow an authored plane to keep a specific quote and/or font indefinitely rather than being randomized.

---

## Proposed data location

Recommended project path:

```text
apps/playground/src/assets/text/love_quotes.json
```

The exact location is project-specific; the plaque API should consume normalized quote/font data rather than depend on this path directly.

Illustrative JSON:

```json
{
  "quotes": [
    {
      "id": "love-001",
      "text": "You are still my favorite place to return to."
    },
    {
      "id": "love-002",
      "text": "Somewhere between then and now, you became home."
    }
  ],
  "fonts": [
    {
      "id": "playfair",
      "family": "Playfair Display",
      "source": {
        "type": "google-font",
        "url": "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&display=swap"
      }
    },
    {
      "id": "cdn-serif",
      "family": "My Plaque Serif",
      "source": {
        "type": "stylesheet-url",
        "url": "https://cdn.example.com/fonts/plaque-serif.css"
      }
    }
  ]
}
```

A future version may also support direct font-file/CDN descriptors behind a proper font provider adapter.

For the first implementation, ordinary stylesheet URLs and Google Fonts stylesheet URLs are sufficient.

---

## Quote selection rule

The default project behavior should avoid obvious repetition.

When selecting a quote for plane `N`, the selector should avoid any quote used on:

```text
N - 2
N - 1
N
N + 1
N + 2
```

Operationally, because future planes may not yet have been assigned, the runtime should remember resolved assignments and ensure that a quote does not reappear within a two-plane neighborhood.

A simple session rule is:

```ts
avoidPlaneDistance: 2
```

Meaning that once a quote is assigned to a plane, the same quote should not be assigned to another plane whose index is within two positions of it.

If the quote pool is too small to satisfy the rule, the runtime should relax the constraint gracefully rather than fail to render text.

---

## Session assignment

Quote assignment should be stable during a session.

Once a plane receives:

```text
quote A
font B
```

revisiting that plane should normally show the same quote and font for the rest of that session.

The selector should therefore maintain a session assignment map:

```ts
type PlaqueSessionAssignment = {
  planeId: string;
  quoteId: string;
  fontId: string;
};
```

This prevents randomization from becoming visually noisy when moving backward and forward between planes.

A future explicit "reroll" action may intentionally discard a session assignment.

---

## Font behavior

Fonts should be handled independently from quote selection.

Default behavior:

- each plane may receive a different font family;
- the chosen font for a plane remains stable for the current session;
- fonts can be loaded from approved stylesheet URLs, including Google Fonts/CDN stylesheet URLs;
- if a font fails to load, the plaque should fall back to a safe project font without blocking the quote.

The font selector may be random, ordered, weighted, or authored later.

Initial project behavior can simply choose one eligible font per plane and cache that choice for the session.

---

## Authored persistence

The API must allow a plane to explicitly lock its plaque content and/or font.

Examples:

```ts
api.setPlanePlaque("plane-3", {
  quoteId: "love-014",
  fontId: "playfair",
  lockQuote: true,
  lockFont: true
});
```

Or keep the same font while allowing text to vary:

```ts
api.setPlanePlaque("plane-3", {
  fontId: "playfair",
  lockFont: true,
  lockQuote: false
});
```

Or keep the same text while letting the font change:

```ts
api.setPlanePlaque("plane-3", {
  quoteId: "love-014",
  lockQuote: true,
  lockFont: false
});
```

An authored plane override should take precedence over session randomization.

---

## Suggested API

Illustrative only:

```ts
type PlaqueFontSource =
  | {
      type: "google-font";
      url: string;
    }
  | {
      type: "stylesheet-url";
      url: string;
    };

type PlaqueFont = {
  id: string;
  family: string;
  source?: PlaqueFontSource;
};

type LoveQuote = {
  id: string;
  text: string;
};

type PlaqueSelectionPolicy = {
  enabled: boolean;
  quoteMode: "random" | "ordered" | "authored";
  fontMode: "random" | "ordered" | "authored";
  avoidPlaneDistance: number;
  stablePerSession: boolean;
};

type PlanePlaqueOverride = {
  quoteId?: string;
  fontId?: string;
  lockQuote?: boolean;
  lockFont?: boolean;
};
```

Possible runtime methods:

```ts
api.getPlaqueSelectionPolicy()
api.setPlaqueSelectionPolicy(policy)

api.getPlanePlaque(planeId)
api.setPlanePlaque(planeId, override)
api.clearPlanePlaqueOverride(planeId)

api.rerollPlanePlaque(planeId)
api.clearPlaqueSessionAssignments()

api.listLoveQuotes()
api.listPlaqueFonts()
```

---

## Selection precedence

Recommended precedence:

```text
explicit plane lock
    ↓
explicit plane value
    ↓
existing session assignment
    ↓
eligible random/ordered selection
    ↓
graceful fallback
```

This keeps authored intent above random behavior.

---

## Rendering

The plaque renderer should receive resolved data only:

```ts
{
  text: "...",
  fontFamily: "...",
  fontSourceUrl: "..."
}
```

The renderer should not perform quote selection itself.

That separation keeps the system easy to test:

```text
love_quotes.json
      ↓
plaque resolver
      ↓
session history / authored locks
      ↓
resolved plaque presentation
      ↓
text-plane renderer
```

---

## Font loading

For URL-backed fonts, the first version may dynamically attach stylesheet links to the document head.

The loader should:

- deduplicate identical stylesheet URLs;
- avoid reloading the same font when revisiting a plane;
- expose loading/failure state through Deep Debug;
- use `font-display` behavior supplied by the remote stylesheet where applicable;
- never block the rest of the presentation if a font provider fails.

The API should identify fonts by stable logical IDs rather than by URL alone.

---

## Deep Debug

Recommended debug state:

```ts
{
  plaque: {
    planeId: "station-2",
    quoteId: "love-014",
    quoteText: "...",
    fontId: "playfair",
    fontFamily: "Playfair Display",
    quoteLocked: false,
    fontLocked: false,
    source: "session-random",
    avoidPlaneDistance: 2,
    nearbyAssignedQuotes: [
      { planeId: "station-1", quoteId: "love-003" },
      { planeId: "station-3", quoteId: "love-008" }
    ],
    fontLoadState: "ready"
  }
}
```

This should make it clear why a particular quote/font was chosen.

---

## Project default behavior

For this project, the initial default should be:

```ts
{
  enabled: true,
  quoteMode: "random",
  fontMode: "random",
  avoidPlaneDistance: 2,
  stablePerSession: true
}
```

Meaning:

- plaque text comes from `love_quotes.json`;
- quotes randomize across planes;
- the same quote should not appear within two planes before or after another occurrence;
- each plane keeps its assigned quote for the session;
- each plane keeps its assigned font for the session;
- font choices may differ between planes;
- future sessions may produce different assignments;
- authored API overrides can permanently hold a specific quote/font for a plane.

---

## Future extensions

This architecture should later allow:

- weighted quote pools;
- themed quote groups;
- quotes by location/plane;
- quotes tied to songs or objects;
- language-specific quote pools;
- animated typography;
- per-character styles;
- font transitions;
- quote sequences;
- deterministic seeds;
- remote quote feeds;
- creator-authored plaque programs;
- conditional text based on journey progress.

---

## Acceptance criteria for a future v1

A future implementation is successful when:

1. plaque text is read from `love_quotes.json`;
2. each plane resolves one quote and one font;
3. assignments remain stable within a session;
4. the same quote is avoided within a two-plane neighborhood when the pool allows it;
5. remote stylesheet/Google Font URLs can provide plaque fonts;
6. font failure falls back safely;
7. authored plane overrides can lock quote, font, or both;
8. the API can reroll or clear assignments;
9. selection logic is separate from rendering;
10. Deep Debug reports the resolved quote/font and why they were chosen.

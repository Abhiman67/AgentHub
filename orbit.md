# Orbit — reserved mark (backup)

**Status:** RESERVED for future projects. Do not use for Backoff
without an explicit decision — its value is being untouched and available.

**Concept:** *Orbit retry* — a seed circling back, higher each time. Calm,
cosmic take on "every retry lands higher." Designed as the runner-up to the
C1 Soft B during the Backoff rebrand (Oct 2026).

**Spec (64×64 tile):**
- Tile: forest green `#06402B`, rounded 20px square with cut bottom-right
  corner (same tile grammar as the main mark).
- Orbit ring: ellipse `cx=450 cy=470 rx=62 ry=30` (in 900×640 sheet coords),
  rotated −18°, stroke bright gold `#FFD34D`, width 7.
- Seed: cream `#FFFDF9` circle r=15 at ring center.
- Satellite: gold `#FFD34D` circle r=8 on the ring's upper-right arc.

**Exact SVG (64 viewBox, standalone file):**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Orbit logo">
  <path d="M14 2 H50 Q62 2 62 14 V46 L50 62 H14 Q2 62 2 50 V14 Q2 2 14 2 Z" fill="#06402B"/>
  <ellipse cx="32" cy="34" rx="21" ry="10.5" fill="none" stroke="#FFD34D" stroke-width="3.4" transform="rotate(-18 32 34)"/>
  <circle cx="32" cy="34" r="7.5" fill="#FFFDF9"/>
  <circle cx="47.5" cy="26.5" r="4" fill="#FFD34D"/>
</svg>
```

**Usage notes:** works on dark or paper backgrounds; ring must stay gold on
green (never green-on-green). Minimum size 24px — below that, drop the
satellite dot.

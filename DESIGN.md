# DESIGN.md

<!-- impeccable:design-schema 1 -->

## World

**Warm bookish minimal** — the reader's reading chair, ported to a screen. The interface reads as the objects it tracks: paper, cloth spines, a bookmark ribbon, and margin notes ruled like a book's margins. Restrained by intent: paper ground, ink hairlines, one ribbon-red accent, two type faces. Executed from the built world (readnotes, Sep 2026); the direction contract lives first-child in `index.html`.

## Tokens

### Color

| Role | Token | Value |
|---|---|---|
| Paper ground | `--paper` | `#f6f1e6` |
| Lifted paper | `--paper-bright` | `#fdfaf3` |
| Reflected paper | `--paper-deep` | `#ebe2cf` |
| Ink | `--ink` | `#241c16` |
| Soft ink | `--ink-soft` | `#6a5d4e` |
| Faint ink | `--ink-faint` | `#98886f` |
| Hairline | `--line` | `rgba(36,28,22,.16)` |
| Accent (ribbon red) | `--accent` | `#b23a2b` (5.3:1 on paper) |
| Accent deep | `--accent-deep` | `#8e2d21` |
| Accent paper | `--accent-paper` | `#f4e3dc` (selection) |
| Done green | `--done` / `--done-paper` | `#5f7358` / `#e7ebdd` |
| Dropped gray | `--none` / `--none-paper` | `#756b5f` / `#efeae0` |
| Gold foil | `--gold` | `#c9a86a` (spine rules) |
| Cloth palette | `CLOTH[]` | 10 warm book-cloths in `app.js`, assigned deterministically by title+author hash |

Light was chosen from the use scene (reading in a lit room, paper in hand), not by category.

### Type

- **Reading voice**: `Spectral` — titles, notes, hero (titles clamp ≤ ≈46px; display faces kept under 6rem; body measure ≤66ch on note text).
- **Measure voice**: `IBM Plex Mono` — folios, page numbers, labels, buttons, meta, status. Monospace is used for *measure* (folio page numbers, page/ftotals), not as a "technical" costume.
- Fallbacks: `Georgia, "Times New Roman", serif` / `ui-monospace, Menlo, Consolas, monospace`.
- Headings balanced; scale steps are decided per view (shelf 28–40px, hero ≤46px, ledger 21–26px), one spacing rhythm.

### Motion

One authored moment: the ribbon-fill unrolls along a `scaleX` transform (linear-gradient + clip-path notch, `transform-origin: left`) on a single cubic-bezier. Card hover is a lift + deepened cloth shadow + mild saturate. Everything else is static; `prefers-reduced-motion: reduce` kills transitions and animations wholesale.

## Component grammar

- **Book cover** (`.book-cover`): a cloth field with three overlaid textures (radial paper shading + two repeating thread grids), a `::before` dark spine wash on the left ~13%, two gold foil rules via `.cover-rules`, a rotated paper status **stamp** top-right, and a paper **title plate** bottom (title serif / author mono). Color comes from the `--cloth` hash. Aspect 2:3, radius 2px/4px like a real spine.
- **Bookmark ribbon** (`.ribbon`): hairline paper-deep track; the fill is the accent with a V-notch `clip-path` and a scaleX progress value; a mono label runs `% · p. N of M`. Appears on every shelf cover, plus a quiet 6px version as the book view's progress strip.
- **Margin ledger** (`.ledger`): rows ruled by 1px ink hairlines, `64px` mono **folio** (page number under a tiny ribbon ¶-mark) and a serif note body, sorted ascending by page. Meta line mono with relative updated date, actions surface on hover but stay keyboard/touch reachable.
- **Composer** (`.composer`): the book view is notes-first — a slim header (`Shelf` link · status select · Edit/Remove), title/author, the page-set, then a thin progress strip. Below it the composer sits **always open** as the ledger's next, empty ruled row: a ¶ folio with a bare mono page input (defaults to the current page, walks to the next free one after a save), one serif textarea that auto-grows, and a faint ✚ Photo / Save pair that rises to full opacity on focus. A quiet **span** toggle in the folio reveals a second "– end" page input for a page-range note. No box, no labels, no hint copy. Enter saves, `⇧↵` starts a new line; pasting or picking a photo stages thumbs inline.
- **Page-set**: − / input / + step control with mono numerals, commits on Enter/blur, clamped to the book. Also the **composer's page chip** writes the same value (note = progress).
- **Status select**: compact mono `<select>` in the book header (Reading / Finished / Dropped); the tint lives on the shelf cover's stamp.
- **Appbar**: sticky, `color-mix` paper + blur, hairline rule; wordmark = serif "readnotes" + a small ribbon-clipped `.mark` in accent.
- Empty states: library = drawn open-book SVG with note lines + a ribbon; notes = quiet two-liner.
- Dialogs: native `<dialog>`, bright paper, hairline, soft shadow, `::backdrop` warm-dark blur; inputs are paper-deep fields that wake to accent focus ring + 3px halo.
- **Browser surfaces themed**: `::selection` (accent-paper), caret via `color`, thin palette scrollbars, `:focus-visible` accent outline offset 2px.

## Signature interaction

**The note is the progress.** Saving a note at page N moves the current page to N. One source of truth (the page number), two entry points (header page-set, composer page chip) — no separate "mark as read" button, because both acts are the same act. A **span note** (optional `end` on the note) covers pages N–M and reads through to M, so the next composer page starts at M+1. Compose flow is friction-free: the composer is always open at the next free page, Enter saves, and the ledger re-renders beneath it.

**Note text is tiny HTML.** One rule: paste a URL into a note and it renders as a clickable link; `[Text shown](url)` replaces the URL with your own label (songs, articles, anything you want to keep). Both happen at render time — the stored note is always plain text, so exports stay readable and the composer shows exactly what you wrote.

## State & persistence

Single key `readnotes.v1` → `{ books: [{ id, title, author, totalPages, currentPage, status, notes:[{page,end?,text,images,updatedAt}], createdAt, updatedAt }] }`. `end` is optional and marks a page-span note (poor page is the anchor/sort key; single-page notes may sit anywhere, spans may overlap). Images downscaled to 1200px/WebP before being stored as data URLs; a soft warn fires past ~4.2MB, a hard `QuotaExceededError` guard toasts without corrupting state. JSON export (dated download) / import (merge by id) in the appbar. Routes: `#/` shelf, `#/book/:id`.

## Responsive rules

Library grid `repeat(auto-fill, minmax(200px,1fr))` → 140px under 720px; book header wraps to a column with the page-set below the title; composer collapses to one column (page chip above text, foot below, hint inline); ledger folio 64px → 44px; appbar actions collapse to icon-only under 720px; note images cap at 320px wide. No horizontal overflow down to 340px (verified at 340/390/768/1360).

## Accessibility

AA contrast enforced on paper/ink/accent (accent 5.3:1); semantic elements (`<dialog>`, buttons, labels, `aria-pressed`, `role=group`); keyboard flows verified (tab order reaches Add book; Enter opens dialog; Escape closes); `aria-live` toast; reduced-motion honored. Animated `scaleX` ribbon replaces animation of `width` (layout thrash) after detector feedback.
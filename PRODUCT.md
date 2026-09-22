# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS/JS, no build step, no dependencies. Open `index.html` or host on any static server.

## Users

One reader using this as their personal reading companion: a person actively reading books who wants to know where they are in every book, and to keep margin-style notes as they read, page by page.

## Product Purpose

A personal reading ledger that tracks how far you are into each book and lets you drop one note (text plus images) on any page. Notes are always shown sorted in page order. Everything lives in the browser's localStorage — private, offline, no account.

## Positioning

The bookish marginalia ledger: progress and notes share one mechanic, so finishing a note at a page is the same act as marking that you've read to it. Notes sort themselves; you never manage them.

## Operating Context

Used in a browser as a static page. Reading is done a page at a time: reader updates the current page, and drops notes on pages worth remembering. Data must survive tab closings and relaunches.

## Capabilities and Constraints

- Multiple books, each with: title, author, total pages, reading status (Reading / Finished / Dropped), and current page.
- Progress percent is derived from current page and total pages.
- Current page is set two ways (both drive one value): a page-number field in the book header, and saving a note at a given page.
- Notes anchor to a page; one note per starting page. A note may optionally be a page-span note (one note covering a range, shown as "p. N–M"), while single-page notes can still be made on any page inside that span.
- Notes are always displayed sorted ascending by page number.
- Reading status is user-settable (Reading / Finished / Dropped).
- Images are downscaled client-side (max ~1200px long edge, WebP/JPEG) and stored as data URLs; large storage is protected by a quota guard with a clear message.
- JSON export (one button downloads the whole library) and JSON import (file picker, merges by book id).
- English UI.
- UI language register: warm, bookish, minimal (user-pinned aesthetic).
- All state in a single localStorage key (`readnotes.v1`).
- Constraint: localStorage quota (~5MB) — images are compressed to fit; no other persistence exists.

## Brand Commitments

- Product name: "readnotes" (wordmark, empty-state copy, favicon).
- English UI copy throughout.
- Warm bookish minimal aesthetic (user-pinned): paper tones, serif reading type, bookmark-ribbon progress, ledger-style notes.

## Evidence on Hand

None — greenfield. No real book data, images, or testimonials. Demo/sample data is synthetic and labeled as such where a visitor could mistake it for real content.

## Product Principles

1. One mechanic, not many: progress and note-taking share the page-number as their single source of truth.
2. Local-first and private: nothing leaves the browser; export/import is the only data lifeline and it is explicit, never silent.
3. Notes order themselves: the app sorts by page so the reader never manages structure.
4. The interface reads like the object it tracks — pages, folios, ribbons, paper — so a slower, warmer rhythm comes with using it.
5. Honest edges: clear empty states, quota warnings instead of silent failures.

## Accessibility & Inclusion

Keyboard-operable throughout; logical focus order; visible focus rings; `prefers-reduced-motion` respected; semantic HTML with native elements (`<dialog>`, `<button>`, `<label>`, `<input>`) over rebuilt controls; contrast ratios kept AA on paper/ink/accent.
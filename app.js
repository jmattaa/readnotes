/* readnotes — localStorage reading shelf & margin ledger */
"use strict";

const STORE_KEY = "readnotes.v1";
const IMAGE_MAX = 1200;        // px, long edge
const IMAGE_QUERY = 0.82;
const MAX_IMAGES_PER_NOTE = 6;
const QUOTA_WARN_BYTES = 4.2 * 1024 * 1024;

const CLOTH = [
  "#7a2e28","#3f5a46","#8a6b28","#4a5e78","#2f4a3c",
  "#5a3a52","#6b4e34","#3c4a63","#6e3a2e","#4a6a5e",
];

const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, cls) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
};

const state = { books: [] };

/* ---------- persistence ---------- */
function save() {
  try {
    const raw = JSON.stringify(state);
    localStorage.setItem(STORE_KEY, raw);
    if (raw.length > QUOTA_WARN_BYTES)
      toast("The library is getting heavy — export a backup and remove old photos.", true);
    updateFootnote();
    return true;
  } catch (e) {
    toast("Storage is full — remove an image or trim an old note.", true);
    return false;
  }
}
function storageUsedBytes() {
  let bytes = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    bytes += new Blob([k, "\n", localStorage.getItem(k)]).size;
  }
  return bytes;
}
const fmtBytes = (bytes) =>
  bytes >= 1 << 20 ? (bytes / (1 << 20)).toFixed(1) + " MB"
  : bytes >= 1 << 10 ? Math.round(bytes / (1 << 10)) + " KB"
  : bytes + " B";
function updateFootnote() {
  const el = $("#footnote");
  if (el) el.textContent = `${fmtBytes(storageUsedBytes())} used`;
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) { const d = JSON.parse(raw); if (Array.isArray(d.books)) state.books = d.books; }
  } catch (e) { /* corrupt store — start clean */ }
}

const uid = () => (crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10));

/* ---------- helpers ---------- */
function hashCloth(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return CLOTH[h % CLOTH.length];
}
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
function pct(book) {
  if (!book.totalPages || book.totalPages <= 0) return 0;
  return clamp(Math.round((book.currentPage / book.totalPages) * 100), 0, 100);
}
function fmtDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}
function icon(name, cls) {
  const s = el("svg", cls || "ic");
  s.setAttribute("aria-hidden", "true");
  s.innerHTML = `<use href="#i-${name}"/>`;
  return s;
}

function toast(msg, warn = false) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.toggle("warn", warn);
  t.classList.add("show");
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove("show"), 3000);
}

const STATUS_META = {
  reading:  { label: "Reading",  stamp: "var(--accent-deep)" },
  finished: { label: "Finished", stamp: "var(--done)" },
  dropped:  { label: "Dropped",  stamp: "var(--none)" },
};

/* ---------- templates ---------- */
function coverHTML(book) {
  const p = clamp(book.currentPage || 0, 0, book.totalPages || 1);
  const meta = STATUS_META[book.status] || STATUS_META.reading;
  return `
    <a class="book-cover" href="#/book/${encodeURIComponent(book.id)}"
       aria-label="Open ${esc(book.title)} — ${esc(book.author || "unknown author")}, reading page ${p} of ${book.totalPages}">
      <span class="cover-rules" aria-hidden="true"></span>
      <span class="status-stamp" style="--stamp:${meta.stamp}">${meta.label}</span>
      <span class="title-plate">
        <span class="t">${esc(book.title)}</span>
        <span class="a">${esc(book.author || "—")}</span>
      </span>
    </a>
    <div class="ribbon">
      <div class="ribbon-track"><div class="ribbon-fill" style="--p:${(p / Math.max(1, book.totalPages)).toFixed(4)}"></div></div>
      <div class="ribbon-label">
        <span class="lb-strong">${pct(book)}%</span>
        <span>${p}/${book.totalPages}</span>
      </div>
    </div>`;
}

const esc = (s) => String(s ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/* ---------- views ---------- */
function renderLibrary() {
  const view = $("#view");
  view.innerHTML = "";
  const h = el("h1", "shelf-title");
  h.textContent = "Your shelf";
  view.append(h);

  if (state.books.length === 0) {
    view.append(libraryEmpty());
    return;
  }

  state.books.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

  const grid = el("div", "shelf-grid");
  for (const b of state.books) {
    const card = el("div", "book");
    card.style.setProperty("--cloth", hashCloth(b.title + "|" + b.author));
    card.innerHTML = coverHTML(b);
    grid.append(card);
  }
  view.append(grid);
}

function libraryEmpty() {
  const box = el("div", "empty");
  box.innerHTML = `
    <svg class="empty-art" viewBox="0 0 120 84" fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M14 14h36a6 6 0 0 1 6 6v44a6 6 0 0 0-6-6H8a6 6 0 0 1-6-6V20a6 6 0 0 1 6-6h6z" stroke-width="1.5"/>
      <path d="M106 14H70a6 6 0 0 0-6 6v44a6 6 0 0 1 6-6h42a6 6 0 0 0 6-6V20a6 6 0 0 0-6-6z" stroke-width="1.5"/>
      <path d="M56 26v44M20 30h22M20 38h22" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M60 30h36M60 38h28" stroke-width="1.2" stroke-linecap="round" opacity=".6"/>
      <path d="M52 40l-8 7 8 7" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <h2>The shelf is empty</h2>
    <p>Add your first book.</p>
    <button class="btn primary" data-act="new-book">
      <svg class="ic" aria-hidden="true"><use href="#i-plus"/></svg> Add book
    </button>`;
  return box;
}

function renderBook(id) {
  const b = state.books.find(x => x.id === id);
  const view = $("#view");
  if (!b) { renderLibrary(); return; }
  view.innerHTML = "";

  const p = clamp(b.currentPage || 0, 0, b.totalPages || 1) / Math.max(1, b.totalPages || 1);

  const wrap = el("div", "bv");
  wrap.innerHTML = `
    <div class="nb-top">
      <a class="back-link" href="#/"><svg class="ic"><use href="#i-chev-left"/></svg> Shelf</a>
      <div class="nb-actions">
        <select class="status-select" data-act="set-status" aria-label="Reading status">
          ${Object.entries(STATUS_META).map(([k, v]) =>
            `<option value="${k}" ${b.status === k ? "selected" : ""}>${v.label}</option>`).join("")}
        </select>
        <button class="link-edit" type="button" data-act="edit-book">${icon("edit").outerHTML} Edit</button>
        <button class="link-remove" type="button" data-act="delete-book">Remove</button>
      </div>
    </div>
    <div class="nb-head">
      <div>
        <h1 class="hero-title">${esc(b.title)}</h1>
        <p class="hero-author">${esc(b.author || "")}</p>
      </div>
      <div class="page-set" aria-label="Set current page">
        <button class="step" type="button" data-act="page-step" data-d="-1" aria-label="Previous page">−</button>
        <input id="page-input" type="number" inputmode="numeric" min="0" max="${b.totalPages}" value="${b.currentPage}"
               aria-label="Current page">
        <button class="step" type="button" data-act="page-step" data-d="1" aria-label="Next page">+</button>
        <span class="of">of ${b.totalPages}</span>
      </div>
    </div>
    <div class="nb-strip" aria-hidden="true">
      <div class="ribbon-track"><div class="ribbon-fill" style="--p:${p.toFixed(4)}"></div></div>
    </div>`;
  view.append(wrap);

  pendingImages = [];
  editingNotePage = null;

  const notes = el("section", "notes");
  const sorted = [...b.notes].sort((x, y) => x.page - y.page);
  notes.innerHTML = `
    <div class="notes-head">
      <h2>Notes <span class="count-tag">${sorted.length ? `· ${sorted.length}` : ""}</span></h2>
    </div>`;
  view.append(notes);
  notes.append(composerEl(b));

  if (sorted.length === 0) {
    const empty = el("div", "empty");
    empty.style.padding = "28px 16px 40px";
    empty.innerHTML = `
      <h2>No notes yet</h2>
      <p>Write one on any page.</p>`;
    notes.append(empty);
  } else {
    const ol = el("ol", "ledger");
    for (const n of sorted) ol.append(noteLineEl(b, n));
    notes.append(ol);
  }
}

function nextPageFor(book) {
  const total = Math.max(1, book.totalPages || 1);
  let n = clamp(book.currentPage || 1, 1, total);
  const busy = p => book.notes.some(x => x.page === p);
  if (!busy(n)) return n;
  for (let step = 1; step <= total; step++) {
    if (n + step <= total && !busy(n + step)) return n + step;
    if (n - step >= 1 && !busy(n - step)) return n - step;
  }
  return n;
}

function noteLineEl(book, n) {
  const li = el("li", "note");
  li.dataset.page = n.page;
  const label = n.end ? `${n.page}–${n.end}` : `${n.page}`;
  const alt = n.end ? `Photo on pages ${n.page}–${n.end}` : `Photo on page ${n.page}`;
  const actionLabel = n.end ? `Edit the note on pages ${n.page}–${n.end}` : `Edit the note on page ${n.page}`;
  const delLabel = n.end ? `Delete the note on pages ${n.page}–${n.end}` : `Delete the note on page ${n.page}`;
  const imgs = (n.images || []).map(src => `<img src="${src}" alt="${alt}" loading="lazy">`).join("");
  li.innerHTML = `
    <div class="folio">
      ${label}<span class="para" aria-hidden="true"><svg viewBox="0 0 12 18"><path d="M0 0h6v15l3-2.2 3 2.2V0h-6v13.4c-2-1.5-4.6-1.7-6-.6z" fill="var(--accent)" opacity=".85"/></svg></span>
    </div>
    <div class="note-body">
      <p class="note-text">${esc(n.text)}</p>
      ${imgs ? `<div class="note-images">${imgs}</div>` : ""}
      <div class="note-meta">
        <time datetime="${new Date(n.updatedAt).toISOString()}">${fmtDate(n.updatedAt)}</time>
        <span class="note-actions">
          <button class="iconbtn" type="button" data-act="edit-note" data-page="${n.page}" aria-label="${actionLabel}">${icon("edit").outerHTML}</button>
          <button class="iconbtn" type="button" data-act="delete-note" data-page="${n.page}" aria-label="${delLabel}">${icon("trash").outerHTML}</button>
        </span>
      </div>
    </div>`;
  return li;
}

function composerEl(book) {
  const f = el("form", "composer");
  f.noValidate = true;
  f.innerHTML = `
    <span class="cp-folio" aria-hidden="true">
      <span class="para"><svg viewBox="0 0 12 18"><path d="M0 0h6v15l3-2.2 3 2.2V0h-6v13.4c-2-1.5-4.6-1.7-6-.6z" fill="var(--accent)" opacity=".85"/></svg></span>
      <input type="number" inputmode="numeric" name="page" min="1" max="${book.totalPages || 99999}"
             value="${nextPageFor(book)}" aria-label="Page number">
      <span class="cp-dash">–</span>
      <input type="number" inputmode="numeric" name="pageEnd" min="1" max="${book.totalPages || 99999}"
             aria-label="End page of the span">
      <button class="cp-span" type="button" data-act="toggle-span">span</button>
    </span>
    <textarea class="cp-text" name="text" rows="1" placeholder="A line worth keeping…" aria-label="Note"></textarea>
    <div class="cp-actions">
      <button class="cp-photo" type="button" data-act="attach-image" title="Paste or choose a photo">
        ${icon("image").outerHTML} Photo
      </button>
      <button class="btn ghost cp-cancel" type="button" data-act="note-cancel">Cancel</button>
      <button class="btn primary cp-save" type="submit">Save</button>
    </div>
    <div class="cp-thumbs thumbs" data-role="thumbs"></div>
    <input class="nf-files" type="file" accept="image/*" multiple hidden>`;
  return f;
}

/* ---------- note composer state ---------- */
let pendingImages = [];   // data URLs staged in the open composer
let editingNotePage = null;

function autosize(el) {
  el.style.height = "auto";
  el.style.height = Math.max(el.scrollHeight, 34) + "px";
}

function openNoteForm(book, page, note) {
  const f = $(".composer", $("#view"));
  const text = f.querySelector(".cp-text");
  const pinput = f.querySelector('input[name="page"]');
  const einput = f.querySelector('input[name="pageEnd"]');
  editingNotePage = note ? note.page : null;
  pendingImages = note && note.images ? [...note.images] : [];
  pinput.value = page;
  pinput.max = book.totalPages || 99999;
  einput.value = note && note.end ? note.end : "";
  einput.max = book.totalPages || 99999;
  f.classList.toggle("editing", !!note);
  f.classList.toggle("spanning", !!(note && note.end));
  text.value = note ? note.text : "";
  autosize(text);
  renderThumbs();
  text.focus();
  text.setSelectionRange(text.value.length, text.value.length);
  f.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderThumbs() {
  const box = $(".thumbs", $("#view"));
  box.innerHTML = "";
  pendingImages.forEach((src, i) => {
    const t = el("span", "thumb");
    t.innerHTML = `<img src="${src}" alt=""><button class="thumb-x" type="button" data-idx="${i}" aria-label="Remove photo">×</button>`;
    box.append(t);
  });
}

function closeNoteForm() {
  const f = $(".composer", $("#view"));
  if (f) {
    const b = state.books.find(x => x.id === currentBookId());
    const page = f.querySelector('input[name="page"]');
    const einput = f.querySelector('input[name="pageEnd"]');
    f.querySelector(".cp-text").value = "";
    pendingImages = [];
    editingNotePage = null;
    f.classList.remove("editing", "spanning");
    if (b) { page.value = nextPageFor(b); page.max = b.totalPages || 99999; }
    einput.value = "";
    autosize(f.querySelector(".cp-text"));
    renderThumbs();
  }
}

function downscaleImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, IMAGE_MAX / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      const ctx = cv.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      let out = null;
      try { out = cv.toDataURL("image/webp", IMAGE_QUERY); if (!out.startsWith("data:image/webp")) throw 0; }
      catch (e) { out = cv.toDataURL("image/jpeg", 0.85); }
      resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(); };
    img.src = url;
  });
}

/* ---------- actions ---------- */
function updateBook(id, data) {
  const b = state.books.find(x => x.id === id);
  if (!b) return;
  b.title = data.title.trim();
  b.author = (data.author || "").trim();
  b.totalPages = clamp(parseInt(data.totalPages, 10) || 1, 1, 50000);
  b.currentPage = clamp(parseInt(data.startPage, 10) || 0, 0, b.totalPages);
  b.status = ["reading", "finished", "dropped"].includes(data.status) ? data.status : b.status;
  b.updatedAt = Date.now();
  save();
  renderBook(id);
  toast(`"${b.title}" updated`);
}

function newBook(data) {
  const book = {
    id: uid(),
    title: data.title.trim(),
    author: (data.author || "").trim(),
    totalPages: clamp(parseInt(data.totalPages, 10) || 1, 1, 50000),
    currentPage: clamp(parseInt(data.startPage, 10) || 0, 0, 50000),
    status: ["reading", "finished", "dropped"].includes(data.status) ? data.status : "reading",
    notes: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  state.books.push(book);
  if (save()) toast(`"${book.title}" added to the shelf`);
  location.hash = `#/book/${book.id}`;
}

function setPage(bookId, n) {
  const b = state.books.find(x => x.id === bookId);
  if (!b) return;
  n = clamp(Math.round(Number(n) || 0), 0, b.totalPages || 0);
  if (n === b.currentPage) return;
  b.currentPage = n;
  b.updatedAt = Date.now();
  save();
  renderBook(bookId);
  toast(`Now reading page ${n}`);
}

function setStatus(bookId, status) {
  const b = state.books.find(x => x.id === bookId);
  if (!b || b.status === status) return;
  b.status = status;
  b.updatedAt = Date.now();
  save();
  renderBook(bookId);
  toast(`${b.title} — ${STATUS_META[status].label}`);
}

function removeBook(bookId) {
  const i = state.books.findIndex(x => x.id === bookId);
  if (i >= 0) state.books.splice(i, 1);
  save();
  location.hash = "#/";
  toast("Book removed from the shelf");
}

function saveNote(bookId, page, end, text) {
  const b = state.books.find(x => x.id === bookId);
  if (!b) return;
  const total = b.totalPages || 1;
  page = clamp(Math.round(Number(page) || 1), 1, total);
  end = parseInt(end, 10);
  end = !isNaN(end) && end > page ? clamp(end, page + 1, total) : null;
  const conflict = b.notes.find(n => n.page === page && n.page !== editingNotePage);
  if (conflict) { toast(`A note already starts on page ${page}.`, true); return; }
  if (!text.trim() && pendingImages.length === 0) { toast("Write something or attach a photo first.", true); return; }

  const idx = b.notes.findIndex(n => n.page === editingNotePage);
  const note = { page, text: text.trim(), images: pendingImages, updatedAt: Date.now() };
  if (end) note.end = end;
  if (idx >= 0) b.notes[idx] = note;
  else b.notes.push(note);
  b.currentPage = end || page;           // spans read through to their end page
  b.updatedAt = Date.now();
  pendingImages = [];
  editingNotePage = null;
  save();
  renderBook(bookId);
  toast(end ? `Note saved — now reading pages ${page}–${end}` : `Note saved — now reading page ${page}`);
}

function deleteNote(bookId, page) {
  const b = state.books.find(x => x.id === bookId);
  if (!b) return;
  b.notes = b.notes.filter(n => n.page !== page);
  b.updatedAt = Date.now();
  save();
  renderBook(bookId);
  toast(`Note on page ${page} deleted`);
}

/* ---------- dialogs ---------- */
const bookDialog = $("#book-dialog");
const confirmDialog = $("#confirm-dialog");
let confirmAction = null;
let editingBookId = null;

function openBookDialog(book) {
  const form = $("#book-form");
  form.querySelector("[name='title']").value = book ? book.title : "";
  form.querySelector("[name='author']").value = book ? book.author : "";
  form.querySelector("[name='totalPages']").value = book ? book.totalPages : "";
  form.querySelector("[name='startPage']").value = book ? book.currentPage : 0;
  form.querySelector("[name='status']").value = book ? book.status : "reading";
  $("#book-dialog-title").textContent = book ? "Edit book" : "Add a book";
  bookDialog.querySelector("button[type='submit']").textContent = book ? "Save changes" : "Add book";
  editingBookId = book ? book.id : null;
  bookDialog.showModal();
  setTimeout(() => form.querySelector("[name='title']").focus(), 0);
}

function openConfirm(title, message, fn) {
  $("#confirm-title").textContent = title;
  $("#confirm-message").textContent = message;
  confirmAction = fn;
  confirmDialog.showModal();
  setTimeout(() => $('[data-act="confirm-no"]', confirmDialog).focus(), 0);
}

/* ---------- import / export ---------- */
function exportLibrary() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = el("a");
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  a.href = URL.createObjectURL(blob);
  a.download = `readnotes-backup-${stamp}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast("Library exported");
}

function importLibrary(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const d = JSON.parse(reader.result);
      if (!Array.isArray(d.books)) throw 0;
      const valid = d.books.filter(b => b && typeof b.title === "string" && typeof b.totalPages === "number");
      if (valid.length === 0) { toast("No books found in that file.", true); return; }
      const incoming = new Map(valid.map(b => [b.id, b]));
      const count = incoming.size;
      const merged = [];
      const seen = new Set();
      for (const b of state.books) {
        merged.push(incoming.get(b.id) || b); seen.add(b.id);
      }
      for (const [id, b] of incoming) if (!seen.has(id)) merged.push(b);
      state.books = merged;
      save();
      renderLibrary();
      toast(`Imported ${count} ${count === 1 ? "book" : "books"}`);
    } catch (e) { toast("Couldn't read that file.", true); }
  };
  reader.readAsText(file);
}

/* ---------- current page readout ---------- */
function readPageInput(input) {
  const bookId = currentBookId();
  const b = state.books.find(x => x.id === bookId);
  if (!b) return;
  const v = clamp(Math.round(Number(input.value) || 0), 0, b.totalPages || 0);
  if (v !== b.currentPage) {
    b.currentPage = v;
    b.updatedAt = Date.now();
    save();
    renderBook(bookId);
    toast(`Now reading page ${v}`);
  } else {
    input.value = v;
  }
}

let _currentBookId = null;
function currentBookId() {
  const m = location.hash.match(/^#\/book\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : _currentBookId;
}

/* ---------- routing ---------- */
function route() {
  const view = $("#view");
  view.innerHTML = "";
  const m = location.hash.match(/^#\/book\/(.+)$/);
  if (m) {
    const b = state.books.find(x => x.id === decodeURIComponent(m[1]));
    if (b) { _currentBookId = b.id; renderBook(b.id); }
    else { _currentBookId = null; renderLibrary(); }
  } else {
    _currentBookId = null;
    renderLibrary();
  }
  if ($("#book-dialog").open) $("#book-dialog").close();
}

/* ---------- events ---------- */
document.addEventListener("click", async (e) => {
  const t = e.target.closest("[data-act]");
  if (!t) return;
  const act = t.dataset.act;

  if (act === "new-book") openBookDialog(null);
  else if (act === "close-dialog") { if (bookDialog.open) bookDialog.close(); }

  else if (act === "export") exportLibrary();
  else if (act === "import") $("#import-file").click();

  else if (act === "page-step") {
    e.preventDefault();
    const id = currentBookId();
    const b = state.books.find(x => x.id === id);
    if (!b) return;
    setPage(id, b.currentPage + parseInt(t.dataset.d, 10));
  }
  else if (act === "edit-note") {
    e.preventDefault();
    const id = currentBookId();
    const b = state.books.find(x => x.id === id);
    if (!b) return;
    const page = parseInt(t.dataset.page, 10);
    const note = b.notes.find(n => n.page === page);
    if (note) openNoteForm(b, page, note);
  }
  else if (act === "edit-book") {
    e.preventDefault();
    const b = state.books.find(x => x.id === currentBookId());
    if (b) openBookDialog(b);
  }
  else if (act === "delete-note") {
    e.preventDefault();
    const id = currentBookId();
    const page = parseInt(t.dataset.page, 10);
    const b = state.books.find(x => x.id === id);
    if (!b) return;
    const note = b.notes.find(n => n.page === page);
    const preview = note && note.text ? `"${note.text.slice(0, 46)}${note.text.length > 46 ? "…" : ""}"` : "the photo note";
    openConfirm("Delete this note?", `The note on page ${page} (${preview}) will be gone for good.`, () => deleteNote(id, page));
  }
  else if (act === "delete-book") {
    e.preventDefault();
    const id = currentBookId();
    const b = state.books.find(x => x.id === id);
    if (!b) return;
    openConfirm(`Remove "${b.title}"?`, `The book and all its margin notes will be gone for good.`, () => removeBook(id));
  }
  else if (act === "attach-image") {
    e.preventDefault();
    const box = $(".nf-files", $("#view"));
    if (box) box.click();
  }
  else if (act === "toggle-span") {
    e.preventDefault();
    const f = e.target.closest(".composer");
    if (!f) return;
    const spanning = f.classList.toggle("spanning");
    const einput = f.querySelector('input[name="pageEnd"]');
    if (!spanning) { einput.value = ""; }
    else {
      const start = parseInt(f.querySelector('input[name="page"]').value, 10) || 1;
      const max = parseInt(f.querySelector('input[name="page"]').max, 10) || 1;
      einput.value = Math.min(start + 1, max);
      einput.focus();
    }
  }
  else if (act === "note-cancel") closeNoteForm();
  else if (act === "confirm-yes") { if (confirmAction) { confirmAction(); confirmAction = null; } confirmDialog.close(); }
  else if (act === "confirm-no") { confirmAction = null; confirmDialog.close(); }
});

document.addEventListener("click", (e) => {
  const x = e.target.closest("[data-idx]");
  if (!x) return;
  const i = parseInt(x.dataset.idx, 10);
  pendingImages.splice(i, 1);
  renderThumbs();
});

document.addEventListener("change", async (e) => {
  const t = e.target;
  if (t && t.id === "import-file") { importLibrary(t.files[0]); t.value = ""; }
  if (t && t.matches(".status-select")) setStatus(currentBookId(), t.value);
  if (t && t.matches(".nf-files")) {
    const files = [...t.files].slice(0, MAX_IMAGES_PER_NOTE - pendingImages.length);
    const overflow = [...t.files].length - files.length;
    for (const f of files) {
      try { pendingImages.push(await downscaleImage(f)); } catch (err) { toast("Couldn't read that image.", true); }
    }
    renderThumbs();
    if (overflow > 0) toast(`Up to ${MAX_IMAGES_PER_NOTE} photos per note — ${overflow} skipped.`, true);
    t.value = "";
  }
});

document.addEventListener("input", (e) => {
  if (e.target && e.target.matches(".cp-text")) autosize(e.target);
});

document.addEventListener("paste", (e) => {
  if (!$(".composer", $("#view"))) return;
  const files = [...(e.clipboardData ? e.clipboardData.items : [])]
    .filter(i => i.kind === "file" && i.type.startsWith("image/"))
    .map(i => i.getAsFile())
    .filter(Boolean);
  if (files.length === 0) return;
  e.preventDefault();
  const take = files.slice(0, Math.max(0, MAX_IMAGES_PER_NOTE - pendingImages.length));
  const overflow = files.length - take.length;
  for (const f of take) {
    downscaleImage(f)
      .then(src => { pendingImages.push(src); renderThumbs(); })
      .catch(() => toast("Couldn't read that image.", true));
  }
  if (overflow > 0) toast(`Up to ${MAX_IMAGES_PER_NOTE} photos per note — ${overflow} skipped.`, true);
});

document.addEventListener("submit", (e) => {
  const f = e.target;
  if (f && f.classList.contains("composer")) {
    e.preventDefault();
    const id = currentBookId();
    saveNote(id, f.querySelector('input[name="page"]').value, f.querySelector('input[name="pageEnd"]').value, f.querySelector(".cp-text").value);
  }
  if (f && f.id === "book-form") {
    const data = Object.fromEntries(new FormData(f).entries());
    e.preventDefault();
    if (!data.title || !data.totalPages) { toast("Title and total pages are required.", true); return; }
    if (editingBookId) updateBook(editingBookId, data);
    else newBook(data);
    editingBookId = null;
    if (bookDialog.open) bookDialog.close();
    f.reset();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.matches("#page-input")) {
    e.preventDefault();
    readPageInput(e.target);
  }
  if (e.key === "Enter" && !e.shiftKey && e.target.matches(".cp-text")) {
    e.preventDefault();
    e.target.closest("form").requestSubmit();
  }
  if (e.key === "Escape" && $("#book-dialog").open) $("#book-dialog").close();
  if (e.key === "Escape" && confirmDialog.open) { confirmDialog.close(); confirmAction = null; }
});

/* ---------- boot ---------- */
loadState();
updateFootnote();
route();
window.addEventListener("hashchange", route);
# present.now

A frontend-only, single-page visual content & presentation workspace. Drop in text, images, video, code, and output boxes onto a canvas, arrange them freely, and export the result as a PDF, PPTX, or DOCX — all without a backend. Everything lives in your browser (`localStorage` for document state, `IndexedDB` for images/video).

## Features

- **Single-page visual canvas** — add, drag, resize, and layer content boxes on a document-like surface.
- **Five box types**
  - **Text** — rich per-box formatting (font family/size, bold/italic/underline, alignment, text & fill color), expandable editor.
  - **Image** — local upload (stored in IndexedDB, not on any server), replace/remove, resizable.
  - **Video** — paste a YouTube/Vimeo/direct URL, or upload a local video file. A per-box Loop toggle controls whether the video restarts automatically when it ends (native HTML `loop` attribute; independent per box, defaults off).
  - **Code** — VS Code–style editor with syntax highlighting (Prism), line numbers, and a language selector (JS, TS, Python, C, C++, Java, HTML, CSS, SQL, JSON, Bash).
  - **Output** — a visually distinct, manually editable panel for pasting/typing results.
- **Box-to-box connections** — drag from any of a box's four border-mounted connection points (top/right/bottom/left) to another box to draw a directional arrow between them. Arrows stay attached through moves/resizes, are cleaned up automatically when a connected box is deleted, and are selectable/deletable on their own (click an arrow, press Delete).
- **Per-box lock** — toggle a box's position/size lock from its toolbar (Lock/Unlock icon). A locked box can't be dragged or resized (its resize handle is hidden and its drag handle is inert), but everything else — content editing, zoom, expand, copy, delete, connections — keeps working exactly as before.
- **Per-box controls** — zoom in/out (50%–200%), expand to a focused modal view, duplicate, delete, drag-to-move, drag-to-resize.
- **Undo/redo** — `Ctrl+Z` / `Ctrl+Shift+Z` (or `Ctrl+Y`), including for adds, deletes, moves, resizes, edits, and copies.
- **Keyboard shortcuts** — `Ctrl+S` save, `Ctrl+D` duplicate, `Delete` remove selected, `Esc` deselect/exit expand — all suppressed while typing in a text field so native editing is never broken.
- **Light/dark theme**, persisted locally.
- **Local document manager** — save, open, rename, and delete documents, all stored in `localStorage`.
- **Export** — PDF (canvas snapshot), PPTX (single slide, boxes mapped to shapes/text/images), DOCX (reading-order text/code/images).
- **Autosave** with a visible "Saving… / Saved locally" indicator (debounced, so it doesn't hammer `localStorage` on every keystroke).
- Fully responsive, accessible (labeled icon buttons, tooltips, keyboard-navigable dialogs, visible focus states).

## Tech stack

- **React 18** + **Vite** (JavaScript, not TypeScript — kept intentionally simple)
- **Tailwind CSS** (light/dark via the `class` strategy)
- **lucide-react** for icons
- **react-simple-code-editor** + **prismjs** for the code box
- **html2canvas** + **jspdf** for PDF export
- **pptxgenjs** for PPTX export
- **docx** + **file-saver** for DOCX export
- Plain `IndexedDB` (via a tiny hand-written wrapper) for image/video binary storage
- Plain `localStorage` for document JSON and settings

No backend, no database server, no authentication system, no external API calls for content.

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

This starts the Vite dev server (usually at `http://localhost:5173`).

## Build

```bash
npm run build
```

Outputs a production build to `dist/`. Preview it locally with:

```bash
npm run preview
```

## Lint

```bash
npm run lint
```

## Architecture

```
src/
  components/
    layout/     Header, Footer, AddBoxMenu, HelpMenu, SaveStatus
    canvas/     Canvas (the page surface), ConnectionLayer (SVG arrow overlay)
    boxes/      BaseBox (shared drag/resize/zoom/expand/toolbar chrome) +
                TextBox, ImageBox, VideoBox, CodeBox, OutputBox, BoxToolbar,
                ConnectionPoints (the four border-mounted connection dots)
    editor/     TextEditor (formatting toolbar), CodeEditor (Prism-powered)
    dialogs/    ConfirmDialog, ExportDialog, DocumentDialog
    ui/         Tooltip, IconButton, Dropdown
    ErrorBoundary.jsx
  hooks/
    useLocalStorage, useUndoRedo, useKeyboardShortcuts,
    useDebouncedEffect, useMediaUrl, useTheme
  store/
    DocumentContext.jsx   — the single source of truth (document, selection,
                             box CRUD, autosave, undo/redo wiring)
  services/
    storage/    documentStorage.js, settingsStorage.js, mediaStorage.js
    export/     exportPdf.js, exportPptx.js, exportDocx.js
  utils/
    ids.js, formatting.js, factories.js (data model + box factories),
    video.js, exportHelpers.js, canvasSize.js (content-aware canvas sizing),
    connections.js (connection-point coordinate math + connection factory)
```

### Why `BaseBox`?

Every box type (text/image/video/code/output) shares the same chrome: selection border, drag handle, resize handle, zoom controls, expand/duplicate/delete buttons. `BaseBox` implements all of that once; each concrete box component only supplies its own inner content and any extra toolbar controls (e.g. a language dropdown for code, a URL field for video).

### State management

`DocumentContext` (`src/store/DocumentContext.jsx`) is the single source of truth. It wraps a generic `useUndoRedo` hook so most box mutations (add, delete, copy, style/content edits) are recorded as undo steps, while high-frequency updates (dragging, resizing) are applied live without spamming the history stack, then committed as a single undo step once the drag/resize ends. All updates are immutable (`{ ...prev, boxes: prev.boxes.map(...) }`), never in-place mutations.

## Local storage approach

- **`localStorage`** holds document JSON (`boxes`, positions, sizes, styles, zoom, language, etc.), the list of saved documents, the active document id, and theme settings. It's wrapped by `services/storage/documentStorage.js` and `settingsStorage.js` — components never call `localStorage` directly.
- **`IndexedDB`** holds the actual image/video bytes (`services/storage/mediaStorage.js`). Boxes only store a `mediaId` reference; the binary blob lives in IndexedDB so we don't blow past `localStorage`'s ~5MB quota with base64 images.
- Saves are **debounced** (500ms after the last change) and surfaced in the header as "Saving…" / "Saved locally" / "Save failed".
- Corrupted or missing local data never crashes the app — `documentStorage`/`settingsStorage` catch JSON parse errors and fall back to sensible defaults, and a top-level `ErrorBoundary` catches any unexpected render error.

## Export approach

- **PDF** — `html2canvas` rasterizes the live canvas page DOM node, then `jspdf` drops that image into a single A4 page (auto portrait/landscape based on aspect ratio).
- **PPTX** — `pptxgenjs` builds one 16:9 slide and maps every box's pixel position/size (proportional to the page width) onto slide coordinates: text boxes become native PPT text boxes (with formatting), images are embedded as base64, code/output boxes become styled rectangles with monospace text, and video boxes become either an embedded local video, an online YouTube embed, or a text link.
- **DOCX** — the `docx` library builds a top-to-bottom, left-to-right reading-order document: text boxes become styled paragraphs, code/output boxes become shaded monospace paragraphs, images are embedded directly, and videos are represented as a link/note (DOCX can't embed a `<video>` player).

Because true 1:1 fidelity across a free-form canvas, slides, and a linear document isn't possible, exports prioritize **preserving all content and reasonable structure** over pixel-perfect layout replication.

## Known limitations

- This is a genuinely frontend-only app — there is no sync between devices/browsers. Clearing site data / browser storage will remove all saved documents and media.
- Large images/videos are capped (15MB / 60MB respectively) to keep `IndexedDB` usage reasonable; there's no compression pipeline.
- PPTX/DOCX export of video is best-effort: local videos are embedded where possible, but playback support for embedded video varies by version of PowerPoint/Word; non-YouTube URLs export as a text link.
- The "Output" box is manually editable only — the app does not execute user code in the browser (by design, for security).
- Only a single page/document is open at a time; multiple documents are supported via the "Recent documents" manager, not as tabs within one canvas.

## Adding a new box type

1. **Data model** — add a case to `createBox()` in `src/utils/factories.js` with sensible defaults (`width`, `height`, `content`, `style`).
2. **Component** — create `src/components/boxes/YourBox.jsx`. Wrap your content in `<BaseBox box={box} pageRef={pageRef} extraControls={...} secondaryToolbar={...}>...</BaseBox>` — `BaseBox` gives you selection, drag, resize, zoom, expand, copy, and delete for free.
3. **Register it** — add `yourtype: YourBox` to `BOX_COMPONENTS` in `src/components/canvas/Canvas.jsx`.
4. **Add-box menu** — add an entry to `OPTIONS` in `src/components/layout/AddBoxMenu.jsx` (label, description, icon).
5. **Exports (optional)** — extend `exportToPdf`/`exportToPptx`/`exportToDocx` in `src/services/export/` if the new type needs special handling beyond a generic snapshot.
6. **Media (optional)** — if your box stores binary data, use `saveMedia`/`getMedia`/`deleteMedia` from `src/services/storage/mediaStorage.js` and reference the returned id from `box.content.mediaId`, following the pattern in `ImageBox.jsx`.

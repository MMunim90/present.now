# present.now

A frontend-only, single-page visual content & presentation workspace. Drop in text, images, video, code, output, and graph boxes onto a canvas, arrange them freely, and export the result as a PDF, PPTX, or DOCX — all without a backend. Everything lives in your browser (`localStorage` for document state, `IndexedDB` for images/video).

## Features

- **Single-page visual canvas** — add, drag, resize, and layer content boxes on a document-like surface.
- **Six box types**
  - **Text** — rich per-box formatting (font family/size, bold/italic/underline, alignment, text & fill color), expandable editor.
  - **Image** — local upload (stored in IndexedDB, not on any server), replace/remove, resizable, and rotatable in 90° steps (rotates only the image content, independent per box).
  - **Video** — paste a YouTube/Vimeo/direct URL, or upload a local video file. A per-box Loop toggle controls whether the video restarts automatically when it ends (native HTML `loop` attribute; independent per box, defaults off).
  - **Code** — VS Code–style editor with syntax highlighting (Prism), line numbers, and a language selector (JS, TS, Python, C, C++, Java, HTML, CSS, SQL, JSON, Bash).
  - **Output** — a visually distinct, manually editable panel for pasting/typing results.
  - **Graph** — statistical charts (bar, grouped bar, line, area, pie, doughnut, scatter, bubble, radar, polar area, horizontal bar, stacked bar, histogram, mixed bar + line) and mathematical function plots (`y = f(x)`), with an in-box Data/Style editor, pan/zoom for function graphs, and PNG/SVG export. See [Graph Box](#graph-box) below.
- **Box-to-box connections** — drag from any of a box's four border-mounted connection points (top/right/bottom/left) to another box to draw a directional arrow between them. Arrows stay attached through moves/resizes, are cleaned up automatically when a connected box is deleted, and are selectable/deletable on their own (click an arrow, press Delete).
- **Per-box lock** — toggle a box's position/size lock from its toolbar (Lock/Unlock icon). A locked box can't be dragged or resized (its resize handle is hidden and its drag handle is inert), but everything else — content editing, zoom, expand, copy, delete, connections — keeps working exactly as before.
- **Per-box controls** — zoom in/out (50%–200%), expand to a focused modal view, duplicate, delete, drag-to-move, drag-to-resize.
- **Undo/redo** — `Ctrl+Z` / `Ctrl+Shift+Z` (or `Ctrl+Y`), including for adds, deletes, moves, resizes, edits, and copies.
- **Keyboard shortcuts** — `Ctrl+S` save, `Ctrl+D` duplicate, `Delete` remove selected, `Esc` deselect/exit expand — all suppressed while typing in a text field so native editing is never broken.
- **Light/dark theme**, persisted locally. Graphs recolor live when the theme changes.
- **Local document manager** — save, open, rename, and delete documents, all stored in `localStorage`.
- **Export** — PDF (canvas snapshot), PPTX (single slide, boxes mapped to shapes/text/images), DOCX (reading-order text/code/images). Individual graphs can also be exported on their own as PNG (all graph types) or SVG (function graphs).
- **Autosave** with a visible "Saving… / Saved locally" indicator (debounced, so it doesn't hammer `localStorage` on every keystroke).
- Fully responsive, accessible (labeled icon buttons, tooltips, keyboard-navigable dialogs, visible focus states).

## Tech stack

- **React 18** + **Vite** (JavaScript, not TypeScript — kept intentionally simple)
- **Tailwind CSS** (light/dark via the `class` strategy)
- **lucide-react** for icons
- **react-simple-code-editor** + **prismjs** for the code box
- **chart.js** + **react-chartjs-2** for statistical charts in the graph box (lazy-loaded)
- A hand-written, `eval`-free expression parser and SVG plotter for function graphs (no extra dependency)
- **html2canvas** + **jspdf** for PDF export
- **pptxgenjs** for PPTX export
- **docx** + **file-saver** for DOCX export (`file-saver` is also used for graph PNG/SVG downloads)
- Plain `IndexedDB` (via a tiny hand-written wrapper) for image/video binary storage
- Plain `localStorage` for document JSON and settings

No backend, no database server, no authentication system, no external API calls for content.

## Installation

```bash
npm install
```

This installs everything, including the graph box's `chart.js` and `react-chartjs-2`.

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
                TextBox, ImageBox, VideoBox, CodeBox, OutputBox, GraphBox,
                BoxToolbar, ConnectionPoints (the four border-mounted connection dots)
    graph/      StatChart (lazy Chart.js renderer), MathPlot (SVG function plotter),
                GraphDataEditor, GraphStyleEditor, fields (form primitives)
    editor/     TextEditor (formatting toolbar), CodeEditor (Prism-powered)
    dialogs/    ConfirmDialog, ExportDialog, DocumentDialog
    ui/         Tooltip, IconButton, Dropdown
    ErrorBoundary.jsx
  hooks/
    useLocalStorage, useUndoRedo, useKeyboardShortcuts,
    useDebouncedEffect, useMediaUrl, useTheme, useIsDark
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
    graph/      expressionParser.js (safe parser), graphDefaults.js (chart catalogue,
                sample data, type conversion, normalizer), chartConfig.js (saved model →
                Chart.js config), mathPlotUtils.js (ticks/paths/zoom maths), graphTheme.js
```

### Why `BaseBox`?

Every box type (text/image/video/code/output/graph) shares the same chrome: selection border, drag handle, resize handle, zoom controls, expand/duplicate/delete buttons. `BaseBox` implements all of that once; each concrete box component only supplies its own inner content and any extra toolbar controls (e.g. a language dropdown for code, a URL field for video, tabs and export buttons for graphs).

### State management

`DocumentContext` (`src/store/DocumentContext.jsx`) is the single source of truth. It wraps a generic `useUndoRedo` hook so most box mutations (add, delete, copy, style/content edits) are recorded as undo steps, while high-frequency updates (dragging, resizing) are applied live without spamming the history stack, then committed as a single undo step once the drag/resize ends. All updates are immutable (`{ ...prev, boxes: prev.boxes.map(...) }`), never in-place mutations.

## Graph Box

Add one from **Add content → Graph**. It behaves like every other box (move, resize, lock, zoom, expand, duplicate, delete, connection points) and adds three tabs to its toolbar while selected:

- **Graph** — the rendered chart.
- **Data** — graph type, title/subtitle, and the data itself: editable tables (add/delete rows, add/remove series, per-series colors, per-slice colors for pie-style charts), x/y point lists for scatter and bubble, a values box with bin count for histograms, or a list of expressions for function graphs. In expanded mode the editor sits beside the graph.
- **Style** — only the options that make sense for the chosen type: axis labels, legend, grid, font size, background color, line thickness, point size, axis min/max (blank = automatic), aspect ratio, and series colors. For example, pie charts show no axis or grid settings.

**Statistical charts** are rendered with Chart.js (tooltips, legend click-to-toggle, multiple datasets). The library is lazy-loaded, so it is only downloaded once a graph is on the canvas.

**Function graphs** are rendered by an in-house SVG plotter:

- Type expressions in `x`, e.g. `2x + 3`, `x^2`, `sin(x)`, `x³ - 2x`. An optional `y =` prefix is accepted. Several functions can share one plane, each with its own color, and invalid input shows an inline message instead of being drawn.
- Supported: `+ - * / ^`, parentheses, implicit multiplication (`2x`, `3(x+1)`), `sin cos tan asin acos atan sinh cosh tanh sqrt cbrt abs exp ln log log2 floor ceil round`, and the constants `pi` and `e`. **`log` is base 10; `ln` is the natural logarithm.**
- Expressions are parsed into a closure tree by a hand-written parser. User input is never passed to `eval()` or `new Function()`, and length and nesting are capped.
- While the box is selected: drag to pan, scroll to zoom, and use the **Reset view** toolbar button to return to the default window. Wheel zoom is only active on a selected box, so scrolling over an unselected graph still scrolls the canvas, and `Ctrl` + wheel is left to canvas zoom. Hovering shows the value of each function at the cursor.

**Export** — the toolbar's export buttons save just that graph (not the whole canvas): **PNG** for every graph type, and **SVG** for function graphs. The files include the title, labels, legend, and styling, and use the graph's current theme background.

**Data model** — a graph is a normal box with a `graphData` object (shape depends on the chart family):

```js
{
  id, type: 'graph', x, y, width, height, zoom, locked,
  graphData: {
    chartType: 'bar',              // or 'line', 'pie', 'scatter', 'histogram', 'function', ...
    title: 'Monthly Sales', subtitle: '',
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [{ id, label: '2024', color: '#3366ff', data: [120, 190, 150] }],
    // function graphs use `functions: [{ id, expr, color, visible }]` and `view: { xMin, xMax, yMin, yMax }`
    settings: { xLabel, yLabel, showLegend, showGrid, background, fontSize, lineWidth, pointSize, xMin, xMax, yMin, yMax, aspectRatio, bins }
  }
}
```

Switching chart type keeps your data when the types share a data shape (e.g. bar → line) and loads sample data otherwise; title, subtitle, and style settings are always kept. Saved graph data is normalized when rendered, so missing or corrupted data falls back to safe defaults instead of crashing.

## Local storage approach

- **`localStorage`** holds document JSON (`boxes`, positions, sizes, styles, zoom, language, graph data, etc.), the list of saved documents, the active document id, and theme settings. It's wrapped by `services/storage/documentStorage.js` and `settingsStorage.js` — components never call `localStorage` directly.
- **`IndexedDB`** holds the actual image/video bytes (`services/storage/mediaStorage.js`). Boxes only store a `mediaId` reference; the binary blob lives in IndexedDB so we don't blow past `localStorage`'s ~5MB quota with base64 images.
- Graph boxes need no extra storage: their data, expressions, colors, settings, and function-plot view window are all part of the box in the document JSON.
- Saves are **debounced** (500ms after the last change) and surfaced in the header as "Saving… / Saved locally / Save failed".
- Corrupted or missing local data never crashes the app — `documentStorage`/`settingsStorage` catch JSON parse errors and fall back to sensible defaults, and a top-level `ErrorBoundary` catches any unexpected render error.

## Export approach

- **PDF** — `html2canvas` rasterizes the live canvas page DOM node, then `jspdf` drops that image into a single A4 page (auto portrait/landscape based on aspect ratio).
- **PPTX** — `pptxgenjs` builds one 16:9 slide and maps every box's pixel position/size (proportional to the page width) onto slide coordinates: text boxes become native PPT text boxes (with formatting), images are embedded as base64, code/output boxes become styled rectangles with monospace text, and video boxes become either an embedded local video, an online YouTube embed, or a text link.
- **DOCX** — the `docx` library builds a top-to-bottom, left-to-right reading-order document: text boxes become styled paragraphs, code/output boxes become shaded monospace paragraphs, images are embedded directly, and videos are represented as a link/note (DOCX can't embed a `<video>` player).
- **Individual graphs** — each graph box has its own PNG export (and SVG for function graphs) in its toolbar, independent of the document exports above.

Because true 1:1 fidelity across a free-form canvas, slides, and a linear document isn't possible, exports prioritize **preserving all content and reasonable structure** over pixel-perfect layout replication.

## Known limitations

- This is a genuinely frontend-only app — there is no sync between devices/browsers. Clearing site data / browser storage will remove all saved documents and media.
- Large images/videos are capped (15MB / 60MB respectively) to keep `IndexedDB` usage reasonable; there's no compression pipeline.
- PPTX/DOCX export of video is best-effort: local videos are embedded where possible, but playback support for embedded video varies by version of PowerPoint/Word; non-YouTube URLs export as a text link.
- The PPTX and DOCX exporters don't include graph boxes yet; export a graph on its own as PNG/SVG from its toolbar. The PDF export is a snapshot of the canvas.
- Graph SVG export is available for function graphs only; Chart.js (statistical charts) can't produce SVG, so those export as PNG.
- Function graphs plot `y = f(x)` only (no implicit equations, parametric curves, or piecewise definitions).
- The "Output" box is manually editable only — the app does not execute user code in the browser (by design, for security).
- Only a single page/document is open at a time; multiple documents are supported via the "Recent documents" manager, not as tabs within one canvas.

## Adding a new box type

1. **Data model** — add a case to `createBox()` in `src/utils/factories.js` with sensible defaults (`width`, `height`, `content`, `style`), plus an entry in `DEFAULTS_BY_TYPE`. Box-specific data can live in its own field, as `graphData` does for graphs.
2. **Component** — create `src/components/boxes/YourBox.jsx`. Wrap your content in `<BaseBox box={box} pageRef={pageRef} extraControls={...} secondaryToolbar={...}>...</BaseBox>` — `BaseBox` gives you selection, drag, resize, zoom, expand, copy, and delete for free. `GraphBox.jsx` is a good reference for a box with its own tabs/editor, lazy-loaded heavy dependency, and per-box export.
3. **Register it** — add `yourtype: YourBox` to `BOX_COMPONENTS` in `src/components/canvas/Canvas.jsx`.
4. **Add-box menu** — add an entry to `OPTIONS` in `src/components/layout/AddBoxMenu.jsx` (label, description, icon).
5. **Exports (optional)** — extend `exportToPdf`/`exportToPptx`/`exportToDocx` in `src/services/export/` if the new type needs special handling beyond a generic snapshot (the graph box doesn't yet, which is why PPTX/DOCX skip it).
6. **Media (optional)** — if your box stores binary data, use `saveMedia`/`getMedia`/`deleteMedia` from `src/services/storage/mediaStorage.js` and reference the returned id from `box.content.mediaId`, following the pattern in `ImageBox.jsx`.

# DocBit — Custom Data Report Generator

Turn Excel, CSV, and JSON files into clean, accurate reports — free, and processed
locally in your browser.

## What this is

DocBit is a standalone, client-side web application. There is no backend and no
database: every file you upload is parsed and processed entirely in your browser's
memory. Nothing is sent to a server.

Core workflow: **Upload → Header row → Rows → Columns → Filter → Sort → Group →
Calculate → Design → Preview → Export**.

## Tech stack

- **React 18 + TypeScript**, built with **Vite**
- **Tailwind CSS** for styling
- **SheetJS (`xlsx`)** for Excel read/write
- **PapaParse** for CSV parsing
- **jsPDF + jspdf-autotable** for PDF export
- No backend, no database, no authentication required for the core workflow

## Local development

```bash
npm install
npm run dev
```

This starts a local dev server (default `http://localhost:5173`).

## Building for production

```bash
npm run build
```

Output is written to `dist/`. Preview the production build locally with:

```bash
npm run preview
```

## Deploying to Netlify

This repo ships with a `netlify.toml` that's ready to go:

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** 20
- Includes an SPA redirect rule (`/* -> /index.html`) so client-side routing/reloads
  work correctly, plus basic security headers and long-lived caching for hashed
  static assets.

**Steps:**

1. Push this project to a Git repository (GitHub, GitLab, or Bitbucket).
2. In Netlify: **Add new site → Import an existing project**, and select the repo.
3. Netlify will auto-detect the settings from `netlify.toml` — just confirm and
   deploy. No environment variables are required.

Alternatively, deploy without Git using the Netlify CLI:

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

## Project structure

```
src/
  adapters/     Input adapters (Excel, CSV, JSON) — normalize any file into one
                common RawDataset shape.
  engine/       The deterministic report engine: header detection, filtering,
                sorting, grouping, calculations, data-quality checks, and the
                single authoritative processing pipeline (pipeline.ts) shared
                by both the preview and every export format. Unchanged by the
                UI/UX pass — the UI only ever consumes this layer.
  export/       CSV, JSON, Excel (SheetJS), and PDF (jsPDF) export, plus
                pre-export validation.
  types/        Canonical data model: RawDataset, ReportConfig, ProcessedReport.
  router/       A minimal, dependency-free client-side router (History API)
                powering the two routes: "/" and "/workspace".
  pages/        HomePage ("/" — hero, upload, marketing content, and the report
                generator workspace once a file is loaded) and WorkspacePage
                ("/workspace" — the coming-soon product preview).
  components/   Shared UI: the global Header, the report-builder Workspace
                shell, its panels (Data, Columns, Filter, Sort, Group,
                Calculate, Design, Export), the live preview table, the mobile
                bottom sheet + FAB, and landing-page pieces under
                components/landing/.
  hooks/        Report configuration state with undo/redo, a toast system, and
                a small count-up animation hook for dataset stats.
```

## Routes

- **`/`** — the free report generator. Fully usable without an account: hero,
  upload dropzone, marketing/use-case content, and (once a file is uploaded)
  the full report-builder workspace, all on one route.
- **`/workspace`** — a coming-soon preview of the future personal workspace
  (generation history, projects, storage, billing, members/permissions). No
  authentication or backend is implemented — it's an honest product-roadmap
  preview, not a functional feature.

Both routes are handled client-side by a small custom router in `src/router`,
which is why `netlify.toml` includes an SPA redirect (`/* → /index.html`) so
a hard reload or direct link to `/workspace` still resolves correctly.

## Design principles this project follows

- **One authoritative pipeline.** `engine/pipeline.ts` produces a single
  `ProcessedReport` from a `RawDataset` + `ReportConfig`. The live preview and
  every export format (PDF/Excel/CSV/JSON) consume the exact same result, so a
  downloaded file can never disagree with what was previewed. Live cell edits
  (`config.cellEdits`, applied in `engine/edits.ts`) are folded in at the very
  start of the pipeline, so filtering, sorting, calculations, and every export
  format all see edited values consistently — never a stale original.
- **Non-destructive configuration.** The original uploaded data is never
  mutated. Hiding a column, excluding a row range, changing the header row, or
  editing a cell in the live preview only changes the `ReportConfig` —
  "Reset report" always returns to the original data.
- **Undo/Redo is scoped to data, not configuration.** `HomePage.tsx` exposes
  two update functions: `updateConfig` (used by every panel — filters, sort,
  grouping, calculations, columns, design, header row) applies changes with
  `skipHistory: true`, while `updateData` (used only by live cell edits in
  the preview table) records a real undo step. Selecting rows, columns, or
  any configuration option never creates an undo state; only actual data
  edits do.
- **Deterministic processing.** No hidden transformations, no silent coercion,
  no random reordering. Given the same file and the same configuration, DocBit
  always produces the same report.
- **Privacy by default.** Files are read and processed with the browser's
  File API; nothing is uploaded to a server. A custom PDF logo, if added, is
  converted to a data URL client-side and never leaves the browser either.

## PDF templates & branding

`export/pdfTemplates.ts` is a small registry of visual templates (colors,
table style, title font) consumed by `export/pdf.ts` — the data that goes
into a PDF is always the same `ProcessedReport`; templates only change how it
looks. Five templates ship free today; two premium stubs (`branded-premium`,
`custom-premium`) are already in the registry with `tier: 'premium'` and
`comingSoon: true`, shown locked in the template picker. Adding a real paid
template later is just adding another registry entry and, eventually, a real
plan check where `tier` is read — no export logic needs to change.

Custom branding (logo, accent color, footer text) is a separate, available-now
feature (`design.branding` in `ReportConfig`) — logo files are read client-side
via `FileReader` into a data URL and never uploaded anywhere.

Design and PDF export live together under one "Design & Export" section
(`components/panels/ExportPanel.tsx` renders `DesignPanel` inline, above the
export actions) — Excel, CSV, and JSON stay as plain, template-free data
exports below it. PDF export itself is gated: `export/index.ts`'s
`checkPdfEligibility()` disables it with a specific, visible reason once a
report exceeds `PDF_MAX_COLUMNS` (10) or `PDF_MAX_ROWS` (5,000), since a fixed
printable layout doesn't hold up well past that — Excel/CSV/JSON have no such
limit.

## Browser support & limits

DocBit works in modern evergreen browsers (Chrome, Edge, Firefox, Safari).
Because processing happens in-browser, there's a practical file-size ceiling
(around 100 MB) to stay within reliable browser memory limits — DocBit will
explain this clearly if a file is too large rather than silently failing.

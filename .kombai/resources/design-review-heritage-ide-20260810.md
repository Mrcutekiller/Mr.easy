# MR.easy Heritage UI and IDE QA Plan

**Review date:** 2026-08-10  
**Surfaces:** `website/index.html`, `ide/index.html`, `ide/style.css`, `ide/compiler.js`, `ide/editor.js`  
**Scope:** Responsive safety, heritage design-system consistency, compiler ownership, interaction contracts

> **Note:** Browser access was unavailable for this run, so this pass uses static source inspection and executable smoke checks. A live browser pass should still verify computed sizes, font loading, screenshot fidelity, iframe scaling, and console/network behavior at each viewport.

## Current direction

The product is an Ethiopian-born programming language and browser IDE. The visual language is **Adwa Heritage Ink**:

- Deep ink surfaces with parchment text.
- Aged brass as the primary interaction and syntax accent.
- Adwa red and green as restrained semantic/decorative signals.
- Playfair Display for editorial display, Inter for UI/body, and DM Mono for code/commands.
- Woven/crosshatch geometry and Ge'ez marks used as quiet cultural texture, not as decoration everywhere.
- Marketing site uses editorial asymmetry; IDE uses dense, edge-to-edge workbench geometry.

## Static responsive checkpoints

| Viewport | Website expectation | IDE expectation | Static evidence | Status |
|---|---|---|---|---|
| 1440px | Hero remains two-column, container caps at 1180px, bento cells keep clear hierarchy | Full rail + explorer + editor + preview, preview scales from 1280px internal canvas | `website/index.html` `.container`, `.hero-grid`; `ide/style.css` `.workspace`, `#preview-frame` | Pass by source |
| 1024px | Container and editorial spread remain readable | Topbar hides secondary controls; explorer remains compact; split view remains usable | `website/index.html` `@media (max-width:900px)`; `ide/style.css` `@media (max-width:1180px)` | Pass by source; browser needed for density |
| 768px | Hero/story stack; bento feature spans full width; playground stacks | Sidebar narrows; topbar moves view tabs; editor/preview remain split | `website/index.html` `@media (max-width:900px)`; `ide/style.css` `@media (max-width:840px)` | Pass by source; browser needed for touch review |
| 390px | Nav simplifies; hero actions stack; demo split and install columns stack | Explorer hides, rail remains, nonessential labels hide, view tabs collapse | `website/index.html` `@media (max-width:560px)`; `ide/style.css` `@media (max-width:640px)` | Pass by source; browser needed for overflow review |

## Interaction contracts checked

- Website anchor IDs remain: `live-demo`, `how`, `syntax`, `about`, `install`.
- Website live playground still compiles `#home-playground-code` into `#home-preview-frame` on input.
- IDE preserves existing global action names used by inline handlers: `switchTab`, `setViewport`, `setZoom`, `togglePreviewTheme`, `insertSnippet`, `loadExample`, `runCode`, `refreshPreview`, `openInNewTab`, `downloadHTML`, `downloadSource`, `copySource`, `copyHTML`, `exportZip`, `clearCode`, modal helpers, toast helpers, and resize helpers.
- Preview-to-editor `JUMP_TO_LINE` messages remain supported through `data-line` attributes and `window.postMessage`.
- Existing DOM IDs used by layout and state logic remain: `workspace`, `sidebar`, `editor-panel`, `divider`, `preview-panel`, `preview-wrapper`, `preview-frame`, `line-col`, `filename`, `saved-indicator`, `status-dot`, `preview-status`, `char-count`, `guide-modal`, `toast`.
- Copy/download/export flows remain browser-side and do not require a backend.

## Refactor result

### Single source of truth

`ide/compiler.js` now owns:

- `KEYWORDS`, `STYLE_WORDS`, `COLOR_MAP`, `ICON_MAP`, `SIZE_MAP`.
- `STARTER` source.
- CodeMirror `mreasy` mode registration.
- `tokenizeLine`, indentation parsing, block/inline rendering, and action resolution.
- `browserCompile`, `compileLines`, and `wrapPage`.
- Dark/light generated preview tokens aligned to the Adwa Heritage Ink system.

`ide/editor.js` now owns only IDE runtime concerns:

- CodeMirror initialization and editor state.
- Preview updates, zoom, viewport, theme, resizing, and view switching.
- Snippet/example data and UI command handlers.
- Modal, toast, download, copy, and export actions.

`ide/index.html` is now markup and script loading only. It loads `compiler.js` before `editor.js`.

## Remaining follow-up plan

1. **Live visual QA:** Enable browser access and capture desktop, tablet, and mobile screenshots for both surfaces.
2. **Computed-style verification:** Check nav height, hero overflow, bento widths, IDE panel widths, CodeMirror height, and iframe scale at 1440/1024/768/390.
3. **Interaction pass:** Exercise playground typing, IDE compile, split/editor/preview tabs, viewport toggles, theme toggle, snippet insertion, templates, modals, drag divider, source download, HTML download, and ZIP export.
4. **Console/network pass:** Confirm no duplicate initialization, failed local asset loads, iframe runtime errors, or CodeMirror mode registration warnings.
5. **Refine from evidence:** Apply only screenshot- or console-backed adjustments; keep the shared tokens as the source of truth.

## Automated checks run

- `node --check ide/compiler.js` — passed.
- `node --check ide/editor.js` — passed.
- Shared compiler smoke test — passed: title extraction, `data-line` output, and button rendering.
- `npm run build` — passed; `ide/compiler.js` is copied into `dist/ide/` by the existing recursive build.

# design-sync notes

## Setup

- Package shape (no Storybook). Build with `npm run build` (Vite library mode + `@tailwindcss/vite`).
- Converter deps live in `.ds-sync/` (gitignored) — re-copy from the skill's bundled scripts on every sync (`cp -r <skill-base-dir>/{package-build.mjs,package-validate.mjs,package-capture.mjs,resync.mjs,lib,storybook} .ds-sync/`), then `cd .ds-sync && npm i esbuild ts-morph @types/react` (approve esbuild's postinstall: `npm approve-scripts esbuild`).

## Known render warns

- None recorded — render check has not been machine-run yet (see below).

## Re-sync risks

- **Render check has never run.** Playwright/Chromium were not installed for this sync (user chose to review `.review.html` manually in a browser instead of the ~200MB install). `package-validate.mjs` and `resync.mjs` were run with `--no-render-check`. `package-capture.mjs` (screenshot-based absolute grading) also requires Playwright and has never run — no `.design-sync/.cache/review/*.grade.json` verdicts exist. If Playwright gets installed on a future sync, the first run will do a full render check + full grading pass (nothing to carry forward).
- Human review substituted for automated grading this sync: the user opened `.review.html` locally and approved all 8 components' previews as-is.
- `tokens/` and `guidelines/` upload dirs are empty — this kit has no separate design-tokens package or markdown guideline files; all styling is inline Tailwind utility classes in each component and in `dist/agresh-design-system.css`.
- All 8 components are grouped under `general` (no `docsDir`/doc files exist to drive categorization). Add per-component docs or a `docsMap`/category frontmatter if finer grouping is wanted later.

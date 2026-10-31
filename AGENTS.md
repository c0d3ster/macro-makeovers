<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project rules

### Nutrition display

- Macros always read carbs, fat, protein (C/F/P): tables, ratios, bars, and share images. Never lead with protein and never highlight it.
- Use `formatMacroRatios` for the "42 / 27 / 31" ratio text and `toMacroRatios` for percentages.
- Macro colors are theme tokens (`carbs`, `fat`, `protein` in `src/styles/global.css`). The rest of the palette comes from the logo.

### Recipe data

- Recipe content lives in `content/recipes/*.json`, imported with `pnpm recipe:import` (local) or `pnpm recipe:import:prod` (hosted). `docs/recipes.md` is the book source.
- Recipe pages read through `src/libs/recipes`. Changing what a page shows usually means changing the import schema, the import function, and the loader together.

### Checks and commits

- Do not run `pnpm check:types`, `pnpm lint`, or `pnpm test` by hand before committing. The lefthook pre-commit hook runs lint, the type check, and the tests, and commitlint checks the message. Run one on its own only to debug a specific failure.
- The hook does not run `pnpm check:deps` (knip). Run it once before opening a PR.
- Commits use Conventional Commits. Keep body lines under 100 characters (commitlint rejects longer ones) and
  keep messages succinct.
- Commit and push at meaningful checkpoints, such as a finished feature or fix. Batch related edits into one commit instead of committing each small tweak while iterating.
- Bring a branch up to date with `main` by rebasing, never by merging `main` in. Force push only your own branch, with `--force-with-lease`.
- Never commit `supabase/.env` or any secret.

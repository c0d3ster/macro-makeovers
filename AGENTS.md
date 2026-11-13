<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project rules

### Nutrition display

- Macro ratios always read carbs, fat, protein (C/F/P): tables, ratio text, bars, and share images. That is only the ordering. Protein is a core part of the book, so keep it visible and give it full weight in copy, summaries, and highlights.
- Use `formatMacroRatios` for the "42 / 27 / 31" ratio text and `toMacroRatios` for percentages.
- Macro colors are theme tokens (`carbs`, `fat`, `protein` in `src/styles/global.css`). The rest of the palette comes from the logo.

### Recipe data

- The hosted database is the source of truth for recipes. New and edited recipes go through `/admin` or the Claude connector. `content/recipes/*.json` holds the 16 seed recipes (14 dishes and 2 sauces) for a fresh local database, imported with `pnpm recipe:import content/recipes` (local) or `pnpm recipe:import:prod content/recipes` (hosted). The printable book is built from the published recipes in the database (`pnpm book:pdf`), with its intro and recipe order in `content/book` and its guide prose in `content/guides` (shared with the site's `/guides` and `/about` pages).
- Recipe pages read through `src/libs/recipes`. Changing what a page shows usually means changing the import schema, the import function, and the loader together.

### Checks and commits

- Do not run `pnpm check:types`, `pnpm lint`, `pnpm check:deps`, or `pnpm test` on your own. Lefthook already runs lint and type checks on every commit, and the PR pipeline (PRs to `main` only) runs the deps check and the tests, so nothing needs a local run first. Run one only when the user asks, or to diagnose a specific failing CI job (run just that check).
- Commits use Conventional Commits. Keep body lines under 100 characters (commitlint rejects longer ones) and
  keep messages succinct.
- Commit and push at reasonable checkpoints, not after every change.
- Never commit `supabase/.env` or any secret.

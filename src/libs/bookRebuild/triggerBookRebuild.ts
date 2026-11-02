import { Env } from '@/libs/Env'
import { logger } from '@/libs/Logger'

// Must match `repository_dispatch.types` in .github/workflows/book.yml
export const BOOK_REBUILD_EVENT = 'recipe-book-rebuild'

// How long a dispatch may take before we give up. The call runs inside a GraphQL mutation, so it
// has to stay short.
const REQUEST_TIMEOUT_MS = 5000

// Server-side guard: skip a dispatch if this server instance sent one in the last minute.
//
// Tradeoff: serverless instances do not share memory, so this only collapses bursts that land on
// the same warm instance. It is not the real debounce. The workflow's concurrency group
// (cancel-in-progress) is: however many dispatches arrive, only the newest run finishes, so a burst
// of edits still produces one PDF. The guard just saves GitHub API calls and Actions run noise.
// A stronger guarantee would need a timestamp in the database, which is not worth a migration.
const MIN_INTERVAL_MS = 60_000

let lastDispatchAt = 0

// Test hook so one test's dispatch does not suppress the next
export const resetBookRebuildGuard = (): void => {
  lastDispatchAt = 0
}

// Asks GitHub to rebuild the recipe book PDF. Never throws and never rejects: a failed rebuild
// must not fail the publish or edit that triggered it. Without GITHUB_DISPATCH_TOKEN it logs and
// skips.
//
// The token is a fine-grained personal access token limited to this one repository. Fine-grained
// tokens need "Contents: Read and write" for POST /repos/{owner}/{repo}/dispatches and nothing else.
export const triggerBookRebuild = async (): Promise<void> => {
  const { GITHUB_DISPATCH_TOKEN: token, GITHUB_REPO: repo } = Env

  if (!token || !repo) {
    logger.info(
      'Skipping book rebuild: GITHUB_DISPATCH_TOKEN or GITHUB_REPO is not set'
    )
    return
  }

  const now = Date.now()
  if (now - lastDispatchAt < MIN_INTERVAL_MS) {
    logger.info('Skipping book rebuild: one was requested a moment ago')
    return
  }
  lastDispatchAt = now

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repo}/dispatches`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({ event_type: BOOK_REBUILD_EVENT }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }
    )

    if (!response.ok) {
      // Let the next change try again right away
      lastDispatchAt = 0
      logger.warn('Book rebuild dispatch was rejected', {
        status: response.status,
      })
    }
  } catch (error) {
    lastDispatchAt = 0
    logger.warn('Book rebuild dispatch failed', { error: String(error) })
  }
}

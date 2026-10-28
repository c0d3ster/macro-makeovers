import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ImportResultPanel } from './ImportResultPanel'

describe('ImportResultPanel', () => {
  it('lists each invalid field with its message', () => {
    render(
      <ImportResultPanel
        dryRun={false}
        result={{
          status: 'invalid',
          issues: [
            { path: 'costTier', message: 'Too big' },
            { path: 'nutrition[0].calories', message: 'Too small' },
          ],
        }}
      />
    )

    expect(screen.getByText('costTier')).toBeInTheDocument()
    expect(screen.getByText('nutrition[0].calories')).toBeInTheDocument()
    expect(screen.getByText(/Too big/)).toBeInTheDocument()
  })

  it('says a new recipe would be saved as a draft in a preview', () => {
    render(
      <ImportResultPanel
        dryRun
        result={{ status: 'created', slug: 'test-chili' }}
      />
    )

    expect(
      screen.getByText('"test-chili" is new and would be saved as a draft')
    ).toBeInTheDocument()
  })

  it('confirms a saved draft', () => {
    render(
      <ImportResultPanel
        dryRun={false}
        result={{ status: 'created', slug: 'test-chili', id: 'abc' }}
      />
    )

    expect(
      screen.getByText('Saved "test-chili" as a draft')
    ).toBeInTheDocument()
  })

  it('shows the field-level changes of a conflict', () => {
    render(
      <ImportResultPanel
        dryRun={false}
        result={{
          status: 'conflict',
          slug: 'test-chili',
          changes: [{ path: 'title', before: 'Old', after: 'New' }],
        }}
      />
    )

    expect(screen.getByText(/already exists/)).toBeInTheDocument()
    expect(screen.getByText('title')).toBeInTheDocument()
    expect(screen.getByText(/"Old"/)).toBeInTheDocument()
    expect(screen.getByText(/"New"/)).toBeInTheDocument()
  })

  it('notes that an update keeps the published status', () => {
    render(
      <ImportResultPanel
        dryRun={false}
        result={{
          status: 'updated',
          slug: 'test-chili',
          changes: [{ path: 'servings', before: 4, after: 6 }],
        }}
      />
    )

    expect(
      screen.getByText(/published status is unchanged/)
    ).toBeInTheDocument()
  })

  it('reports an unchanged recipe', () => {
    render(
      <ImportResultPanel
        dryRun={false}
        result={{ status: 'unchanged', slug: 'test-chili', id: 'abc' }}
      />
    )

    expect(screen.getByText(/nothing to change/)).toBeInTheDocument()
  })
})

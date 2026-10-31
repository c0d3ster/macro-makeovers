import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TagGroups, UnavailableOptions } from '@/libs/recipes'

import { parseRecipeFilters } from '@/libs/recipes'

import { FilterBar } from './FilterBar'

const push = vi.fn()

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const tagGroups: TagGroups = {
  meat: ['beef', 'chicken'],
  method: ['oven'],
  dish: [],
  goodFor: ['batch friendly'],
}

const renderBar = (
  params: Record<string, string> = {},
  unavailable: UnavailableOptions = {}
): void => {
  render(
    <FilterBar
      filters={parseRecipeFilters(params)}
      tagGroups={tagGroups}
      unavailable={unavailable}
      intro={<h1>Macro Makeovers</h1>}
    />
  )
}

const select = (name: RegExp): HTMLSelectElement =>
  screen.getByRole('combobox', { name })

describe('FilterBar', () => {
  beforeEach(() => {
    push.mockClear()
  })

  it('shows the title beside the search', () => {
    renderBar()

    expect(
      screen.getByRole('heading', { name: 'Macro Makeovers' })
    ).toBeInTheDocument()
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
  })

  it('submits the search text', () => {
    renderBar()

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: ' chili ' },
    })
    fireEvent.submit(screen.getByRole('search'))

    expect(push).toHaveBeenCalledWith('/?q=chili', { scroll: false })
  })

  it('offers A to Z first when there is nothing to match', () => {
    renderBar()

    const options = within(select(/sort/i)).getAllByRole('option')

    expect(options[0]).toHaveTextContent('Sort: A to Z')
    expect(options.map((option) => option.textContent)).not.toContain(
      'Sort: Best match'
    )
  })

  it('offers Best match first once there is a goal or search text', () => {
    renderBar({ carbs: '45', fat: '25', protein: '30' })

    expect(within(select(/sort/i)).getAllByRole('option')[0]).toHaveTextContent(
      'Sort: Best match'
    )
  })

  it('fills in the selectors when a goal is picked', () => {
    renderBar()

    fireEvent.change(select(/goal/i), { target: { value: 'fat-loss' } })

    expect(push).toHaveBeenCalledWith(
      '/?maxCalories=550&carbs=40&fat=25&protein=35',
      { scroll: false }
    )
  })

  it('shows the goal and its note when the selectors match a preset', () => {
    renderBar({ carbs: '45', fat: '25', protein: '30' })

    expect(select(/goal/i)).toHaveValue('recomp')
    expect(screen.getByText(/at or near maintenance/i)).toBeInTheDocument()
  })

  it('reads Custom once a selector no longer matches a preset', () => {
    renderBar({ carbs: '45', fat: '30', protein: '30' })

    expect(select(/goal/i)).toHaveValue('custom')
    expect(
      screen.getByRole('option', { name: 'Custom' })
    ).toBeInTheDocument()
  })

  it('changes a macro selector without touching the others', () => {
    renderBar({ carbs: '45', fat: '25', protein: '30' })

    fireEvent.change(select(/^fat\b/i), { target: { value: '30' } })

    expect(push).toHaveBeenCalledWith('/?carbs=45&fat=30&protein=30', {
      scroll: false,
    })
  })

  it('limits cost from the symbols and clears it on a second click', () => {
    renderBar()

    fireEvent.click(screen.getByRole('button', { name: 'Cost: up to 3' }))

    expect(push).toHaveBeenLastCalledWith('/?maxCost=3', { scroll: false })
  })

  it('limits time from the quick links', () => {
    renderBar()

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Time: up to 45 minutes' })[0]!
    )

    expect(push).toHaveBeenLastCalledWith('/?maxMinutes=45', { scroll: false })
  })

  it('grays out options that would return nothing', () => {
    renderBar({}, { meat: ['beef'], maxMinutes: ['30'] })

    expect(screen.getByRole('option', { name: 'Beef' })).toBeDisabled()
    expect(screen.getByRole('option', { name: 'Chicken' })).toBeEnabled()
    expect(
      screen.getAllByRole('button', { name: 'Time: up to 30 minutes' })[0]
    ).toBeDisabled()
  })

  it('counts the bar filters in the badge and links Clear all', () => {
    renderBar({ q: 'chili', maxMinutes: '45', carbs: '40' })

    expect(
      screen.getAllByRole('button', { name: 'Filters, 2 active' })[0]
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('link', { name: 'Clear all' })[0]
    ).toHaveAttribute('href', '/?q=chili')
  })

  it('lists active filters as chips that remove themselves', () => {
    renderBar({ maxMinutes: '45', maxCost: '2' })

    const chips = within(screen.getByRole('list', { name: 'Applied filters' }))

    expect(chips.getByRole('link', { name: 'Remove Up to 45 min' })).toHaveAttribute(
      'href',
      '/?maxCost=2'
    )
  })

  it('shows no chips when nothing is applied', () => {
    renderBar()

    expect(
      screen.queryByRole('list', { name: 'Applied filters' })
    ).not.toBeInTheDocument()
  })
})

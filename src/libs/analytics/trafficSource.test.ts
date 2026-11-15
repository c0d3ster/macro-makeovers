import { describe, expect, it } from 'vitest'

import {
  directTrafficSource,
  parseTrafficSource,
  readTrafficSource,
  serializeTrafficSource,
} from './trafficSource'

const page = (path: string): URL =>
  new URL(`https://macromakeovers.com${path}`)

describe('readTrafficSource', () => {
  it('prefers UTM tags', () => {
    expect(
      readTrafficSource(
        page('/recipes/tacos?utm_source=tiktok&utm_medium=video&utm_campaign=launch'),
        'https://www.google.com/'
      )
    ).toEqual({
      source: 'tiktok',
      medium: 'video',
      campaign: 'launch',
      referrer: 'www.google.com',
      landingPath: '/recipes/tacos',
    })
  })

  it('falls back to the referring site as a referral', () => {
    expect(
      readTrafficSource(page('/recipes'), 'https://www.reddit.com/r/fitness')
    ).toEqual({
      source: 'www.reddit.com',
      medium: 'referral',
      campaign: undefined,
      referrer: 'www.reddit.com',
      landingPath: '/recipes',
    })
  })

  it('ignores a visit with no tags and no outside referrer', () => {
    expect(readTrafficSource(page('/'), '')).toBeUndefined()
    expect(
      readTrafficSource(page('/basket'), 'https://macromakeovers.com/recipes')
    ).toBeUndefined()
    expect(readTrafficSource(page('/'), 'not a url')).toBeUndefined()
  })

  it('clips long values to the column width', () => {
    const long = 'x'.repeat(400)

    expect(
      readTrafficSource(page(`/?utm_source=${long}`), '')?.source
    ).toHaveLength(255)
  })
})

describe('traffic source cookie', () => {
  it('round-trips through the cookie value', () => {
    const source = {
      source: 'pinterest',
      medium: 'social',
      landingPath: '/recipes/chili',
    }

    expect(parseTrafficSource(serializeTrafficSource(source))).toEqual({
      ...source,
      campaign: undefined,
      referrer: undefined,
    })
  })

  it('reads a malformed or empty cookie as no source', () => {
    expect(parseTrafficSource(undefined)).toBeUndefined()
    expect(parseTrafficSource('%7Bnot json')).toBeUndefined()
    expect(parseTrafficSource(encodeURIComponent('"text"'))).toBeUndefined()
    expect(
      parseTrafficSource(encodeURIComponent(JSON.stringify({ medium: 'x' })))
    ).toBeUndefined()
  })

  it('drops values of the wrong type', () => {
    const value = encodeURIComponent(
      JSON.stringify({ source: 'reddit', medium: 42, landingPath: ['/'] })
    )

    expect(parseTrafficSource(value)).toEqual({
      source: 'reddit',
      medium: undefined,
      campaign: undefined,
      referrer: undefined,
      landingPath: '/',
    })
  })
})

describe('directTrafficSource', () => {
  it('marks the visit as direct', () => {
    expect(directTrafficSource('/login')).toEqual({
      source: 'direct',
      landingPath: '/login',
    })
  })
})

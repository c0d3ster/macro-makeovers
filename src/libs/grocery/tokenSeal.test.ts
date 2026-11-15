import { describe, expect, it } from 'vitest'

import { sealValue, unsealValue } from './tokenSeal'

const SECRET = 'a-test-secret-that-is-long-enough-123'

describe('sealValue', () => {
  it('round-trips a value under the same secret', async () => {
    const value = { accessToken: 'abc', expiresAt: 1 }
    const sealed = await sealValue(value, SECRET)

    expect(sealed).not.toContain('abc')
    await expect(unsealValue(sealed, SECRET)).resolves.toEqual(value)
  })

  it('refuses another secret, a tampered value, or junk', async () => {
    const sealed = await sealValue({ accessToken: 'abc' }, SECRET)
    const tampered = `${sealed.slice(0, -2)}${sealed.endsWith('A') ? 'B' : 'A'}A`

    await expect(unsealValue(sealed, `${SECRET}-other`)).resolves.toBeUndefined()
    await expect(unsealValue(tampered, SECRET)).resolves.toBeUndefined()
    await expect(unsealValue('not-sealed', SECRET)).resolves.toBeUndefined()
  })
})

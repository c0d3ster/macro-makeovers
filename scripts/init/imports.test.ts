import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { findUnlistedImports, packageName } from './imports'

describe('packageName', () => {
  it('reduces specifiers to the package that provides them', () => {
    expect(packageName('react')).toBe('react')
    expect(packageName('next/server')).toBe('next')
    expect(packageName('@clerk/nextjs/server')).toBe('@clerk/nextjs')
    expect(packageName('@scope/pkg')).toBe('@scope/pkg')
  })

  it('ignores relative paths, aliases and Node built-ins', () => {
    ;['./a', '../b', '/abs', '@/libs/Env', 'node:fs', 'fs', 'fs/promises', 'path'].forEach((specifier) => {
      expect(packageName(specifier)).toBeUndefined()
    })
  })
})

describe('findUnlistedImports', () => {
  let root = ''
  const write = (path: string, content: string): void => {
    const full = join(root, path)
    mkdirSync(dirname(full), { recursive: true })
    writeFileSync(full, content)
  }

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'init-imports-'))
    write('package.json', JSON.stringify({ dependencies: { a: '1', '@s/b': '1' }, devDependencies: { c: '1' } }))
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it('accepts listed packages, deep imports, aliases and built-ins', () => {
    write('src/ok.ts', "import a from 'a'\nimport b from '@s/b/deep'\nimport c from 'c'\nimport x from './x'\nimport { y } from '@/y'\nimport fs from 'node:fs'\nimport path from 'path'\n")

    expect(findUnlistedImports(root)).toEqual([])
  })

  it('reports packages that are no longer listed, with every import style', () => {
    write('config.ts', "import 'reflect-metadata'\n")
    write('src/a.ts', "import { x } from 'gone'\nconst y = require('also-gone')\nconst z = await import('@scope/dyn/deep')\n")

    expect(findUnlistedImports(root)).toEqual([
      { file: 'config.ts', pkg: 'reflect-metadata' },
      { file: 'src/a.ts', pkg: '@scope/dyn' },
      { file: 'src/a.ts', pkg: 'also-gone' },
      { file: 'src/a.ts', pkg: 'gone' },
    ])
  })

  it('does not let a package through just because another one brings it in', () => {
    write('vitest.config.mts', "import { loadEnv } from 'vite'\n")

    expect(findUnlistedImports(root)).toEqual([{ file: 'vitest.config.mts', pkg: 'vite' }])
  })

  it('scans .jsx files too', () => {
    write('src/legacy.jsx', ["import gone from 'gone'", ''].join('\n'))

    expect(findUnlistedImports(root)).toEqual([{ file: 'src/legacy.jsx', pkg: 'gone' }])
  })

  it('skips node_modules and unapplied variant overlays', () => {
    write('node_modules/pkg/index.js', "require('nope')\n")
    write('variants/supabase/files/a.ts', "import 'nope'\n")

    expect(findUnlistedImports(root)).toEqual([])
  })
})

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { ModuleDef, ModuleId } from './modules'
import type { VariantDef } from './variants'

import { applySelection } from './apply'

const empty = (id: ModuleId): ModuleDef => ({
  id,
  label: id,
  requires: [],
  paths: [],
  packages: [],
  scripts: [],
  scriptReplacements: {},
  writes: {},
})

const defs: Record<ModuleId, ModuleDef> = {
  init: empty('init'),
  auth: empty('auth'),
  file_uploads: empty('file_uploads'),
  graphql: empty('graphql'),
  realtime: empty('realtime'),
  database: {
    ...empty('database'),
    paths: ['db/client.ts'],
    packages: ['pg'],
    scripts: ['db:migrate'],
    scriptReplacements: { build: 'next build' },
  },
  email: { ...empty('email'), paths: ['mail'], packages: ['resend', 'shared-lib'] },
}

const variant: VariantDef = {
  id: 'supabase',
  label: 'test',
  flag: 'supabase',
  impliedBy: [],
  overlay: 'overlay',
  removePaths: ['legacy.txt'],
  removePackages: ['old-sdk'],
  scripts: { set: { 'db:push': 'push' }, remove: ['db:old'] },
  modules: {},
}

let root = ''

const write = (path: string, content: string): void => {
  const full = join(root, path)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, content)
}
const read = (path: string): string => readFileSync(join(root, path), 'utf8')
const select = (...ids: ModuleId[]): { enabled: ReadonlySet<ModuleId>; added: ModuleId[]; ignored: string[] } => ({
  enabled: new Set(ids),
  added: [],
  ignored: [],
})

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'init-apply-'))
  write(
    'package.json',
    JSON.stringify({
      scripts: { 'dev': 'next dev', 'build': 'node build.js', 'db:migrate': 'm', 'db:old': 'o' },
      dependencies: { 'pg': '1', 'resend': '1', 'shared-lib': '1', 'old-sdk': '1' },
      devDependencies: {},
    })
  )
  write('legacy.txt', 'other variant')
  write('db/client.ts', 'db')
  write('mail/send.ts', 'mail')
  write('src/shared.ts', 'a // @module:email\nb // @module:clerk\nc // @module:supabase\nd\n')
  write('overlay/src/shared.ts', 'overlaid // @module:supabase\nkept\n')
  write('overlay/src/extra.ts', 'extra\n')
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

const run = (selection: ReturnType<typeof select>, options: { dryRun?: boolean } = {}) =>
  applySelection({ root, selection, variant, defs, skipInstall: true, skipFormat: true, ...options })

describe('applySelection', () => {
  it('removes the other variant, copies the overlay over the project and sets the flag', () => {
    run(select('database', 'email'))

    expect(existsSync(join(root, 'legacy.txt'))).toBe(false)
    expect(read('src/shared.ts')).toBe('overlaid\nkept\n')
    expect(read('src/extra.ts')).toBe('extra\n')
  })

  it('keeps marked lines only for kept modules and the chosen variant', () => {
    write('overlay/src/shared.ts', 'a // @module:email\nb // @module:clerk\nc // @module:supabase\n')

    run(select('database'))

    expect(read('src/shared.ts')).toBe('c\n')
  })

  it('deletes files of switched-off modules and keeps the rest', () => {
    run(select('database'))

    expect(existsSync(join(root, 'mail'))).toBe(false)
    expect(existsSync(join(root, 'db/client.ts'))).toBe(true)
  })

  it('prunes packages and scripts of switched-off modules and applies variant scripts', () => {
    run(select('email'))
    const pkg = JSON.parse(read('package.json')) as {
      scripts: Record<string, string>
      dependencies: Record<string, string>
    }

    expect(Object.keys(pkg.dependencies).sort()).toEqual(['resend', 'shared-lib'])
    expect(pkg.scripts).toEqual({ 'dev': 'next dev', 'build': 'next build', 'db:push': 'push' })
  })

  it('keeps a package that a kept module still lists', () => {
    const shared: Record<ModuleId, ModuleDef> = {
      ...defs,
      database: { ...defs.database, packages: ['pg', 'shared-lib'] },
    }

    applySelection({
      root,
      selection: select('email'),
      variant,
      defs: shared,
      skipInstall: true,
      skipFormat: true,
    })
    const pkg = JSON.parse(read('package.json')) as { dependencies: Record<string, string> }

    expect(pkg.dependencies['shared-lib']).toBe('1')
  })

  describe('init tooling', () => {
    const withTooling: Record<ModuleId, ModuleDef> = {
      ...defs,
      init: { ...defs.init, paths: ['tooling'] },
    }

    it('is removed by default', () => {
      write('tooling/readme.txt', 'x')

      applySelection({ root, selection: select('database', 'email'), variant, defs: withTooling, skipInstall: true, skipFormat: true })

      expect(existsSync(join(root, 'tooling'))).toBe(false)
    })

    it('stays when asked to keep it', () => {
      write('tooling/readme.txt', 'x')

      applySelection({
        root,
        selection: select('database', 'email'),
        variant,
        defs: withTooling,
        keepTooling: true,
        skipInstall: true,
        skipFormat: true,
      })

      expect(existsSync(join(root, 'tooling'))).toBe(true)
    })
  })

  it('fails loudly when the manifest names a path that is gone', () => {
    rmSync(join(root, 'mail'), { recursive: true })

    expect(() => run(select('database'))).toThrow('Manifest drift: email lists "mail"')
  })

  it('returns imports of packages that were pruned', () => {
    write('src/uses-old.ts', "import 'old-sdk'\nimport 'resend'\n")

    const unlisted = run(select('email'))

    expect(unlisted).toEqual([{ file: 'src/uses-old.ts', pkg: 'old-sdk' }])
  })

  it('changes nothing on a dry run', () => {
    run(select(), { dryRun: true })

    expect(existsSync(join(root, 'legacy.txt'))).toBe(true)
    expect(existsSync(join(root, 'mail'))).toBe(true)
    expect(read('src/shared.ts')).toContain('@module:email')
  })
})

describe('slot replacements', () => {
  const withReplace: VariantDef = { ...variant, replace: 'replace' }
  const apply = (target: VariantDef): void => {
    applySelection({
      root,
      selection: select('database'),
      variant: target,
      defs,
      skipInstall: true,
      skipFormat: true,
    })
  }

  beforeEach(() => {
    write('README.md', 'top\n<!-- #slot auth -->\nclerk text\n<!-- #endslot auth -->\nbottom\n')
    write('replace/README.md', '<!-- #slot auth -->\nsupabase text // @module:database\n<!-- #endslot auth -->\n')
  })

  it('swaps the slot content for the variant replacement and then strips its markers', () => {
    apply(withReplace)

    expect(read('README.md')).toBe('top\nsupabase text\nbottom\n')
  })

  it('keeps the default content when the variant has no replacements', () => {
    apply(variant)

    expect(read('README.md')).toBe('top\nclerk text\nbottom\n')
  })

  it('reads replacements before the variants folder is deleted', () => {
    write('variants/supabase/replace/README.md', '<!-- #slot auth -->\nfrom variants\n<!-- #endslot auth -->\n')

    apply({ ...variant, replace: 'variants/supabase/replace' })

    expect(read('README.md')).toBe('top\nfrom variants\nbottom\n')
  })

  it('fails when a replacement names a slot the file does not have', () => {
    write('replace/README.md', '<!-- #slot gone -->\nx\n<!-- #endslot gone -->\n')

    expect(() => apply(withReplace)).toThrow(/README.md has no slot named gone/)
  })
})

describe('keeping the tooling', () => {
  it('leaves the templating docs alone, though they show marker and slot syntax', () => {
    const docs = [
      'inline <!-- #slot x --> text <!-- #endslot x -->',
      '```',
      'line // @module:email',
      '```',
      '',
    ].join('\n')
    write('docs/TEMPLATING.md', docs)

    applySelection({
      root,
      selection: select('database'),
      variant,
      defs,
      keepTooling: true,
      skipInstall: true,
      skipFormat: true,
    })

    expect(read('docs/TEMPLATING.md')).toBe(docs)
  })
})

describe('dry run', () => {
  it('accepts a disabled module path that only the overlay has', () => {
    const overlayOnly: Record<ModuleId, ModuleDef> = {
      ...defs,
      email: { ...defs.email, paths: [...defs.email.paths, 'src/extra.ts'] },
    }

    expect(() =>
      applySelection({
        root,
        selection: select('database'),
        variant,
        defs: overlayOnly,
        dryRun: true,
        skipInstall: true,
        skipFormat: true,
      })
    ).not.toThrow()
    expect(existsSync(join(root, 'src/extra.ts'))).toBe(false)
  })

  it('still reports a path that exists nowhere', () => {
    const drifted: Record<ModuleId, ModuleDef> = {
      ...defs,
      email: { ...defs.email, paths: ['nowhere.ts'] },
    }

    expect(() =>
      applySelection({
        root,
        selection: select('database'),
        variant,
        defs: drifted,
        dryRun: true,
        skipInstall: true,
        skipFormat: true,
      })
    ).toThrow(/Manifest drift/)
  })
})

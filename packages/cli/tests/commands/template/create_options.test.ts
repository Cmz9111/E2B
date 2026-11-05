import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const build = vi.fn()
  const Template = Object.assign(
    vi.fn(() => ({ fromDockerfile: vi.fn(() => ({})) })),
    { build }
  )

  return {
    build,
    Template,
    ensureAPIKey: vi.fn(() => 'test-api-key'),
  }
})

vi.mock('e2b', () => ({
  Template: mocks.Template,
  defaultBuildLogger: vi.fn(),
}))

vi.mock('../../../src/api', () => ({
  ensureAPIKey: mocks.ensureAPIKey,
  connectionConfig: { domain: 'e2b.test' },
}))

describe('template create options', () => {
  let root: string

  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never)
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    root = await fs.mkdtemp(path.join(os.tmpdir(), 'e2b-create-options-'))
    await fs.writeFile(path.join(root, 'e2b.Dockerfile'), 'FROM ubuntu\n')
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await fs.rm(root, { recursive: true, force: true })
  })

  async function buildOptions(flags: string[]) {
    const { createCommand } =
      await import('../../../src/commands/template/create')
    await createCommand.parseAsync(['my-template', '--path', root, ...flags], {
      from: 'user',
    })

    expect(mocks.build).toHaveBeenCalledTimes(1)
    return mocks.build.mock.calls[0][1]
  }

  test('uses the build cache by default', async () => {
    expect(await buildOptions([])).toMatchObject({ skipCache: false })
  })

  test('--no-cache skips the build cache', async () => {
    expect(await buildOptions(['--no-cache'])).toMatchObject({
      skipCache: true,
    })
  })
})

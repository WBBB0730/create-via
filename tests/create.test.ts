import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { x } from 'tinyexec'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { create, repoName } from '../src/create'

const IDENTITY = '[user]\n  name = Test\n  email = test@example.com\n[init]\n  defaultBranch = main\n'
const LFS = '[filter "lfs"]\n  process = git-lfs filter-process\n'

/** 每个用例用独立的 git 全局配置与 giget 缓存目录，不受本机设置影响。 */
function sandbox(gitConfig: string): string {
  const root = mkdtempSync(join(tmpdir(), 'create-via-'))

  writeFileSync(join(root, 'gitconfig'), gitConfig)
  vi.stubEnv('GIT_CONFIG_GLOBAL', join(root, 'gitconfig'))
  vi.stubEnv('GIT_CONFIG_NOSYSTEM', '1')
  vi.stubEnv('XDG_CACHE_HOME', join(root, 'cache'))

  return root
}

async function git(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await x('git', args, { nodeOptions: { cwd }, throwOnError: true })

  return stdout.trim()
}

/** 建一个有两次提交的模板仓库，用来确认新项目不带模板的历史。 */
async function createTemplate(root: string): Promise<string> {
  const template = join(root, 'template')

  mkdirSync(join(template, 'src'), { recursive: true })
  await git(template, ['init'])
  writeFileSync(join(template, 'README.md'), '# 模板\n')
  await git(template, ['add', '-A'])
  await git(template, ['commit', '-m', 'first'])
  writeFileSync(join(template, 'src', 'main.txt'), 'hello\n')
  await git(template, ['add', '-A'])
  await git(template, ['commit', '-m', 'second'])

  return template
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('repoName', () => {
  it('owner/repo 取 repo', () => {
    expect(repoName('blockdancez/GodotStarter')).toBe('GodotStarter')
  })

  it('去掉末尾的 #分支', () => {
    expect(repoName('blockdancez/GodotStarter#dev')).toBe('GodotStarter')
  })

  it('HTTPS 与 SSH 地址去掉 .git', () => {
    expect(repoName('https://github.com/blockdancez/npm-starter.git')).toBe('npm-starter')
    expect(repoName('git@github.com:blockdancez/npm-starter.git')).toBe('npm-starter')
  })

  it('末尾多余的斜杠不影响结果', () => {
    expect(repoName('https://github.com/blockdancez/GodotStarter/')).toBe('GodotStarter')
  })
})

describe('create', () => {
  it('拉取模板的最新文件，只留一个初始提交', async () => {
    const root = sandbox(IDENTITY + LFS)
    const template = await createTemplate(root)
    const project = join(root, 'my-project')

    await create({ repo: template, dir: project })

    expect(readFileSync(join(project, 'README.md'), 'utf8')).toBe('# 模板\n')
    expect(readFileSync(join(project, 'src', 'main.txt'), 'utf8')).toBe('hello\n')
    expect(await git(project, ['log', '--format=%s'])).toBe('Initial commit')
    expect(await git(project, ['status', '--porcelain'])).toBe('')
  })

  it('目录已存在且不为空时报错', async () => {
    const root = sandbox(IDENTITY + LFS)
    const template = await createTemplate(root)
    const project = join(root, 'my-project')

    mkdirSync(project)
    writeFileSync(join(project, 'file.txt'), '')

    await expect(create({ repo: template, dir: project })).rejects.toThrow('已存在')
  })

  it('没配好 Git LFS 时不拉取，直接报错', async () => {
    const root = sandbox(IDENTITY)
    const template = await createTemplate(root)

    await expect(create({ repo: template, dir: join(root, 'my-project') })).rejects.toThrow('Git LFS')
  })
})

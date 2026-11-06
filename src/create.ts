import { existsSync, readdirSync } from 'node:fs'
import { styleText } from 'node:util'

import * as p from '@clack/prompts'
import { downloadTemplate } from 'giget'
import { NonZeroExitError, x } from 'tinyexec'

export interface CreateOptions {
  /** 模板仓库，写法同 git clone：owner/repo（默认 GitHub）、完整地址，末尾可加 #分支 */
  repo?: string
  /** 新项目目录 */
  dir?: string
}

export async function create(options: CreateOptions): Promise<void> {
  p.intro('create-via')

  const repo =
    options.repo ??
    stopOnCancel(
      await p.text({
        message: '模板仓库',
        placeholder: 'owner/repo',
        validate: (value) => (value ? undefined : '请输入模板仓库'),
      }),
    )

  const dir =
    options.dir ??
    stopOnCancel(
      await p.text({
        message: '项目名',
        // 提示用模板仓库名：web、游戏等项目命名规范各不相同，仓库名本身就是该模板规范的示范。
        placeholder: repoName(repo),
        validate: (value) => (value ? (isAvailable(value) ? undefined : `目录 ${value} 已存在`) : '请输入项目名'),
      }),
    )

  if (!isAvailable(dir)) {
    throw new Error(`目录 ${dir} 已存在`)
  }

  await ensureGitLfs()

  // giget 的 git 模式会在终端里自己显示克隆进度，这里不再叠加 spinner。
  p.log.step(`正在拉取 ${repo}`)

  try {
    // 走本机 git 克隆而不是下载压缩包：压缩包里的 LFS 文件只是指针。
    await downloadTemplate(`git:${repo}`, { dir })
  } catch (error) {
    throw new Error(`拉取 ${repo} 失败：${error instanceof Error ? error.message : String(error)}`)
  }

  await git(dir, ['init'])
  await git(dir, ['add', '-A'])
  await git(dir, ['commit', '-m', 'Initial commit'])

  p.outro(`完成！接下来运行：\n  ${styleText('green', `cd ${dir}`)}`)
}

/** 取仓库名：去掉末尾的 #分支 与 .git，取最后一段（owner/repo、HTTPS、SSH 写法通用）。 */
export function repoName(repo: string): string {
  return repo.replace(/#.*$/, '').replace(/\/+$/, '').replace(/\.git$/, '').split(/[/:]/).pop() || repo
}

/** 用户在任意一步按 Ctrl+C 时统一收尾，不留半截状态。 */
function stopOnCancel<T>(value: T | typeof p.CANCEL_SYMBOL): T {
  if (p.isCancel(value)) {
    p.cancel('已取消')
    process.exit(0)
  }

  return value
}

/** 与 giget 的规则一致：目录不存在或为空才可用。 */
function isAvailable(dir: string): boolean {
  return !existsSync(dir) || readdirSync(dir).length === 0
}

/** 没配好 Git LFS 时 git clone 不会报错，只会拿到 LFS 指针文件，所以拉取前先查。 */
async function ensureGitLfs(): Promise<void> {
  const { stdout } = await x('git', ['config', '--get', 'filter.lfs.process'])

  if (!stdout.trim()) {
    throw new Error('需要先安装 Git LFS 并运行一次 git lfs install：https://git-lfs.com')
  }
}

/** 在新项目目录里执行 git，失败时带出 git 自己的报错（比如没配置提交者）。 */
async function git(cwd: string, args: string[]): Promise<void> {
  try {
    await x('git', args, { nodeOptions: { cwd }, throwOnError: true })
  } catch (error) {
    if (error instanceof NonZeroExitError) {
      throw new Error(error.output?.stderr.trim() || error.message)
    }

    throw error
  }
}

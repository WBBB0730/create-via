#!/usr/bin/env node
import * as p from '@clack/prompts'
import { cac } from 'cac'

import { version } from '../package.json' with { type: 'json' }
import { create } from './create'

const cli = cac('create-via')

cli.command('[仓库] [目录]', '从模板仓库创建新项目，并做一个初始提交').action(async (repo?: string, dir?: string) => {
  try {
    await create({ repo, dir })
  } catch (error) {
    p.cancel(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
})

/** 把 cac 内置的英文帮助文案替换为中文，语义与排版结构不变。 */
function localizeHelp(sections: { title?: string; body: string }[]): void {
  const titles: Record<string, string> = {
    Usage: '用法',
    Commands: '命令',
    Options: '选项',
  }

  for (const section of sections) {
    if (section.title) {
      section.title =
        titles[section.title] ??
        section.title.replace('For more info, run any command with the `--help` flag', '更多信息，请在任意命令后加 `--help` 运行')
    }

    section.body = section.body
      .replace('Display this message', '显示帮助信息')
      .replace('Display version number', '显示版本号')
  }
}

/** 常见的解析错误译成中文，认不出的原样输出。 */
function localizeParseError(message: string): string {
  const unknown = message.match(/^Unknown option `(.+)`$/)

  if (unknown) {
    return `未知选项 ${unknown[1]}，使用 --help 查看可用选项`
  }

  return message
}

cli.help(localizeHelp)
cli.version(version)

try {
  cli.parse()
} catch (error) {
  // cac 把解析错误（未知选项）作为异常抛出，这里拦下换成一句人话。
  console.error(localizeParseError(error instanceof Error ? error.message : String(error)))
  process.exit(1)
}

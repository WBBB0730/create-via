# create-project

**从模板仓库创建新项目**

## Problem Statement

用 **GitHub 模板功能**建仓库时，模板里由 Git LFS 管理的文件带不过来。游戏这类模板的图片、音频、模型都在 LFS 里，原来只能在模板里放一个「模板开关」，建完仓库再照 README 手动打开 LFS，步骤多，也容易漏。

## Solution

一个通用的命令行工具 create-via（ADR-0001）：

```bash
npx create-via@latest <模板仓库> [项目名]
```

它用本机 git **拉取**模板仓库的最新文件，LFS 文件是真实内容（ADR-0002）。然后在**新项目**里 `git init`，做一次**初始提交**。新项目不带模板仓库的历史，工具也不建远程仓库。

## User Stories

- **从模板开始一个新项目**：在要放项目的目录运行 `npx create-via@latest owner/repo`，按提示填项目名（浅色提示是模板仓库名，ADR-0003），得到同名目录。目录里只有一个初始提交，LFS 文件是真实内容。
- **全部交互填写**：只运行 `npx create-via@latest`，依次填写模板仓库和项目名。
- **一条命令完成**：运行 `npx create-via@latest owner/repo my-game`，不会询问任何问题。
- **用私有模板仓库**：仓库写成 `owner/repo` 或 SSH 地址，拉取时用本机 git 已保存的凭据。
- **用模板仓库的某个分支**：在仓库末尾加 `#分支`。
- **项目名已被占用**：交互填写时会当场提示「目录 X 已存在」，让人重填；如果是命令行参数给的项目名，就直接报错退出。
- **没装好 Git LFS**：拉取前就报错，提示安装 Git LFS 并运行一次 `git lfs install`，不会留下只有指针文件的项目。
- **中途反悔**：在任何一个询问里按 Ctrl+C，会提示「已取消」并退出，什么都不会留下。

## Implementation Decisions

### 用法的写法

文档里统一写 `npx create-via@latest`，不写效果相同的 `npm create via@latest`，因为后者容易让人以为建出来的是 Node.js 项目。

### 流程

1. 询问模板仓库（命令行已给出就跳过），必填，浅色提示为 `owner/repo`。
2. 询问项目名（命令行已给出就跳过），必填，浅色提示为模板仓库名。目录不存在或为空才算可用，跟 giget 的规则一致。
3. 检查 Git LFS 是否配好（ADR-0002）。
4. 用 giget 的 `git:` 模式拉取。
5. 在项目目录里依次运行 `git init`、`git add -A`、`git commit -m "Initial commit"`。

### 模板仓库名

浅色提示里的仓库名这样得到：去掉末尾的 `#分支`、多余的斜杠和 `.git`，再取最后一段。`owner/repo`、HTTPS、SSH 三种写法都适用。

### 初始提交

- 提交信息固定为 `Initial commit`，跟 GitHub 模板功能建出的仓库一致，不替使用者决定提交规范和语言。
- 提交者用本机 git 的配置。没配置时，原样带出 git 自己的报错。
- 模板的 `.gitattributes` 会一起带过来，所以新项目里这些文件仍然由 LFS 管理。

### 依赖与打包

- cac 负责解析参数。帮助文案、版本号说明和「未知选项」报错都翻译成中文，版本号从 `package.json` 读取。
- @clack/prompts 负责所有交互与输出（见 `DESIGN.md`）。
- giget 负责拉取，tinyexec 负责运行 git。
- tsdown 打包成单个 `dist/cli.mjs`，作为 `create-via` 命令发布。要求 Node.js 22 及以上。

### 发布

推送 `v*` 标签会触发 `publish.yml`：依次安装依赖、构建、运行测试，全部通过后发布到 npm。标签名含 `-beta` 时发布到 npm 的 `beta` 标签。发布用 npm Trusted Publisher，不保存 npm 令牌。

## Testing Decisions

- 测试运行真实的 git，不做 mock。每个用例用临时目录里的 `GIT_CONFIG_GLOBAL`（配好提交者和默认分支，按需配上 LFS）、`GIT_CONFIG_NOSYSTEM=1` 和 `XDG_CACHE_HOME`（giget 的缓存目录），不受本机配置影响。
- 模板仓库是在用例里现建的本地仓库，有两次提交，用来确认三件事：新项目只有一个初始提交、文件是最新版本、工作区是干净的。
- `create` 覆盖三种情况：正常创建、目录已存在且不为空、没配 Git LFS。`repoName` 覆盖四种情况：`owner/repo`、`#分支`、HTTPS 和 SSH 地址末尾的 `.git`、末尾多余的斜杠。
- 自动测试不覆盖交互界面，也不覆盖真实的 LFS 文件，这两项靠手动实测。
- `publish.yml` 在发布前会运行 `pnpm test`，所以测试不能删。

## Out of Scope

- 建远程仓库、调用 gh（ADR-0001）
- 项目名的默认值，以及按命名风格推断项目名（ADR-0003）

## Further Notes

- Trusted Publisher 要在 npmjs.com 的包设置里配置，所以第一次发布只能在本机登录 npm 后手动完成。之后打 `v*` 标签就会自动发布。
- 如果初始提交失败（比如没配置提交者），已经拉取的文件和 `git init` 建出的 `.git` 会留在项目目录里，不会自动清理。
- 克隆连同 LFS 下载超过 60 秒会被 giget 中断（ADR-0002）。

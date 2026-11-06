# create-via

[![npm version](https://img.shields.io/npm/v/create-via)](https://www.npmjs.com/package/create-via)

> 从模板仓库创建新项目，支持 Git LFS。

create-via 用本机 git 拉取模板仓库的最新文件，在新目录里初始化 git 仓库，并提交一次 `Initial commit`。模板里由 Git LFS 管理的文件会拉取为真实内容，新项目不带模板仓库的提交历史。

## 前提

- [Node.js](https://nodejs.org) 22 及以上
- [Git](https://git-scm.com/downloads) 与 [Git LFS](https://git-lfs.com)，并运行过一次 `git lfs install`

## 快速开始

```bash
npx create-via@latest owner/repo
```

按提示填写项目名即可。

## 用法

```bash
npx create-via@latest [仓库] [目录]
```

- **仓库**：模板仓库，写法同 `git clone`，支持 `owner/repo`（默认 GitHub）、HTTPS 地址与 SSH 地址，末尾加 `#分支` 可指定分支。省略时交互询问。
- **目录**：新项目目录，必须不存在或为空。省略时交互询问。

### 示例

```bash
# 交互填写模板仓库与项目名
npx create-via@latest

# 创建到 my-app 目录，不再询问
npx create-via@latest owner/repo my-app

# 使用 dev 分支
npx create-via@latest owner/repo#dev

# 使用 HTTPS 或 SSH 地址
npx create-via@latest https://gitlab.com/owner/repo.git
npx create-via@latest git@github.com:owner/repo.git
```

### 私有仓库

拉取时使用本机 git 已保存的登录凭据，请先确认用 `git clone` 能直接拉取该仓库。

## 为什么不用 GitHub 模板？

GitHub 的模板功能不支持 Git LFS 文件，而且只能用于 GitHub 上的仓库。create-via 改用本机 git 克隆，LFS 文件是真实内容，也不限托管平台；和 GitHub 模板一样，新项目只有一个提交。

## License

MIT

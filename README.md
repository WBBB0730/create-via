# create-via

从模板仓库创建新项目：交互式填写项目名，拉取模板的最新文件（支持 Git LFS），并在新目录里做一个初始提交。

## 快速开始

在要放新项目的目录运行：

```bash
npx create-via@latest owner/repo
```

按提示填写项目名，完成后得到同名目录，里面是只有一个提交「Initial commit」的新仓库。

## 用法

```bash
npx create-via@latest [仓库] [目录]
```

- `仓库`：模板仓库，写法同 `git clone`：`owner/repo`（默认 GitHub）或完整的 HTTPS、SSH 地址，末尾加 `#分支` 可指定分支；不填时交互询问
- `目录`：新项目目录；不填时交互询问，已存在且不为空时报错

## 前提

- [Node.js](https://nodejs.org) 22 及以上
- [Git](https://git-scm.com/downloads) 与 [Git LFS](https://git-lfs.com)，并运行过一次 `git lfs install`
- 私有仓库使用本机 Git 已保存的登录凭据

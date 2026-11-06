---
status: accepted
---

# 0002 用本机 git 克隆拉取，拉取前先检查 Git LFS

## 背景

giget 默认从 GitHub 等平台下载仓库压缩包，而平台生成的压缩包里，LFS 文件只是指针（几行记录哈希和大小的文本）。GitHub 的仓库设置里虽然有「Include Git LFS objects in archives」，但它默认关闭，也只有 GitHub 才有，没法指望每个模板仓库都打开。

## 决定

拉取统一走 giget 的 `git:` 模式：用本机 git 浅克隆（`--depth 1`）到临时目录，去掉 `.git` 后放进**新项目**。

拉取前先读 `git config filter.lfs.process`。没有值就报错退出，提示先安装 Git LFS 并运行一次 `git lfs install`。

## 理由

- 克隆时由本机的 Git LFS 下载真实文件，这是拿到 LFS 内容最直接的途径，不需要分别对接各平台的 LFS 接口。
- 没配好 Git LFS 时，git clone 不会报错，只会拿到指针文件，事后很难察觉，所以要在拉取前拦下。
- 私有仓库直接用本机 git 已保存的凭据，工具不需要处理令牌。

## 后果

- 使用者必须装好 git 和 Git LFS。模板里没有 LFS 文件时也要求装好，因为拉取前无从得知。
- 比下载压缩包慢。克隆进度由 giget 的 git 模式自己打印，工具不再叠加 spinner。
- 仓库的写法跟 git clone 一致：`owner/repo`（默认 GitHub）、HTTPS 地址、SSH 地址，末尾可加 `#分支`。
- giget 运行 git 时关掉了交互式输入凭据（`GIT_TERMINAL_PROMPT=0`），私有仓库必须事先在本机 git 里存好登录凭据。
- giget 3.3.1 给每条 git 命令都设了 60 秒超时，而且不能配置。克隆连同 LFS 下载超过 60 秒就会被中断。

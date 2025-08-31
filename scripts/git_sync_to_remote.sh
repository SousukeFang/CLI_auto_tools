#!/usr/bin/env bash
# 用途：汇总本地改动，创建 commit 并推送到远程上游分支；打印原始 git 输出与执行结果。
# 兼容性：Windows 11 的 git bash 与 Linux（CentOS 7）。

set -euo pipefail

trap 'echo "[error] 执行失败：请检查 git 配置(用户名/邮箱)、网络连通、远程权限或冲突情况。" >&2' ERR

COMMIT_MSG=${1:-}
if [ -z "$COMMIT_MSG" ]; then
  ts=$(date +"%Y-%m-%d %H:%M:%S")
  COMMIT_MSG="chore(git): 本地变更同步到远程 @ ${ts}"
fi

echo "[info] 准备汇总本地改动并上传远程..." >&2

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[error] 当前目录不是 Git 仓库。" >&2
  exit 1
fi

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "DETACHED")
upstream=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "")

echo "==> git status -sb"
git status -sb || true

# 预检查：如存在 node_modules 且未被忽略，避免误提交体积过大目录
if [ -d node_modules ] && ! git check-ignore -q node_modules; then
  echo "[warn] 检测到 node_modules 未在 .gitignore 中，将在本次提交中排除它。建议将 node_modules 加入 .gitignore。" >&2
fi

echo "==> git add -A"
git add -A

# 强制排除常见的大体积目录（若未被 .gitignore 忽略）
if [ -d node_modules ] && ! git check-ignore -q node_modules; then
  git reset -q -- node_modules || true
fi
if [ -d .venv ] && ! git check-ignore -q .venv; then
  git reset -q -- .venv || true
fi

# 若没有任何暂存改动，直接退出
if git diff --cached --quiet --; then
  echo "[info] 无可提交的变更，已退出。"
  exit 0
fi

echo "==> git commit -m \"$COMMIT_MSG\""
git commit -m "$COMMIT_MSG"

# 推送逻辑：已配置上游则直接 push；否则推送到 origin 并设置上游
if [ -n "$upstream" ]; then
  echo "==> git push"
  git push
else
  remote=origin
  echo "[info] 当前分支未配置上游，将推送到 $remote/$branch 并设置上游。" >&2
  echo "==> git push -u $remote $branch"
  git push -u "$remote" "$branch"
fi

new_commit=$(git rev-parse HEAD)
new_upstream=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "未配置")

echo "---- Result ----"
echo "分支：$branch"
echo "上游：$new_upstream"
echo "提交：$new_commit"
echo "结论：变更已提交并推送到远程。"


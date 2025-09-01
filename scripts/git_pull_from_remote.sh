#!/usr/bin/env bash
# 用途：从远端拉取更新到当前分支。
# 逻辑：
# - 无参数：检查与上游的 ahead/behind；
#   - behind>0 且 ahead=0：执行 fast-forward 拉取；
#   - ahead>0（含分歧）：不执行拉取，提示用户确认是否保留本地提交；
#   - 均为 0：已是最新，直接退出。
# - force 参数：无条件覆盖本地到上游（fetch 后 reset --hard @{u}）。
# - 其他参数：报错，仅支持 force。
# 兼容性：Windows 11 的 git bash 与 Linux（CentOS 7）。

set -euo pipefail

usage() {
  echo "用法: npm run git:pull-from-remote [force]" >&2
}

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[error] 当前目录不是 Git 仓库。" >&2
  exit 1
fi

ARG_COUNT=$#
FORCE=0
if [ $ARG_COUNT -gt 1 ]; then
  echo "[error] 参数数量错误。" >&2
  usage
  exit 2
elif [ $ARG_COUNT -eq 1 ]; then
  if [ "$1" = "force" ]; then
    FORCE=1
  else
    echo "[error] 不支持的参数：$1。当前仅支持 'force'。" >&2
    usage
    exit 2
  fi
fi

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "DETACHED")
if [ "$branch" = "HEAD" ] || [ "$branch" = "DETACHED" ]; then
  echo "[error] 当前处于分离 HEAD 状态，无法确定上游分支。请切换到具体分支后再试。" >&2
  exit 1
fi

upstream=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || true)
if [ -z "${upstream:-}" ]; then
  echo "[error] 当前分支未配置上游，无法与远端比对/拉取。" >&2
  echo "提示：执行 'git branch --set-upstream-to origin/$branch' 后重试。" >&2
  exit 1
fi

echo "[info] 当前分支：$branch，上游：$upstream" >&2

echo "==> git fetch --prune --tags --no-recurse-submodules"
if ! git fetch --prune --tags --no-recurse-submodules; then
  echo "[warn] git fetch 失败，将基于本地缓存的远程引用继续。" >&2
fi

if [ $FORCE -eq 1 ]; then
  echo "[warn] 将强制覆盖本地到上游状态（可能丢弃本地未提交/已提交但未推送的变更）。" >&2
  echo "==> git reset --hard @{u}"
  git reset --hard @{u}
  echo "结论：已强制将本地 $branch 重置为 $upstream。"
  exit 0
fi

# 非 force 模式：先计算 ahead/behind
counts=$(git rev-list --left-right --count @{u}...@ 2>/dev/null || echo "0\t0")
behind=$(echo "$counts" | awk '{print $1}')
ahead=$(echo "$counts" | awk '{print $2}')

# 检测工作区是否干净
tree_state="dirty"
if git diff --quiet --ignore-submodules HEAD --; then
  tree_state="clean"
fi

echo "[info] 比对结果：ahead=${ahead} behind=${behind} worktree=${tree_state}" >&2

if [ "$ahead" = "0" ] && [ "$behind" = "0" ]; then
  echo "结论：本地与远端一致，无需拉取。"
  exit 0
fi

if [ "$ahead" != "0" ]; then
  echo "结论：检测到本地分支领先远端（ahead=${ahead}）。为避免误覆盖，未执行 pull。" >&2
  echo "提示：如确认无需保留本地领先提交，可重新执行：npm run git:pull-from-remote force" >&2
  exit 3
fi

if [ "$behind" != "0" ]; then
  if [ "$tree_state" != "clean" ]; then
    echo "[error] 工作区存在未提交改动且本地落后远端（behind=${behind}）。为避免冲突，已中止。" >&2
    echo "提示：请先提交或暂存本地改动（git commit / git stash），再重试。" >&2
    exit 4
  fi
  echo "==> git pull --ff-only"
  if git pull --ff-only; then
    echo "结论：已从远端 fast-forward 拉取更新。"
    exit 0
  else
    echo "[error] git pull 失败。请检查网络、权限或冲突信息后重试。" >&2
    exit 5
  fi
fi

echo "[info] 无匹配分支逻辑，已退出。"
exit 0


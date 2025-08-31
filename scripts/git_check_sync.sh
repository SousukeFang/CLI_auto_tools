#!/usr/bin/env bash
# 用途：检查当前本地分支与对应远程分支是否一致，并打印原始 git 输出与汇总结论。
# 兼容性：Windows 11 的 git bash 与 Linux（CentOS 7）。

set -euo pipefail

echo "[info] 准备执行本地/远端分支一致性检查..." >&2

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[error] 当前目录不是 Git 仓库。" >&2
  exit 1
fi

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "DETACHED")
upstream=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "")

echo "==> git fetch --prune --tags --no-recurse-submodules" 
if ! git fetch --prune --tags --no-recurse-submodules; then
  echo "[warn] git fetch 失败，将基于本地缓存的远程引用进行比对。" >&2
fi

echo "==> git status -sb"
git status -sb || true

local_ref=$(git rev-parse @ 2>/dev/null || echo "NONE")
remote_ref="NONE"
base_ref="NONE"
ahead="0"
behind="0"
if [ -n "$upstream" ]; then
  remote_ref=$(git rev-parse @{u} 2>/dev/null || echo "NONE")
  base_ref=$(git merge-base @ @{u} 2>/dev/null || echo "NONE")
  counts=$(git rev-list --left-right --count @{u}...@ 2>/dev/null || echo "0\t0")
  behind=$(echo "$counts" | awk '{print $1}')
  ahead=$(echo "$counts" | awk '{print $2}')
fi

tree_state="dirty"
if git diff --quiet --ignore-submodules HEAD --; then
  tree_state="clean"
fi

printf "BRANCH=%s\nUPSTREAM=%s\nLOCAL=%s\nREMOTE=%s\nBASE=%s\nAHEAD=%s BEHIND=%s\nTREE=%s\n" \
  "$branch" "${upstream:-NO_UPSTREAM}" "$local_ref" "$remote_ref" "$base_ref" "$ahead" "$behind" "$tree_state"

echo "---- Summary ----"
if [ -z "$upstream" ]; then
  echo "结论：未配置上游分支，无法判断与远端是否一致。请使用 'git branch --set-upstream-to origin/<branch>' 进行配置。"
  exit 0
fi

if [ "$ahead" = "0" ] && [ "$behind" = "0" ] && [ "$tree_state" = "clean" ]; then
  echo "结论：本地与远端一致（工作区干净）。"
else
  msg="结论：存在差异。"
  [ "$ahead" != "0" ] && msg="$msg 本地 ahead=$ahead."
  [ "$behind" != "0" ] && msg="$msg 本地 behind=$behind."
  [ "$tree_state" != "clean" ] && msg="$msg 工作区有未提交改动."
  echo "$msg"
fi


提示词：为项目新增 npm 指令与脚本的标准流程

- 变量定义
  - {工作根路径}: 项目工作根目录的绝对路径。适用于“开发环境（Windows 11 + git bash）”与“生产环境（Linux/CentOS 7）”。在 git bash 与 Linux 中均使用 POSIX 风格路径（/e/AI/git_repo/codex 或 /home/...）。

- 环境约定
  - 开发环境: Windows 11 + git bash。所有命令与路径使用 bash 语法与 POSIX 路径。
  - 生产环境: Linux（CentOS 7 x86_64，主机 172.16.5.153）。生产脚本以 Linux 为第一目标，使用 #!/usr/bin/env bash，兼容 CentOS 7 的 Bash/GNU 工具。

- 新增 npm 指令的标准步骤
  1) 在 {工作根路径}/package.json 的 scripts 中新增命令；在 scriptsMeta 为同名命令补充元数据：
     - scripts 示例: "build:assets": "bash ./scripts/build_assets.sh"
     - scriptsMeta 示例:
       - "build:assets": { "description": "构建静态资源（开发/CI 可用）", "env": "both", "prodSafe": true, "tags": ["build","assets"] }
     - 元数据字段：description（中文描述）、env（dev|prod|both）、prodSafe（boolean）、tags（字符串数组）。
  2) 新增 Bash 脚本放在 {工作根路径}/scripts/ 下，遵循：
     - 头部与健壮性: #!/usr/bin/env bash 与 set -euo pipefail
     - 输入校验: 对参数/环境变量做严格校验，避免注入
     - 兼容性: 仅用 CentOS 7 可用的 Bash/GNU 选项；避免 Windows 专属行为
  3) 文档与帮助
     - 在 README 中区分开发/生产命令：
       - 开发（git bash）: 如 dev、server:* 等
       - 生产（CentOS 7）: formal:* 与远端控制说明
     - 用 npm run help 验证脚本是否正确显示描述、环境与命令
  4) 本地验证（git bash）
     - 列表: npm run help
     - 运行开发脚本（示例）: npm run build:assets
     - 不要在本地直接执行生产脚本；生产相关命令仅用于远端或 formal:* 封装
  5) 提交与推送（Conventional Commits）
     - 示例提交：
       - feat(scripts): 新增 build:assets 指令与脚本
       - docs(readme): 补充 build:assets 使用说明
     - Git 命令（git bash）：
       - cd {工作根路径}
       - git add .
       - git commit -m "feat(scripts): 新增 build:assets 指令与脚本" -m "docs(readme): 补充使用说明"
       - git push origin HEAD:main

- 路径映射（git bash ↔ Windows PowerShell）
  - 目的: 某些本地 CLI 工具在 Windows 下仅识别 Windows 路径（E:\...），而开发命令在 git bash 中使用 POSIX 路径（/e/...）。需要在本地场景做路径转换（仅限开发环境）。
  - 通用规则（git bash → Windows 路径）:
    - /c/Users/xxx → C:\Users\xxx
    - /e/AI/git_repo/codex → E:\AI\git_repo\codex
    - 规则描述：将以 /<盘符字母>/ 开头的路径转换为 <盘符大写>:\，再把其余 / 替换为 \\。
  - 工具辅助（仅限 git bash，本地使用，勿用于生产）:
    - cygpath: cygpath -w /e/AI/git_repo/codex → E:\AI\git_repo\codex
    - 反向转换（Windows → POSIX）: cygpath -u 'E:\AI\git_repo\codex' → /e/AI/git_repo/codex
  - Node 脚本内转换（在 Windows 下运行时）:
    - 识别 /^\/([a-zA-Z])\/(.*)$/，替换为 `$1:/$2`，再将所有 / 替换为 \\。
  - 提示: 生产环境（Linux/CentOS 7）与 git bash 下均使用 POSIX 路径；仅当本地工具必须使用 Windows 路径时，按上述规则转换。

- 额外注意
  - 安全第一：禁止 eval/反引号注入式拼接；输入做白名单/格式校验。
  - 环境变量：小写默认值 + 大写覆盖，示例：: "${PORT:=5173}"
  - 透传参数：使用 -- 分隔 npm 与脚本参数，避免冲突。
  - 守护/后台：如需 PID/日志文件，请放在项目根目录相对路径，并提供 stop/status 操作。

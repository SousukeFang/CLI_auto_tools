# CLI Auto Tools

面向 Windows 11 + git bash 的本地开发者辅助 CLI，内置可发现的自动化脚本与明确的执行后指引（AI_actions）。通过统一的“自动化工作流（CLI）”，把自然语言意图映射为可执行任务。

**自动化工作流（必须遵循）**
- 默认入口：每次接收到用户输入时，先运行 `npm run help` 获取已支持的自动化流程与指令元数据；尝试匹配最贴合当前需求的脚本。
- 匹配成功：执行对应 npm 指令，并严格按该指令的 `AI_actions` 完成后续校验与动作。
- 无匹配：不强行套用自动化，直接执行原始提示词的手动流程。

**核心能力**
- 可发现性：`npm run help` 展示所有脚本的描述、环境、标签与 AI_actions。
- 一致性：所有脚本通过 `scriptsMeta` 提供元数据与后续指引。
- 提示词产物：支持从 JIRA 工单 XML 生成总结提示词文件，便于串联后续自动化。

**适用环境**
- 开发：Windows 11 + git bash
- 生产：Linux（CentOS 7 x86_64）。生产侧仅通过远程/封装脚本触发，不直接运行本地开发脚本。

**路径与工具**
- 脚本与文档优先使用 POSIX 路径（/）。在需要与 Windows 原生工具交互时，可用 `cygpath -w <POSIX路径>` 转换为 Windows 路径。

**安全准则**
- 不提交敏感信息；使用最小权限原则。
- 避免破坏性命令；对外部输入做格式校验。

**遇到命令在沙盒异常失败（无输出/exit 1）**
- 不要反复重试；改用“直接执行/兜底路径”，例如直接 `node scripts/xxx.cjs`。


**快速开始**
- 查看所有可用脚本：`npm run help`
- 总结 JIRA 工单（示例）：`npm run sum:jira CS-123456`（需要本机存在 `E:\download\CS-123456.xml`）
- 清理过期提示词文件：`npm run clear:prompt`


**命令一览**
- `help`
  - 作用：显示所有可用的 npm 脚本及其说明（含 AI_actions）。
  - 用法：`npm run help`
  - 关键点：这是自动化工作流的第一步；阅读 AI_actions 以明确执行后的验证与下一步。
- `sum:jira`
  - 作用：根据 Jira 工单号生成“总结提示词”文件（拼接模板 + 工单 XML 内容）。
  - 用法：`npm run sum:jira {工单号}`，如 `npm run sum:jira CS-123456`
  - 输入前提：默认在本机 `E:\download\` 下查找 `{工单号}.xml`（例如 `E:\download\CS-123456.xml`）。
  - 产物：在 `prompt/temp/` 生成 `{工单号}_prompt.md`，并在终端打印“提示词文件路径”。
  - 校验：`test -s prompt/temp/{工单号}_prompt.md` 确认非空；必要时用 `cygpath -w` 转换到 Windows 路径。
  - 后续：按 `AI_actions` 审阅和继续（可将“提示词文件路径”作为输入给其它自动化指令）。
- `clear:prompt`
  - 作用：清理 `prompt/temp` 目录下超过 7 天的 `*_prompt.md` 临时文件。
  - 用法：`npm run clear:prompt`
  - 特性：始终保留 `.gitkeep` 占位文件以保证目录存在。


**自动化工作流（CLI）细则**
- 执行次序：
  - 1) 探索：执行 `npm run help`，读取脚本名、`tags`、`description`、`usage`、`AI_actions`。
  - 2) 匹配：基于输入关键词与元数据进行指令匹配；多候选时优先级：名称直匹配 > `tags` 重叠度 > `description` 相似度 > `usage` 参数可满足度 > `env/prodSafe` 适配度。
  - 3) 执行：若匹配成功，运行对应 `npm` 指令并按其 `AI_actions` 做后续；否则回退到原始提示词流程。
  - 4) 记录：在终端打印所选指令、参数与匹配理由，便于追溯。
- 风险控制：无明显最佳候选或存在潜在破坏性时，优先放弃自动化，转原始提示词流程。
- 环境差异：生产相关动作仅通过项目封装脚本触发；遵循最小权限原则。


**项目结构**
- 目录：
  - `scripts/`：Node 脚本（CommonJS）。
  - `prompt/`：提示词模板与临时产物（`temp/`）。
  - `AGENTS.md`、`GEMINI.md`：运行规范与协作指南。
  - `package.json`：脚本与 `scriptsMeta` 元数据（含 AI_actions）。


**扩展与规范**
- 新增脚本：
  - 在 `package.json` 中定义 `scripts` 与 `scriptsMeta`；`scriptsMeta` 至少包含 `description`、`env`、`prodSafe`、`tags`，建议补充 `AI_actions`。
  - `AI_actions` 为结构化动作清单，既包含执行 npm 指令前（可调用 mcp 工具）的准备步骤，也包含执行后的校验与后续动作；以【执行这个npm指令】作为唯一分界标识。编号步骤、可操作可验证，并包含失败处理与环境差异提示。
  - 参考 `AGENTS.md` 与 `GEMINI.md` 的“AI_actions 编写规范”小节。
- 脚本实现：
  - 若为 Bash（生产侧），使用 `#!/usr/bin/env bash` + `set -euo pipefail`；兼容 CentOS 7 的 GNU 工具选项。
  - 若为 Node 脚本（本项目多数），保证在 Windows 11 + git bash 下可运行，并对外部输入做格式校验。


**开发与验证**
- 在 git bash 中运行：
  - `npm run help` 查看元数据与 AI_actions。
  - `npm run sum:jira CS-123456` 生成提示词文件；若未找到 XML，会提示检查文件。
  - `npm run clear:prompt` 清理过期临时文件。
- 可选验证：
  - 构造一个 8 天前的临时文件并运行清理，观察删除计数与 `.gitkeep` 保留提示。


**常见问题（FAQ）**
- Q: `sum:jira` 未找到文件？
  - A: 默认查找 `E:\download\{工单号}.xml`。请确认文件存在且工单号拼写正确。必要时使用 `cygpath -w`/`-u` 进行路径转换。
- Q: 生产相关脚本如何运行？
  - A: 仅通过项目提供的封装/远程脚本触发，禁止在生产机直接执行本地开发脚本；严格遵循最小权限原则。
- Q: `npm run help` 无输出或异常？
  - A: 在受限环境下不要反复重试，直接用 `node scripts/print-scripts.cjs` 兜底。


**提交规范**
- 使用 Conventional Commits（如：`feat(scripts): 新增 build:assets 指令与脚本`）。
- PR 小而聚焦，附上变更说明与必要截图；确保 CI 通过。


**后续规划（建议）**
- 为 `sum:jira` 增加可配置搜索根目录（环境变量与命令行参数）。
- 丰富更多自动化脚本（构建、发布、检查、汇总），完善 `AI_actions` 的检查点与回退方案。


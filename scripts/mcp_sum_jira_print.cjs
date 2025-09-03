#!/usr/bin/env node
/*
  脚本用途：
  - 直接读取 prompt/sum_jira_to_wiki.md 的内容并打印到标准输出。
  - 打印前先输出一行固定提示语；随后以 ```markdown 代码块包裹模板内容。
  - 接收一个参数：{工单号}；将其注入首行提示语中。

  兼容性：
  - 适配 Windows 11 + git bash 与 Linux（CentOS 7）的 Node.js 运行环境。
*/

const fs = require('fs');
const path = require('path');

function main() {
  try {
    // 读取命令行参数：工单号（必填）
    const issueId = (process.argv[2] || '').trim();
    if (!issueId) {
      console.error('用法: npm run mcp:sum:jira {工单号}');
      process.exit(2);
    }

    const tplPath = path.resolve(__dirname, '..', 'prompt', 'sum_jira_to_wiki.md');
    const content = fs.readFileSync(tplPath, 'utf8');
    const notice = `以下就是工单总结的规范要求，请严格按照规范要求，对前面获取到的工单内容进行总结，输出结果也是markdown格式的。注意工单号信息也要包含在总结中，在第二部分“问题”章节中就要体现。工单号为${issueId}`;

    // 输出提示语 + markdown 代码块
    console.log(notice);
    console.log('```markdown');
    process.stdout.write(content);
    console.log('\n```');
  } catch (err) {
    console.error('读取模板失败：', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();


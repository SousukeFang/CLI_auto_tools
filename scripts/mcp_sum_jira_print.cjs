#!/usr/bin/env node
/*
  脚本用途：
  - 直接读取 prompt/sum_jira_to_wiki.md 的内容并打印到标准输出。
  - 打印前先输出一行固定提示语；随后以 ```markdown 代码块包裹模板内容。
  - 不接收任何参数；不做变量替换。

  兼容性：
  - 适配 Windows 11 + git bash 与 Linux（CentOS 7）的 Node.js 运行环境。
*/

const fs = require('fs');
const path = require('path');

function main() {
  try {
    const tplPath = path.resolve(__dirname, '..', 'prompt', 'sum_jira_to_wiki.md');
    const content = fs.readFileSync(tplPath, 'utf8');
    const notice = '以下就是工单总结的规范要求，请严格按照规范要求，对前面获取到的工单内容进行总结，输出结果也是markdown格式的。注意工单号信息也要包含在总结中。';

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


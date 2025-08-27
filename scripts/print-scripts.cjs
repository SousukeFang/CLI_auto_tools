#!/usr/bin/env node
/*
  脚本说明：
  - 读取 package.json 中的 scripts 与 scriptsMeta，打印脚本名称、描述、环境与命令。
  - 设计目标：Windows 11 + git bash 与 Linux（CentOS 7）均可运行。
  - 依赖：Node.js (CommonJS)。
*/

const fs = require('fs');
const path = require('path');

function loadPkg() {
  const pkgPath = path.resolve(__dirname, '..', 'package.json');
  const raw = fs.readFileSync(pkgPath, 'utf8');
  return JSON.parse(raw);
}

function formatEntries(pkg) {
  const scripts = pkg.scripts || {};
  const meta = pkg.scriptsMeta || {};
  const names = Object.keys(scripts);
  return names.map((name) => {
    const m = meta[name] || {};
    return {
      name,
      command: scripts[name],
      description: m.description || '',
      env: m.env || 'dev',
      prodSafe: !!m.prodSafe,
      tags: Array.isArray(m.tags) ? m.tags : [],
      aiActions: typeof m.AI_actions === 'string' ? m.AI_actions : ''
    };
  });
}

function print(entries) {
  if (!entries.length) {
    console.log('No npm scripts defined.');
    return;
  }
  const pad = Math.max(4, ...entries.map((e) => e.name.length));
  for (const e of entries) {
    const tags = e.tags.length ? ` [${e.tags.join(',')}]` : '';
    const prod = e.prodSafe ? ' prod-safe' : '';
    const desc = e.description || '';
    console.log(`${e.name.padEnd(pad)}  ${desc}  (env:${e.env}${prod})${tags}`);
    console.log(`  -> ${e.command}`);
    // 显著标注 AI_actions 区块
    const banner = '================= AI_actions =================';
    console.log(`  ${banner}`);
    const content = e.aiActions && e.aiActions.trim().length > 0 ? e.aiActions : '（空）';
    for (const line of content.split(/\r?\n/)) {
      console.log(`    ${line}`);
    }
    console.log(`  ${'='.repeat(banner.length)}`);
    console.log('');
  }
}

function main() {
  try {
    const pkg = loadPkg();
    const entries = formatEntries(pkg);
    print(entries);
  } catch (err) {
    console.error('Failed to print scripts info:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();

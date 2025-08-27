#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');

const TEMP_DIR = path.join(__dirname, '..', 'prompt', 'temp');
const MAX_AGE_DAYS = 7;
const MAX_AGE_MS = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

async function clearOldPrompts() {
  let deletedCount = 0;
  try {
    const now = Date.now();
    const files = await fs.readdir(TEMP_DIR);

    for (const file of files) {
      if (!file.endsWith('_prompt.md')) {
        continue;
      }

      const filePath = path.join(TEMP_DIR, file);
      const stats = await fs.stat(filePath);

      if (now - stats.mtime.getTime() > MAX_AGE_MS) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`清理完成：成功删除了 ${deletedCount} 个超过 ${MAX_AGE_DAYS} 天的临时提示词文件。`);
    } else {
      console.log('无需清理：没有找到过期的临时文件。');
    }

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('无需清理：临时目录 (prompt/temp) 不存在。');
    } else {
      console.error(`执行清理任务时发生错误: ${error.message}`);
      console.error('请检查文件系统权限或路径是否正确。');
      process.exit(1);
    }
  }
}

clearOldPrompts();

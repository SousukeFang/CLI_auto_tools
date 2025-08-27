#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');

const TICKET_ID = process.argv[2];
const SEARCH_ROOT = 'E:\\download';
const TEMPLATE_PATH = path.join(__dirname, '..', 'prompt', 'sum_jira_to_wiki.md');
const PLACEHOLDER = '这里将会粘贴xml的完整内容';

async function findFileRecursive(dir, fileName) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const result = await findFileRecursive(fullPath, fileName);
        if (result) {
          return result;
        }
      } else if (entry.name === fileName) {
        return fullPath;
      }
    }
  } catch (error) {
    // Ignore permission errors or other issues reading directories
    if (error.code === 'EPERM' || error.code === 'EACCES') {
      return null;
    }
    throw error;
  }
  return null;
}

async function main() {
  if (!TICKET_ID) {
    console.error('错误：请提供工单号。用法: npm run sum:jira {工单号}');
    process.exit(1);
  }

  const fileName = `${TICKET_ID}.xml`;
  
  // 1. 在根目录查找
  let filePath = path.join(SEARCH_ROOT, fileName);
  try {
    await fs.access(filePath);
  } catch (error) {
    // 2. 如果根目录找不到，则递归查找子目录
    filePath = await findFileRecursive(SEARCH_ROOT, fileName);
  }

  if (!filePath) {
    console.log(`未找到 ${TICKET_ID} 的文件，请检查工单号是否正确，或者文件是否存在`);
    return;
  }

  try {
    // 3. 读取工单和模板文件内容
    const xmlContent = await fs.readFile(filePath, 'utf-8');
    const templateContent = await fs.readFile(TEMPLATE_PATH, 'utf-8');

    // 4. 拼接提示词
    const finalPrompt = templateContent.replace(PLACEHOLDER, xmlContent);

    // 5. 将结果写入临时文件并返回路径
    const tempDir = path.join(__dirname, '..', 'prompt', 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    const outputFilePath = path.join(tempDir, `${TICKET_ID}_prompt.md`);
    await fs.writeFile(outputFilePath, finalPrompt, 'utf-8');

    console.log(outputFilePath);

  } catch (error) {
    console.error(`处理文件时发生错误: ${error.message}`);
    process.exit(1);
  }
}

main();

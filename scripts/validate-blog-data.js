#!/usr/bin/env node
// 验证所有博客数据格式的脚本

const fs = require('fs');
const path = require('path');

function validateBlogData(filePath, name) {
  console.log(`\n检查 ${name}...`);

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (!data.lastUpdated) {
      console.log('  ❌ 缺少lastUpdated字段');
      return false;
    }

    if (!Array.isArray(data.items)) {
      console.log('  ❌ items不是数组');
      return false;
    }

    console.log(`  ✓ 数据结构正确`);
    console.log(`  ✓ Items数量: ${data.items.length}`);

    let hasIssues = false;

    data.items.forEach((item, idx) => {
      // 检查必需字段
      const required = ['title', 'link', 'pubDate', 'author'];
      const missing = required.filter(field => !item[field]);

      if (missing.length > 0) {
        console.log(`  ❌ Item ${idx} 缺少字段:`, missing);
        hasIssues = true;
      }

      // 检查author是否为对象
      if (typeof item.author === 'object' && item.author !== null) {
        console.log(`  ❌ Item ${idx} author是对象而不是字符串:`,
          JSON.stringify(item.author).substring(0, 50));
        hasIssues = true;
      }

      // 检查titleZh和descriptionZh
      if (!item.titleZh) {
        console.log(`  ⚠️  Item ${idx} 缺少titleZh`);
      }
      if (!item.descriptionZh) {
        console.log(`  ⚠️  Item ${idx} 缺少descriptionZh`);
      }
    });

    if (!hasIssues) {
      console.log(`  ✓ 所有数据格式正确`);
      return true;
    } else {
      console.log(`  ❌ 发现格式问题`);
      return false;
    }

  } catch (error) {
    console.log(`  ❌ 读取或解析错误:`, error.message);
    return false;
  }
}

console.log('=== 博客数据格式验证 ===');

const anthropicPath = path.join(__dirname, '../public/data/anthropic-news.json');
const geminiPath = path.join(__dirname, '../public/data/gemini-news.json');

const anthropicOk = validateBlogData(anthropicPath, 'Anthropic博客');
const geminiOk = validateBlogData(geminiPath, 'Gemini博客');

console.log('\n=== 验证结果 ===');
console.log(`Anthropic: ${anthropicOk ? '✓ 通过' : '❌ 失败'}`);
console.log(`Gemini: ${geminiOk ? '✓ 通过' : '❌ 失败'}`);

if (anthropicOk && geminiOk) {
  console.log('\n✓ 所有数据格式正确！');
  process.exit(0);
} else {
  console.log('\n❌ 发现数据格式问题，请修复！');
  process.exit(1);
}

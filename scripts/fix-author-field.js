const fs = require('fs');
const path = require('path');

// 修复gemini-news.json的author字段
const geminiPath = path.join(__dirname, '../public/data/gemini-news.json');
const geminiDataPath = path.join(__dirname, '../data/gemini-news.json');

const data = JSON.parse(fs.readFileSync(geminiPath, 'utf-8'));

console.log('修复前:');
console.log('Items:', data.items.length);

// 修复author字段
data.items = data.items.map(item => {
  if (typeof item.author === 'object' && item.author !== null) {
    // 提取author名字
    if (item.author.name && Array.isArray(item.author.name)) {
      item.author = item.author.name[0] || 'Google AI Team';
    } else if (item.author.name) {
      item.author = item.author.name;
    } else {
      item.author = 'Google AI Team';
    }
  }
  return item;
});

fs.writeFileSync(geminiPath, JSON.stringify(data, null, 2), 'utf-8');
fs.writeFileSync(geminiDataPath, JSON.stringify(data, null, 2), 'utf-8');

console.log('\n修复后:');
console.log('Items:', data.items.length);
console.log('前3条author:');
data.items.slice(0, 3).forEach((item, idx) => {
  console.log(`  ${idx+1}. ${item.author}`);
});
console.log('\n✓ 已修复并保存');

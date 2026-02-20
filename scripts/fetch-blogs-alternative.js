// 加载环境变量
require('dotenv').config();

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// 使用公开的新闻聚合API或直接从网页获取
async function fetchAnthropicNews() {
  try {
    console.log('正在抓取Anthropic新闻...');

    // 方案1: 尝试使用RSSHub
    const rsshubUrls = [
      'https://rsshub.app/anthropic/news',
      'https://rss.rssforever.com/anthropic/news',
    ];

    for (const url of rsshubUrls) {
      try {
        console.log(`  尝试: ${url}`);
        const response = await fetch(url, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)'
          }
        });

        if (response.ok) {
          const xml = await response.text();
          console.log(`  ✓ 成功获取RSS (${xml.length} 字符)`);
          return xml;
        }
      } catch (err) {
        console.log(`  ✗ 失败: ${err.message}`);
        continue;
      }
    }

    console.log('❌ 所有Anthropic RSS源都失败了');
    return null;
  } catch (error) {
    console.error('Anthropic抓取失败:', error.message);
    return null;
  }
}

async function fetchGoogleAIBlog() {
  try {
    console.log('正在抓取Google AI Blog...');

    const urls = [
      'https://blog.google/rss/',
      'https://blog.google/technology/ai/rss/',
      'https://rsshub.app/google/blog/ai'
    ];

    for (const url of urls) {
      try {
        console.log(`  尝试: ${url}`);
        const response = await fetch(url, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)'
          }
        });

        if (response.ok) {
          const xml = await response.text();
          console.log(`  ✓ 成功获取RSS (${xml.length} 字符)`);
          return xml;
        }
      } catch (err) {
        console.log(`  ✗ 失败: ${err.message}`);
        continue;
      }
    }

    console.log('❌ 所有Google Blog RSS源都失败了');
    return null;
  } catch (error) {
    console.error('Google Blog抓取失败:', error.message);
    return null;
  }
}

async function main() {
  console.log('=== 替代方案：RSS抓取测试 ===\n');

  const anthropicXML = await fetchAnthropicNews();
  const googleXML = await fetchGoogleAIBlog();

  console.log('\n=== 结果摘要 ===');
  console.log(`Anthropic: ${anthropicXML ? '成功' : '失败'}`);
  console.log(`Google Blog: ${googleXML ? '成功' : '失败'}`);

  if (anthropicXML) {
    fs.writeFileSync(path.join(__dirname, '../.temp-anthropic.xml'), anthropicXML, 'utf-8');
    console.log('已保存 Anthropic XML 到 .temp-anthropic.xml');
  }

  if (googleXML) {
    fs.writeFileSync(path.join(__dirname, '../.temp-google.xml'), googleXML, 'utf-8');
    console.log('已保存 Google XML 到 .temp-google.xml');
  }
}

main().catch(console.error);

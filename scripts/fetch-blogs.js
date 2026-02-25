// 加载环境变量
require('dotenv').config();

const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

// 博客RSS数据源配置
const BLOG_FEEDS = [
  // Anthropic - 使用多个镜像提高成功率
  {
    url: 'https://rsshub.app/anthropic/news',
    name: 'Anthropic News',
    type: 'anthropic',
    category: 'anthropic-blog'
  },

  // Google AI Blog - 官方RSS
  {
    url: 'https://blog.google/rss/',
    name: 'Google Blog',
    type: 'gemini',
    category: 'gemini-blog'
  }
];

const parser = new Parser({
  timeout: 30000,
  customFields: {
    item: [
      ['media:group', 'mediaGroup'],
      ['content:encoded', 'contentEncoded'],
      ['author', 'author']  // 确保author被当作原始字段处理
    ]
  }
});

// 检测文本是否为中文
function isChinese(text) {
  if (!text) return false;
  return /[\u4e00-\u9fa5]/.test(text);
}

// 使用DeepSeek API生成AI摘要（英译中）
async function generateAISummary(text, isTitle = false, retries = 3) {
  if (!text || text.trim().length === 0) {
    return text;
  }

  if (isChinese(text)) {
    console.log('检测到中文内容，跳过AI处理');
    return text;
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('未配置DEEPSEEK_API_KEY，返回原文');
    return text;
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const url = 'https://api.deepseek.com/v1/chat/completions';

      const systemPrompt = isTitle
        ? '你是专业的英中翻译助手。只需翻译标题，不要添加任何说明或前缀。'
        : '你是专业的AI技术博客编辑。阅读英文博客后，生成完整的中文摘要。要求：1) 完整介绍背景和上下文 2) 详细解释核心技术原理和创新点 3) 分析技术影响和应用场景 4) 语言专业但易懂。摘要长度根据原文内容自然确定，无需限制字数。直接输出摘要，不要添加"摘要："等前缀。';

      const userPrompt = isTitle
        ? `翻译这个标题：${text}`
        : `请为以下英文博客生成完整的中文摘要（长度根据原文内容自然确定）：\n\n${text}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: isTitle ? 150 : 8192  // 标题150，摘要无限制(使用模型最大值)
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        const status = response.status;

        if ((status === 429 || status === 503) && attempt < retries - 1) {
          const waitTime = Math.pow(2, attempt) * 5000;
          console.log(`⚠️  API限流/繁忙 (${status})，${waitTime/1000}秒后重试 (第${attempt + 1}次)...`);
          await delay(waitTime);
          continue;
        }

        console.error(`DeepSeek API返回错误 (${status}): ${errorText}`);
        return text;
      }

      const data = await response.json();

      if (data.choices && data.choices[0] && data.choices[0].message) {
        const choice = data.choices[0];
        const summary = choice.message.content.trim();
        const charCount = summary.length;

        console.log(`✓ DeepSeek${isTitle ? '翻译' : '摘要'}(${charCount}字): ${text.substring(0, 30)}... → ${summary.substring(0, 50)}...`);
        return summary;
      } else {
        console.error('DeepSeek API返回格式错误:', JSON.stringify(data).substring(0, 500));
        return text;
      }
    } catch (error) {
      if (attempt < retries - 1) {
        const waitTime = Math.pow(2, attempt) * 5000;
        console.log(`⚠️  请求失败: ${error.message}，${waitTime/1000}秒后重试...`);
        await delay(waitTime);
        continue;
      }
      console.error('AI摘要生成失败:', error.message);
      return text;
    }
  }

  return text;
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 抓取单个RSS源
async function fetchFeed(feedConfig) {
  try {
    console.log(`正在抓取: ${feedConfig.name} (${feedConfig.url})`);
    const feed = await parser.parseURL(feedConfig.url);

    console.log(`  RSS标题: ${feed.title || 'N/A'}`);
    console.log(`  原始条目数: ${feed.items.length}`);

    const items = feed.items.map(item => {
      // 处理author字段 - 确保是字符串
      let authorName = feedConfig.name;
      if (item.creator) {
        authorName = item.creator;
      } else if (item.author) {
        // 如果author是对象，提取name字段
        if (typeof item.author === 'object' && item.author !== null) {
          if (item.author.name) {
            authorName = Array.isArray(item.author.name) ? item.author.name[0] : item.author.name;
          }
        } else if (typeof item.author === 'string') {
          authorName = item.author;
        }
      }

      return {
        title: item.title || '',
        link: item.link || '',
        description: item.contentSnippet || item.summary || '',
        content: item.content || item.contentEncoded || item.contentSnippet || '',
        author: authorName,
        source: feedConfig.name,
        sourceType: feedConfig.type,
        category: feedConfig.category,
        pubDate: item.pubDate || item.isoDate || new Date().toISOString()
      };
    });

    console.log(`${feedConfig.name}: 获取到 ${items.length} 条内容`);

    // 打印最新一条的日期
    if (items.length > 0) {
      console.log(`  最新文章: ${items[0].title.substring(0, 50)}...`);
      console.log(`  发布日期: ${items[0].pubDate}`);
    }

    return items;
  } catch (error) {
    console.error(`❌ 抓取 ${feedConfig.name} 失败:`);
    console.error(`   URL: ${feedConfig.url}`);
    console.error(`   错误: ${error.message}`);
    console.error(`   错误码: ${error.code || 'N/A'}`);
    return [];
  }
}

// 批量处理函数
async function processBatch(items, processor, batchSize) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    console.log(`\n处理第 ${Math.floor(i / batchSize) + 1} 批 (${batch.length}条)...`);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
    if (i + batchSize < items.length) {
      await delay(500);
    }
  }
  return results;
}

// 主函数
async function main() {
  console.log('开始抓取技术博客...');

  // 抓取所有博客源
  const allFeeds = await Promise.all(BLOG_FEEDS.map(feed => fetchFeed(feed)));
  let allItems = allFeeds.flat();

  console.log(`总共获取到 ${allItems.length} 条博客内容`);

  // 按类别分组
  const anthropicItems = allItems.filter(item => item.category === 'anthropic-blog');
  const geminiItems = allItems.filter(item => item.category === 'gemini-blog');

  console.log(`Anthropic博客: ${anthropicItems.length} 条`);
  console.log(`Gemini博客: ${geminiItems.length} 条`);

  // 只保留最近7天的博客
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  let recentAnthropicItems = anthropicItems
    .filter(item => new Date(item.pubDate) > sevenDaysAgo)
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    .slice(0, 10); // 最多10条

  let recentGeminiItems = geminiItems
    .filter(item => new Date(item.pubDate) > sevenDaysAgo)
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    .slice(0, 10); // 最多10条

  console.log(`\n7天内Anthropic博客: ${recentAnthropicItems.length} 条`);
  console.log(`7天内Gemini博客: ${recentGeminiItems.length} 条`);

  // 详细打印过滤结果
  if (anthropicItems.length > 0 && recentAnthropicItems.length === 0) {
    console.log(`⚠️  警告: Anthropic有${anthropicItems.length}条原始数据，但过滤后为0条`);
    console.log(`   检查发布日期:`);
    anthropicItems.slice(0, 3).forEach((item, i) => {
      console.log(`   ${i+1}. ${item.title.substring(0, 40)}... | ${item.pubDate}`);
    });
  }

  if (geminiItems.length > 0 && recentGeminiItems.length === 0) {
    console.log(`⚠️  警告: Gemini有${geminiItems.length}条原始数据，但过滤后为0条`);
    console.log(`   检查发布日期:`);
    geminiItems.slice(0, 3).forEach((item, i) => {
      console.log(`   ${i+1}. ${item.title.substring(0, 40)}... | ${item.pubDate}`);
    });
  }

  // 批量翻译Anthropic博客
  if (recentAnthropicItems.length > 0) {
    console.log('\n\n=== 处理Anthropic博客 ===');
    console.log('📝 阶段1：批量翻译标题...');

    const titleTasks = recentAnthropicItems
      .filter(item => !isChinese(item.title))
      .map((item, index) => ({ item, index, text: item.title }));

    if (titleTasks.length > 0) {
      await processBatch(
        titleTasks,
        async (task) => {
          const translated = await generateAISummary(task.text, true);
          task.item.titleZh = translated;
          return translated;
        },
        5
      );
    }

    recentAnthropicItems.forEach(item => {
      if (!item.titleZh) item.titleZh = item.title;
    });

    console.log('\n📄 阶段2：批量生成摘要...');
    const summaryTasks = recentAnthropicItems
      .filter(item => !isChinese(item.content || item.description))
      .map((item, index) => ({
        item,
        index,
        text: item.content || item.description || ''
      }));

    if (summaryTasks.length > 0) {
      await processBatch(
        summaryTasks,
        async (task) => {
          const summary = await generateAISummary(task.text, false);
          task.item.descriptionZh = summary;
          return summary;
        },
        5
      );
    }

    recentAnthropicItems.forEach(item => {
      if (!item.descriptionZh) item.descriptionZh = item.description || item.content;
    });
  }

  // 批量翻译Gemini博客
  if (recentGeminiItems.length > 0) {
    console.log('\n\n=== 处理Gemini博客 ===');
    console.log('📝 阶段1：批量翻译标题...');

    const titleTasks = recentGeminiItems
      .filter(item => !isChinese(item.title))
      .map((item, index) => ({ item, index, text: item.title }));

    if (titleTasks.length > 0) {
      await processBatch(
        titleTasks,
        async (task) => {
          const translated = await generateAISummary(task.text, true);
          task.item.titleZh = translated;
          return translated;
        },
        5
      );
    }

    recentGeminiItems.forEach(item => {
      if (!item.titleZh) item.titleZh = item.title;
    });

    console.log('\n📄 阶段2：批量生成摘要...');
    const summaryTasks = recentGeminiItems
      .filter(item => !isChinese(item.content || item.description))
      .map((item, index) => ({
        item,
        index,
        text: item.content || item.description || ''
      }));

    if (summaryTasks.length > 0) {
      await processBatch(
        summaryTasks,
        async (task) => {
          const summary = await generateAISummary(task.text, false);
          task.item.descriptionZh = summary;
          return summary;
        },
        5
      );
    }

    recentGeminiItems.forEach(item => {
      if (!item.descriptionZh) item.descriptionZh = item.description || item.content;
    });
  }

  console.log('\n✅ 博客翻译完成！');

  // 最终清理：确保所有author字段都是字符串
  const cleanAuthorField = (items) => {
    return items.map(item => {
      if (typeof item.author === 'object' && item.author !== null) {
        if (item.author.name) {
          item.author = Array.isArray(item.author.name) ? item.author.name[0] : item.author.name;
        } else {
          item.author = item.source || 'Unknown';
        }
      }
      return item;
    });
  };

  // 清理数据
  recentAnthropicItems = cleanAuthorField(recentAnthropicItems);
  recentGeminiItems = cleanAuthorField(recentGeminiItems);

  // 保存Anthropic博客数据 - 如果没有新数据则保留旧数据
  const anthropicDataPath = path.join(__dirname, '../data/anthropic-news.json');
  const publicAnthropicPath = path.join(__dirname, '../public/data/anthropic-news.json');

  if (recentAnthropicItems.length > 0) {
    const anthropicData = {
      lastUpdated: new Date().toISOString(),
      items: recentAnthropicItems
    };
    fs.writeFileSync(anthropicDataPath, JSON.stringify(anthropicData, null, 2), 'utf-8');
    fs.writeFileSync(publicAnthropicPath, JSON.stringify(anthropicData, null, 2), 'utf-8');
    console.log(`\n✓ 已更新Anthropic博客数据: ${recentAnthropicItems.length} 条`);
  } else {
    console.log(`\n⚠️  Anthropic无新数据，保留现有数据`);
  }

  // 保存Gemini博客数据 - 如果没有新数据则保留旧数据
  const geminiDataPath = path.join(__dirname, '../data/gemini-news.json');
  const publicGeminiPath = path.join(__dirname, '../public/data/gemini-news.json');

  if (recentGeminiItems.length > 0) {
    const geminiData = {
      lastUpdated: new Date().toISOString(),
      items: recentGeminiItems
    };
    fs.writeFileSync(geminiDataPath, JSON.stringify(geminiData, null, 2), 'utf-8');
    fs.writeFileSync(publicGeminiPath, JSON.stringify(geminiData, null, 2), 'utf-8');
    console.log(`✓ 已更新Gemini博客数据: ${recentGeminiItems.length} 条`);
  } else {
    console.log(`⚠️  Gemini无新数据，保留现有数据`);
  }

  console.log(`\n保存完成！`);
}

// 运行
main().catch(error => {
  console.error('发生错误:', error);
  process.exit(1);
});

// 加载环境变量
require('dotenv').config();

const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// RSS数据源配置
const RSS_FEEDS = [
  // YouTube AI相关频道
  { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCXZCJLdBC09xxGZ6gcdrc6A', name: 'Two Minute Papers', type: 'youtube' },
  { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCUHW94eEFW7hkUMVaZz4eDg', name: 'AI Explained', type: 'youtube' },
  { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCbfYPyITQ-7l4upoX8nvctg', name: 'Lex Fridman', type: 'youtube' },

  // 中文AI新闻网站
  { url: 'https://rsshub.app/jiqizhixin/latest', name: '机器之心', type: 'news' },
  { url: 'https://rsshub.app/36kr/newsflashes', name: '36氪AI快讯', type: 'news' },

  // 英文AI新闻网站
  { url: 'https://techcrunch.com/tag/artificial-intelligence/feed/', name: 'TechCrunch AI', type: 'news' },
  { url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', name: 'The Verge AI', type: 'news' },

  // Nitter (Twitter替代) - 这些需要根据可用的Nitter实例调整
  // { url: 'https://nitter.net/OpenAI/rss', name: 'OpenAI Twitter', type: 'twitter' },
  // { url: 'https://nitter.net/AndrewYNg/rss', name: 'Andrew Ng Twitter', type: 'twitter' },
];

// HuggingFace API配置
// 清理API Key，移除空格、换行符等非法字符
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY
  ? process.env.HUGGINGFACE_API_KEY.trim().replace(/[\r\n\t]/g, '')
  : null;
const HUGGINGFACE_MODEL = 'facebook/bart-large-mnli'; // 零样本分类模型
const TRANSLATION_MODEL = 'Helsinki-NLP/opus-mt-en-zh'; // 英译中模型

// 验证API Key配置
if (HUGGINGFACE_API_KEY) {
  if (!HUGGINGFACE_API_KEY.startsWith('hf_')) {
    console.warn('警告: HuggingFace API Key格式可能不正确（应以hf_开头）');
  }
  console.log(`✅ HuggingFace API Key已配置，将尝试使用AI分类和翻译`);
} else {
  console.log('⚠️  未配置HuggingFace API Key，将使用关键词匹配（无翻译功能）');
}

// AI相关关键词（主要分类方案）
const AI_KEYWORDS = [
  // 英文关键词
  'artificial intelligence', 'AI', 'machine learning', 'deep learning',
  'neural network', 'chatgpt', 'gpt', 'llm', 'large language model',
  'computer vision', 'natural language processing', 'nlp',
  'transformer', 'diffusion', 'stable diffusion', 'midjourney',
  'anthropic', 'claude', 'openai', 'google ai', 'deepmind',
  'generative ai', 'gen ai', 'ai model', 'ai training', 'ai inference',
  'reinforcement learning', 'supervised learning', 'unsupervised learning',
  'bert', 'gpt-4', 'gpt-3', 'dall-e', 'gemini', 'copilot',
  'langchain', 'huggingface', 'tensorflow', 'pytorch', 'keras',

  // 中文关键词
  '人工智能', '机器学习', '深度学习', '神经网络', '大模型',
  '大语言模型', '生成式AI', '通用人工智能', '强化学习',
  '自然语言处理', '计算机视觉', '语音识别', '图像识别',
  '智能对话', '智能助手', 'AI芯片', 'AI加速器'
];

const parser = new Parser({
  timeout: 30000, // 增加超时时间到30秒
  customFields: {
    item: [
      ['media:group', 'mediaGroup'],
      ['media:statistics', 'mediaStatistics'],
      ['yt:videoId', 'videoId'],
      ['content:encoded', 'contentEncoded']
    ]
  }
});

// 使用HuggingFace API进行AI相关性分类
async function classifyWithHuggingFace(text) {
  // 尝试使用HuggingFace API，失败则降级到关键词匹配
  if (!HUGGINGFACE_API_KEY) {
    return classifyWithKeywords(text);
  }

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${HUGGINGFACE_MODEL}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: text,
          parameters: {
            candidate_labels: ['artificial intelligence', 'technology', 'general news'],
            multi_label: false
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`HuggingFace分类API返回错误 (${response.status}): ${errorText.substring(0, 100)}`);
      return classifyWithKeywords(text);
    }

    const result = await response.json();

    // 如果"artificial intelligence"标签得分最高且超过阈值，认为是AI相关
    if (result.labels && result.labels[0] === 'artificial intelligence' && result.scores[0] > 0.5) {
      return true;
    }

    return false;
  } catch (error) {
    // 只在第一次错误时打印详细信息，避免日志刷屏
    if (!classifyWithHuggingFace.errorLogged) {
      console.error('HuggingFace分类API错误:', error.message);
      console.error('错误详情:', error.stack);
      console.log('后续将使用关键词匹配，不再重复显示此错误');
      classifyWithHuggingFace.errorLogged = true;
    }
    return classifyWithKeywords(text);
  }
}

// 备用：使用关键词匹配
function classifyWithKeywords(text) {
  const lowerText = text.toLowerCase();
  return AI_KEYWORDS.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

// 使用HuggingFace翻译文本（英文到中文）
async function translateToZh(text) {
  // 如果文本已经包含大量中文，不需要翻译
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  if (chineseChars > text.length * 0.3) {
    return text;
  }

  if (!HUGGINGFACE_API_KEY) {
    return text;
  }

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${TRANSLATION_MODEL}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: text,
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`翻译API返回错误 (${response.status}): ${errorText.substring(0, 200)}`);
      return text;
    }

    const result = await response.json();

    // HuggingFace翻译API返回格式: [{ "translation_text": "翻译结果" }]
    if (result && result[0] && result[0].translation_text) {
      return result[0].translation_text;
    }

    return text;
  } catch (error) {
    // 只在第一次错误时打印详细信息
    if (!translateToZh.errorLogged) {
      console.error('翻译API错误:', error.message);
      console.log('后续翻译失败将使用原文，不再重复显示此错误');
      translateToZh.errorLogged = true;
    }
    return text; // 失败时返回原文
  }
}

// 检测文本语言（简单判断）
function isEnglish(text) {
  const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  return englishChars > chineseChars;
}

// 从YouTube视频ID获取观看量
function extractYoutubeViews(item) {
  // YouTube RSS feed中可能包含媒体统计信息
  if (item.mediaGroup && item.mediaGroup['media:community']) {
    const stats = item.mediaGroup['media:community']['media:statistics'];
    if (stats && stats['$'] && stats['$'].views) {
      return parseInt(stats['$'].views) || 0;
    }
  }

  // 如果无法获取，返回0（后续可以通过YouTube API获取）
  return 0;
}

// 抓取单个RSS源
async function fetchFeed(feedConfig) {
  try {
    console.log(`正在抓取: ${feedConfig.name}`);
    const feed = await parser.parseURL(feedConfig.url);

    const items = feed.items.map(item => {
      // 提取热度指标
      let popularity = 0;
      if (feedConfig.type === 'youtube') {
        popularity = extractYoutubeViews(item);
      }

      return {
        title: item.title || '',
        link: item.link || '',
        description: item.contentSnippet || item.summary || '',
        content: item.content || item.contentEncoded || item.contentSnippet || '', // 完整内容
        author: item.creator || item.author || feedConfig.name,
        source: feedConfig.name,
        sourceType: feedConfig.type,
        pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
        popularity: popularity
      };
    });

    console.log(`${feedConfig.name}: 获取到 ${items.length} 条内容`);
    return items;
  } catch (error) {
    console.error(`抓取 ${feedConfig.name} 失败:`, error.message);
    return [];
  }
}

// 主函数
async function main() {
  console.log('开始抓取RSS feeds...');

  // 抓取所有RSS源
  const allFeeds = await Promise.all(RSS_FEEDS.map(feed => fetchFeed(feed)));
  let allItems = allFeeds.flat();

  console.log(`总共获取到 ${allItems.length} 条内容`);

  // 过滤出AI相关的内容
  console.log('开始AI相关性分类...');
  const aiRelatedItems = [];

  for (const item of allItems) {
    const textToClassify = `${item.title} ${item.description}`;
    const isAIRelated = await classifyWithHuggingFace(textToClassify);

    if (isAIRelated) {
      aiRelatedItems.push(item);
    }

    // 避免API调用过快
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`筛选出 ${aiRelatedItems.length} 条AI相关内容`);

  // 翻译英文内容到中文
  console.log('开始翻译英文内容到中文...');
  for (const item of aiRelatedItems) {
    // 翻译标题
    if (isEnglish(item.title)) {
      item.titleZh = await translateToZh(item.title);
      await new Promise(resolve => setTimeout(resolve, 100));
    } else {
      item.titleZh = item.title;
    }

    // 翻译描述
    if (isEnglish(item.description)) {
      item.descriptionZh = await translateToZh(item.description.substring(0, 1000));
      await new Promise(resolve => setTimeout(resolve, 100));
    } else {
      item.descriptionZh = item.description;
    }

    // 翻译完整内容（如果有）
    if (item.content && isEnglish(item.content)) {
      const plainText = item.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (plainText.length > 0) {
        item.contentZh = await translateToZh(plainText.substring(0, 2000));
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        item.contentZh = item.descriptionZh;
      }
    } else {
      item.contentZh = item.content || item.descriptionZh;
    }
  }

  console.log('翻译完成！');

  // 按发布时间排序（从新到旧）
  aiRelatedItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  // 严格限制：只保留过去48小时的新闻（硬性上限）
  const fortyEightHoursAgo = new Date();
  fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

  const finalItems = aiRelatedItems.filter(item => {
    const itemDate = new Date(item.pubDate);
    return itemDate > fortyEightHoursAgo;
  });

  console.log(`过滤48小时: 从 ${aiRelatedItems.length} 条筛选出 ${finalItems.length} 条最新内容`);

  // 注意：宁可显示少于15条，也不显示超过48小时的旧新闻
  if (finalItems.length < 15) {
    console.log(`⚠️  48小时内只有 ${finalItems.length} 条新闻，将只显示这些新闻（不会补充旧新闻）`);
  }

  // 分类关键词
  const AI_CHIP_KEYWORDS = [
    'nvidia', 'tpu', 'tensor processing unit', 'google tpu', 'tenstorrent',
    'sambanova', 'groq', 'tesla', 'dojo', 'gpu', 'ai chip', 'ai accelerator',
    'inference chip', 'training chip'
  ];

  const AI_HARDWARE_KEYWORDS = [
    'hardware', 'server', 'data center', 'datacenter', 'power', 'energy',
    'cooling', 'infrastructure', 'rack', 'processor', 'memory', 'storage',
    'neural engine', 'edge device', 'robotics hardware', 'quantum computing'
  ];

  // 分类函数
  function categorizeItem(item) {
    const text = `${item.title} ${item.description}`.toLowerCase();

    // 检查AI芯片相关
    if (AI_CHIP_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()))) {
      return 'ai-chip';
    }

    // 检查AI硬件相关
    if (AI_HARDWARE_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()))) {
      return 'ai-hardware';
    }

    // 其他AI相关
    return 'ai-other';
  }

  // 对内容进行分类
  console.log('开始按类别分类新闻...');
  const categorizedItems = {
    'ai-chip': [],
    'ai-hardware': [],
    'ai-other': []
  };

  for (const item of finalItems) {
    const category = categorizeItem(item);
    categorizedItems[category].push(item);
    item.category = category; // 保存分类信息
  }

  console.log(`分类结果:`);
  console.log(`  AI芯片类: ${categorizedItems['ai-chip'].length} 条`);
  console.log(`  AI硬件类: ${categorizedItems['ai-hardware'].length} 条`);
  console.log(`  其他AI类: ${categorizedItems['ai-other'].length} 条`);

  // 按配额选取新闻（各类别尽量取5条，但不强求）
  const selectedItems = [
    ...categorizedItems['ai-chip'].slice(0, 5),      // AI芯片：最多5条
    ...categorizedItems['ai-hardware'].slice(0, 5),  // AI硬件：最多5条
    ...categorizedItems['ai-other'].slice(0, 5)      // 其他AI：最多5条
  ];

  // 如果某个类别不足，从其他类别补充（但只从48小时内的数据补充）
  const deficit = 15 - selectedItems.length;
  if (deficit > 0 && selectedItems.length > 0) {
    console.log(`总数不足15条，尝试从48小时内其他新闻补充 ${deficit} 条`);
    const remainingItems = finalItems.filter(item => !selectedItems.includes(item));
    const supplementItems = remainingItems.slice(0, deficit);
    selectedItems.push(...supplementItems);
    console.log(`实际补充了 ${supplementItems.length} 条`);
  }

  // 按发布时间重新排序
  selectedItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  console.log(`\n最终选取 ${selectedItems.length} 条新闻`);

  // 使用selectedItems替代原来的top10
  const top15 = selectedItems;

  // 直接使用新抓取的15条数据，不与旧数据合并
  // 这样可以确保每次都显示最新的15条新闻
  const dataPath = path.join(__dirname, '../data/news.json');
  const newData = {
    lastUpdated: new Date().toISOString(),
    items: top15, // 直接使用新抓取的15条
    history: top15 // 历史记录也使用相同数据
  };

  fs.writeFileSync(dataPath, JSON.stringify(newData, null, 2), 'utf-8');

  // 同时复制到public目录供网页访问
  const publicDataPath = path.join(__dirname, '../public/data/news.json');
  const publicDir = path.dirname(publicDataPath);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  fs.writeFileSync(publicDataPath, JSON.stringify(newData, null, 2), 'utf-8');

  console.log('完成！保存了', top15.length, '条内容');
  console.log('\n最新的15条（按类别）:');

  // 按类别显示
  const chipItems = top15.filter(item => item.category === 'ai-chip');
  const hardwareItems = top15.filter(item => item.category === 'ai-hardware');
  const otherItems = top15.filter(item => item.category === 'ai-other');

  console.log('\n📊 AI芯片类 (' + chipItems.length + '条):');
  chipItems.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.title} (${item.source})`);
  });

  console.log('\n🔧 AI硬件类 (' + hardwareItems.length + '条):');
  hardwareItems.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.title} (${item.source})`);
  });

  console.log('\n🤖 其他AI类 (' + otherItems.length + '条):');
  otherItems.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.title} (${item.source})`);
  });
}

// 运行
main().catch(error => {
  console.error('发生错误:', error);
  process.exit(1);
});

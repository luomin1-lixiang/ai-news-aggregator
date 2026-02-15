// 加载环境变量
require('dotenv').config();

const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

// RSS数据源配置
const RSS_FEEDS = [
  // === YouTube AI相关频道 ===
  { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCXZCJLdBC09xxGZ6gcdrc6A', name: 'Two Minute Papers', type: 'youtube' },
  { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCUHW94eEFW7hkUMVaZz4eDg', name: 'AI Explained', type: 'youtube' },
  { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCbfYPyITQ-7l4upoX8nvctg', name: 'Lex Fridman', type: 'youtube' },

  // === 国际主流权威媒体 ===
  { url: 'https://www.reuters.com/technology/artificial-intelligence/rss', name: 'Reuters AI', type: 'news' },
  { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', name: 'BBC Tech', type: 'news' },
  { url: 'https://www.technologyreview.com/feed/', name: 'MIT Tech Review', type: 'news' },
  { url: 'https://www.wired.com/feed/tag/ai/latest/rss', name: 'Wired AI', type: 'news' },

  // === 科技专业媒体 ===
  { url: 'https://techcrunch.com/tag/artificial-intelligence/feed/', name: 'TechCrunch AI', type: 'news' },
  { url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', name: 'The Verge AI', type: 'news' },
  { url: 'https://venturebeat.com/category/ai/feed/', name: 'VentureBeat AI', type: 'news' },
  { url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', name: 'Ars Technica', type: 'news' },
  { url: 'https://www.theinformation.com/articles/feed', name: 'The Information', type: 'news' },

  // === AI公司官方博客 ===
  { url: 'https://openai.com/blog/rss.xml', name: 'OpenAI Blog', type: 'news' },
  { url: 'https://blog.research.google/feeds/posts/default', name: 'Google AI Blog', type: 'news' },
  { url: 'https://www.anthropic.com/news.rss', name: 'Anthropic News', type: 'news' },
  { url: 'https://deepmind.google/blog/rss.xml', name: 'DeepMind Blog', type: 'news' },

  // === AI硬件/芯片专业源 ===
  { url: 'https://chipsandcheese.com/feed/', name: 'Chips and Cheese', type: 'news' },
  { url: 'https://www.anandtech.com/rss/', name: 'AnandTech', type: 'news' },
  { url: 'https://rsshub.app/semianalysis', name: 'SemiAnalysis', type: 'news' },

  // === 学术/研究源 ===
  { url: 'https://export.arxiv.org/rss/cs.AI', name: 'arXiv AI Papers', type: 'news' },
  { url: 'https://paperswithcode.com/latest/rss', name: 'Papers With Code', type: 'news' },

  // === 中文优质AI媒体 ===
  { url: 'https://rsshub.app/jiqizhixin/latest', name: '机器之心', type: 'news' },
  { url: 'https://rsshub.app/36kr/newsflashes', name: '36氪AI快讯', type: 'news' },
  { url: 'https://rsshub.app/qbitai', name: '量子位', type: 'news' },
  { url: 'https://rsshub.app/ai-era', name: '新智元', type: 'news' },
  { url: 'https://rsshub.app/leiphone/category/ai', name: 'AI科技评论', type: 'news' },
  { url: 'https://rsshub.app/huxiu/tag/AI', name: '虎嗅AI', type: 'news' },
];

// AI相关关键词（用于过滤）
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

// AI芯片关键词
const AI_CHIP_KEYWORDS = [
  'nvidia', 'tpu', 'tensor processing unit', 'google tpu', 'tenstorrent',
  'sambanova', 'groq', 'tesla', 'dojo', 'gpu', 'ai chip', 'ai accelerator',
  'inference chip', 'training chip', '英伟达', 'AI芯片', 'GPU'
];

// AI硬件关键词
const AI_HARDWARE_KEYWORDS = [
  'hardware', 'server', 'data center', 'datacenter', 'power', 'energy',
  'cooling', 'infrastructure', 'rack', 'processor', 'memory', 'storage',
  'neural engine', 'edge device', 'robotics hardware', 'quantum computing',
  '服务器', '数据中心', '算力', '硬件'
];

const parser = new Parser({
  timeout: 30000,
  customFields: {
    item: [
      ['media:group', 'mediaGroup'],
      ['media:statistics', 'mediaStatistics'],
      ['yt:videoId', 'videoId'],
      ['content:encoded', 'contentEncoded']
    ]
  }
});

// 使用关键词匹配判断是否AI相关
function isAIRelated(text) {
  const lowerText = text.toLowerCase();
  return AI_KEYWORDS.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

// 提取YouTube视频观看量
function extractYoutubeViews(item) {
  if (item.mediaGroup && item.mediaGroup['media:community']) {
    const stats = item.mediaGroup['media:community']['media:statistics'];
    if (stats && stats['$'] && stats['$'].views) {
      return parseInt(stats['$'].views) || 0;
    }
  }
  return 0;
}

// 抓取单个RSS源
async function fetchFeed(feedConfig) {
  try {
    console.log(`正在抓取: ${feedConfig.name}`);
    const feed = await parser.parseURL(feedConfig.url);

    const items = feed.items.map(item => {
      let popularity = 0;
      if (feedConfig.type === 'youtube') {
        popularity = extractYoutubeViews(item);
      }

      return {
        title: item.title || '',
        link: item.link || '',
        description: item.contentSnippet || item.summary || '',
        content: item.content || item.contentEncoded || item.contentSnippet || '',
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

// 主函数
async function main() {
  console.log('开始抓取RSS feeds...');
  console.log('✅ 使用关键词匹配（无翻译功能）');

  // 抓取所有RSS源
  const allFeeds = await Promise.all(RSS_FEEDS.map(feed => fetchFeed(feed)));
  let allItems = allFeeds.flat();

  console.log(`总共获取到 ${allItems.length} 条内容`);

  // 过滤出AI相关的内容
  console.log('开始AI相关性过滤...');
  const aiRelatedItems = allItems.filter(item => {
    const textToClassify = `${item.title} ${item.description}`;
    return isAIRelated(textToClassify);
  });

  console.log(`筛选出 ${aiRelatedItems.length} 条AI相关内容`);

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
    item.category = category;
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

  // 直接使用新抓取的数据，不与旧数据合并
  const dataPath = path.join(__dirname, '../data/news.json');
  const newData = {
    lastUpdated: new Date().toISOString(),
    items: selectedItems,
    history: selectedItems
  };

  fs.writeFileSync(dataPath, JSON.stringify(newData, null, 2), 'utf-8');

  // 同时复制到public目录供网页访问
  const publicDataPath = path.join(__dirname, '../public/data/news.json');
  const publicDir = path.dirname(publicDataPath);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  fs.writeFileSync(publicDataPath, JSON.stringify(newData, null, 2), 'utf-8');

  console.log('完成！保存了', selectedItems.length, '条内容');
  console.log('\n最新的新闻（按类别）:');

  // 按类别显示
  const chipItems = selectedItems.filter(item => item.category === 'ai-chip');
  const hardwareItems = selectedItems.filter(item => item.category === 'ai-hardware');
  const otherItems = selectedItems.filter(item => item.category === 'ai-other');

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

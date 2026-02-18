// 加载环境变量
require('dotenv').config();

const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

// RSS数据源配置 - 聚焦AI芯片
const RSS_FEEDS = [
  // === 芯片专业媒体（核心源）===
  { url: 'https://chipsandcheese.com/feed/', name: 'Chips and Cheese', type: 'news' },
  { url: 'https://www.anandtech.com/rss/', name: 'AnandTech', type: 'news' },
  { url: 'https://rsshub.app/semianalysis', name: 'SemiAnalysis', type: 'news' },
  { url: 'https://www.tomshardware.com/feeds/all', name: 'Tom\'s Hardware', type: 'news' },
  { url: 'https://www.eetimes.com/feed/', name: 'EE Times', type: 'news' },

  // === 国际主流科技媒体（芯片报道）===
  { url: 'https://www.reuters.com/technology/artificial-intelligence/rss', name: 'Reuters AI', type: 'news' },
  { url: 'https://www.technologyreview.com/feed/', name: 'MIT Tech Review', type: 'news' },
  { url: 'https://www.wired.com/feed/tag/ai/latest/rss', name: 'Wired AI', type: 'news' },
  { url: 'https://techcrunch.com/tag/artificial-intelligence/feed/', name: 'TechCrunch AI', type: 'news' },
  { url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', name: 'The Verge AI', type: 'news' },
  { url: 'https://venturebeat.com/category/ai/feed/', name: 'VentureBeat AI', type: 'news' },
  { url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', name: 'Ars Technica', type: 'news' },

  // === 芯片公司官方博客 ===
  { url: 'https://blogs.nvidia.com/feed/', name: 'Nvidia Blog', type: 'news' },
  { url: 'https://blog.google/technology/ai/rss/', name: 'Google AI Blog', type: 'news' },
  { url: 'https://community.amd.com/t5/blogs/rss', name: 'AMD Blog', type: 'news' },

  // === 学术/研究源（芯片架构）===
  { url: 'https://export.arxiv.org/rss/cs.AR', name: 'arXiv Computer Architecture', type: 'news' },
  { url: 'https://export.arxiv.org/rss/cs.AI', name: 'arXiv AI Papers', type: 'news' },

  // === 中文芯片媒体 ===
  { url: 'https://rsshub.app/jiqizhixin/latest', name: '机器之心', type: 'news' },
  { url: 'https://rsshub.app/36kr/newsflashes', name: '36氪快讯', type: 'news' },
  { url: 'https://rsshub.app/qbitai', name: '量子位', type: 'news' },
  { url: 'https://rsshub.app/ai-era', name: '新智元', type: 'news' },
  { url: 'https://rsshub.app/leiphone/category/ai', name: 'AI科技评论', type: 'news' },
];

// AI芯片核心关键词 - 必须同时包含AI相关和芯片相关
const AI_KEYWORDS = [
  'artificial intelligence', 'AI', 'machine learning', 'deep learning',
  'neural network', 'transformer', 'llm', 'large language model',
  'ai training', 'ai inference', 'generative ai',
  '人工智能', '机器学习', '深度学习', '神经网络', '大模型'
];

const CHIP_KEYWORDS = [
  // === 芯片厂商/产品系列 ===
  'nvidia', 'amd', 'intel', 'google tpu', 'tesla dojo', 'groq', 'cerebras',
  'graphcore', 'sambanova', 'tenstorrent', 'habana', 'gaudi', 'inferentia',
  'trainium', 'qualcomm', 'mediatek', 'apple neural engine',
  '英伟达', 'AMD', '英特尔', '高通', '联发科',

  // === 芯片架构/代号 ===
  'hopper', 'ampere', 'blackwell', 'ada lovelace', 'grace', 'tensor core',
  'cuda core', 'streaming multiprocessor', 'nvlink', 'infinity fabric',
  'mi300', 'mi250', 'rdna', 'cdna', 'xeon', 'gaudi2', 'gaudi3',

  // === 芯片类型/技术 ===
  'gpu', 'tpu', 'npu', 'asic', 'fpga', 'ai chip', 'ai accelerator',
  'neural processor', 'tensor processor', 'inference chip', 'training chip',
  'dpu', 'vpu', 'edge ai chip',
  'GPU', 'TPU', 'NPU', 'AI芯片', 'AI加速器', '推理芯片', '训练芯片',

  // === 芯片架构/设计 ===
  'chip architecture', 'chip design', 'processor architecture', 'silicon',
  'die size', 'transistor', 'core count', 'compute unit', 'shader',
  'memory hierarchy', 'cache', 'register file', 'instruction set',
  '芯片架构', '芯片设计', '处理器架构', '晶体管',

  // === 性能参数 ===
  'benchmark', 'performance', 'throughput', 'latency', 'tops', 'tflops',
  'petaflops', 'bandwidth', 'memory bandwidth', 'compute power',
  'power efficiency', 'perf per watt', 'tco', 'cost per inference',
  '性能', '算力', '吞吐量', '延迟', '功耗', '能效',

  // === 内存技术 ===
  'hbm', 'hbm2', 'hbm3', 'gddr', 'memory capacity', 'vram',
  'unified memory', 'coherent memory', 'memory pool',

  // === 制造工艺 ===
  'process node', 'fabrication', '7nm', '5nm', '4nm', '3nm', '2nm',
  'tsmc', 'samsung foundry', 'intel foundry', 'gaafet', 'finfet',
  'euv', 'lithography', 'wafer', 'yield',
  '制程', '工艺', '台积电', '三星晶圆', '光刻',

  // === 互连技术 ===
  'interconnect', 'pcie', 'cxl', 'ucie', 'chiplet', 'ucpkg',
  'serdes', 'network-on-chip', 'infinity fabric', 'nvlink',

  // === 软件生态 ===
  'cuda', 'rocm', 'oneapi', 'triton', 'tensorrt', 'xla', 'mlir',
  'compiler', 'runtime', 'driver', 'sdk',

  // === 应用场景 ===
  'datacenter', 'data center', 'edge computing', 'inference',
  'model training', 'distributed training', 'cloud ai',
  '数据中心', '边缘计算', '云端训练', '推理加速'
];

// 分类关键词
const TRAINING_CHIP_KEYWORDS = [
  'training', 'h100', 'h200', 'mi300x', 'tpu v5', 'gaudi3',
  'dojo', 'distributed training', 'scale-out', 'multi-gpu',
  '训练芯片', '训练加速', '分布式训练'
];

const INFERENCE_CHIP_KEYWORDS = [
  'inference', 'inferentia', 'groq', 'qualcomm cloud ai',
  'edge inference', 'deployment', 'serving', 'low latency',
  '推理芯片', '推理加速', '边缘推理'
];

const ARCHITECTURE_INNOVATION_KEYWORDS = [
  'architecture', 'new design', 'innovation', 'breakthrough',
  'chiplet', ' 3d stacking', 'heterogeneous', 'specialized',
  'novel', 'next-gen', 'revolutionary',
  '架构创新', '新架构', '突破', '创新设计'
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

// 判断是否AI芯片相关 - 必须同时包含AI和芯片关键词
function isAIChipRelated(text) {
  const lowerText = text.toLowerCase();
  const hasAI = AI_KEYWORDS.some(keyword => lowerText.includes(keyword.toLowerCase()));
  const hasChip = CHIP_KEYWORDS.some(keyword => lowerText.includes(keyword.toLowerCase()));
  return hasAI && hasChip;
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

// 分类函数 - AI芯片细分类别
function categorizeItem(item) {
  const text = `${item.title} ${item.description}`.toLowerCase();

  // 检查训练芯片相关
  if (TRAINING_CHIP_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()))) {
    return 'training-chip';
  }

  // 检查推理芯片相关
  if (INFERENCE_CHIP_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()))) {
    return 'inference-chip';
  }

  // 检查架构创新相关
  if (ARCHITECTURE_INNOVATION_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()))) {
    return 'architecture';
  }

  // 其他AI芯片相关
  return 'chip-other';
}

// 主函数
async function main() {
  console.log('开始抓取RSS feeds - 聚焦AI芯片...');
  console.log('✅ 使用AI+芯片双关键词匹配（无翻译功能）');

  // 抓取所有RSS源
  const allFeeds = await Promise.all(RSS_FEEDS.map(feed => fetchFeed(feed)));
  let allItems = allFeeds.flat();

  console.log(`总共获取到 ${allItems.length} 条内容`);

  // 过滤出AI芯片相关的内容（必须同时包含AI和芯片关键词）
  console.log('开始AI芯片相关性过滤...');
  const aiChipItems = allItems.filter(item => {
    const textToClassify = `${item.title} ${item.description}`;
    return isAIChipRelated(textToClassify);
  });

  console.log(`筛选出 ${aiChipItems.length} 条AI芯片相关内容`);

  // 按发布时间排序（从新到旧）
  aiChipItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  // 严格限制：只保留过去48小时的新闻（硬性上限）
  const fortyEightHoursAgo = new Date();
  fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

  const finalItems = aiChipItems.filter(item => {
    const itemDate = new Date(item.pubDate);
    return itemDate > fortyEightHoursAgo;
  });

  console.log(`过滤48小时: 从 ${aiChipItems.length} 条筛选出 ${finalItems.length} 条最新内容`);

  // 注意：宁可显示少于15条，也不显示超过48小时的旧新闻
  if (finalItems.length < 15) {
    console.log(`⚠️  48小时内只有 ${finalItems.length} 条AI芯片新闻，将只显示这些新闻（不会补充旧新闻）`);
  }

  // 对内容进行分类
  console.log('开始按类别分类新闻...');
  const categorizedItems = {
    'training-chip': [],
    'inference-chip': [],
    'architecture': [],
    'chip-other': []
  };

  for (const item of finalItems) {
    const category = categorizeItem(item);
    categorizedItems[category].push(item);
    item.category = category;
  }

  console.log(`分类结果:`);
  console.log(`  训练芯片: ${categorizedItems['training-chip'].length} 条`);
  console.log(`  推理芯片: ${categorizedItems['inference-chip'].length} 条`);
  console.log(`  架构创新: ${categorizedItems['architecture'].length} 条`);
  console.log(`  其他芯片: ${categorizedItems['chip-other'].length} 条`);

  // 按配额选取新闻（各类别尽量均衡，总计15条）
  const selectedItems = [
    ...categorizedItems['training-chip'].slice(0, 5),   // 训练芯片：最多5条
    ...categorizedItems['inference-chip'].slice(0, 5),  // 推理芯片：最多5条
    ...categorizedItems['architecture'].slice(0, 5),    // 架构创新：最多5条
    ...categorizedItems['chip-other'].slice(0, 5)       // 其他芯片：最多5条
  ];

  // 如果某个类别不足，从其他类别补充（但只从48小时内的数据补充）
  const deficit = 15 - selectedItems.length;
  if (deficit > 0 && selectedItems.length > 0) {
    console.log(`总数不足15条，尝试从48小时内其他AI芯片新闻补充 ${deficit} 条`);
    const remainingItems = finalItems.filter(item => !selectedItems.includes(item));
    const supplementItems = remainingItems.slice(0, deficit);
    selectedItems.push(...supplementItems);
    console.log(`实际补充了 ${supplementItems.length} 条`);
  }

  // 按发布时间重新排序
  selectedItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  console.log(`\n最终选取 ${selectedItems.length} 条AI芯片新闻`);

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

  console.log('完成！保存了', selectedItems.length, '条AI芯片新闻');
  console.log('\n最新的AI芯片新闻（按类别）:');

  // 按类别显示
  const trainingItems = selectedItems.filter(item => item.category === 'training-chip');
  const inferenceItems = selectedItems.filter(item => item.category === 'inference-chip');
  const architectureItems = selectedItems.filter(item => item.category === 'architecture');
  const otherChipItems = selectedItems.filter(item => item.category === 'chip-other');

  console.log('\n🎓 训练芯片 (' + trainingItems.length + '条):');
  trainingItems.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.title} (${item.source})`);
  });

  console.log('\n⚡ 推理芯片 (' + inferenceItems.length + '条):');
  inferenceItems.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.title} (${item.source})`);
  });

  console.log('\n🏗️ 架构创新 (' + architectureItems.length + '条):');
  architectureItems.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.title} (${item.source})`);
  });

  console.log('\n💻 其他芯片 (' + otherChipItems.length + '条):');
  otherChipItems.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.title} (${item.source})`);
  });
}

// 运行
main().catch(error => {
  console.error('发生错误:', error);
  process.exit(1);
});

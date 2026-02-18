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

  // === 学术/研究源（芯片架构和硬件）===
  { url: 'https://export.arxiv.org/rss/cs.AR', name: 'arXiv Hardware Architecture', type: 'news' },
  { url: 'https://export.arxiv.org/rss/cs.PF', name: 'arXiv Performance', type: 'news' },

  // === 中文芯片媒体 ===
  { url: 'https://rsshub.app/jiqizhixin/latest', name: '机器之心', type: 'news' },
  { url: 'https://rsshub.app/36kr/newsflashes', name: '36氪快讯', type: 'news' },
  { url: 'https://rsshub.app/qbitai', name: '量子位', type: 'news' },
  { url: 'https://rsshub.app/ai-era', name: '新智元', type: 'news' },
  { url: 'https://rsshub.app/leiphone/category/ai', name: 'AI科技评论', type: 'news' },
];

// AI推理核心关键词 - 聚焦推理，排除训练
const AI_KEYWORDS = [
  // 通用AI（基础）
  'artificial intelligence', 'AI', 'neural network', 'neural',

  // 推理相关（核心）
  'inference', 'ai inference', 'model inference', 'neural inference',
  'inferencing', 'inference engine', 'inference accelerator',
  'serving', 'model serving', 'deployment', 'model deployment',
  'edge ai', 'edge inference', 'real-time ai', 'real-time inference',

  // 推理性能指标
  'latency', 'throughput', 'inference speed', 'inference performance',
  'tokens per second', 'inference optimization', 'low latency',

  // 推理相关模型
  'llm', 'large language model', 'transformer', 'transformer inference',
  'generative ai', 'gen ai', 'chatgpt', 'llm serving', 'llm deployment',
  'model quantization', 'quantized model', 'pruning', 'distillation',

  // 中文推理关键词
  '推理', 'AI推理', '模型推理', '推理加速', '推理性能', '推理优化',
  '模型部署', '模型服务', '边缘推理', '边缘AI', '实时推理',
  '推理延迟', '推理吞吐', '模型量化', '人工智能', '神经网络', '大模型'
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

// 分类关键词 - 聚焦推理场景
const CLOUD_INFERENCE_KEYWORDS = [
  'datacenter inference', 'cloud inference', 'server inference',
  'h100', 'h200', 'l40', 'l4', 'a100', 'inferentia', 'trainium',
  'gaudi', 'gaudi2', 'gaudi3', 'mi300', 'groq lpu',
  'cloud ai', 'datacenter ai', '云端推理', '数据中心推理'
];

const EDGE_INFERENCE_KEYWORDS = [
  'edge inference', 'edge ai', 'edge computing', 'edge device',
  'mobile ai', 'on-device', 'embedded ai', 'iot ai',
  'qualcomm', 'snapdragon', 'mediatek', 'apple neural engine',
  'jetson', 'coral', 'movidius', 'hailo',
  '边缘推理', '边缘AI', '端侧AI', '移动AI', '嵌入式AI'
];

const INFERENCE_OPTIMIZATION_KEYWORDS = [
  'quantization', 'pruning', 'distillation', 'compression',
  'optimization', 'acceleration', 'tensorrt', 'openvino',
  'model optimization', 'inference optimization', 'int8', 'fp16',
  'sparse', 'low-bit', 'efficient inference',
  '量化', '剪枝', '压缩', '优化', '加速', '模型压缩'
];

const ARCHITECTURE_INNOVATION_KEYWORDS = [
  'architecture', 'new design', 'innovation', 'breakthrough',
  'chiplet', '3d stacking', 'heterogeneous', 'specialized',
  'novel', 'next-gen', 'revolutionary', 'systolic array',
  'transformer engine', 'attention accelerator',
  '架构创新', '新架构', '突破', '创新设计', '异构计算'
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

// 检测文本是否为中文
function isChinese(text) {
  if (!text) return false;
  // 检测是否包含中文字符
  return /[\u4e00-\u9fa5]/.test(text);
}

// 使用MyMemory API翻译文本（英译中）
async function translateToZh(text) {
  if (!text || text.trim().length === 0) {
    return text;
  }

  // 如果已经是中文，直接返回
  if (isChinese(text)) {
    console.log('检测到中文内容，跳过翻译');
    return text;
  }

  // 限制翻译长度，避免API超时
  // 摘要翻译：前800字符，足够显示约10行中文
  const maxLength = 800;
  let textToTranslate = text;
  let isTruncated = false;

  if (text.length > maxLength) {
    // 尝试在句子边界截断
    const truncated = text.substring(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastPeriod > maxLength * 0.7) {
      textToTranslate = text.substring(0, lastPeriod + 1);
    } else if (lastSpace > maxLength * 0.7) {
      textToTranslate = text.substring(0, lastSpace);
    } else {
      textToTranslate = truncated;
    }
    isTruncated = true;
  }

  try {
    const encodedText = encodeURIComponent(textToTranslate);
    const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|zh-CN`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`MyMemory翻译API返回错误 (${response.status})`);
      return text; // 失败时返回原文
    }

    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
      let translated = data.responseData.translatedText;

      // 如果原文被截断，添加省略号
      if (isTruncated) {
        translated += '...';
      }

      console.log(`✓ 翻译: ${textToTranslate.substring(0, 40)}... → ${translated.substring(0, 40)}...`);
      return translated;
    } else {
      console.error('MyMemory翻译API返回格式错误:', data);
      return text; // 失败时返回原文
    }
  } catch (error) {
    console.error('翻译失败:', error.message);
    return text; // 失败时返回原文
  }
}

// 延迟函数，避免API限流
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

// 分类函数 - AI推理芯片细分类别
function categorizeItem(item) {
  const text = `${item.title} ${item.description}`.toLowerCase();

  // 检查云端推理芯片
  if (CLOUD_INFERENCE_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()))) {
    return 'cloud-inference';
  }

  // 检查边缘推理芯片
  if (EDGE_INFERENCE_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()))) {
    return 'edge-inference';
  }

  // 检查推理优化技术
  if (INFERENCE_OPTIMIZATION_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()))) {
    return 'inference-optimization';
  }

  // 检查架构创新
  if (ARCHITECTURE_INNOVATION_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()))) {
    return 'architecture';
  }

  // 其他AI推理相关
  return 'inference-other';
}

// 主函数
async function main() {
  console.log('开始抓取RSS feeds - 聚焦AI推理芯片...');
  console.log('✅ 使用AI推理+芯片双关键词匹配（排除训练相关）');

  // 抓取所有RSS源
  const allFeeds = await Promise.all(RSS_FEEDS.map(feed => fetchFeed(feed)));
  let allItems = allFeeds.flat();

  console.log(`总共获取到 ${allItems.length} 条内容`);

  // 过滤出AI推理芯片相关的内容（必须同时包含AI推理和芯片关键词）
  console.log('开始AI推理芯片相关性过滤...');
  const aiChipItems = allItems.filter(item => {
    const textToClassify = `${item.title} ${item.description}`;
    return isAIChipRelated(textToClassify);
  });

  console.log(`筛选出 ${aiChipItems.length} 条AI推理芯片相关内容`);

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
    console.log(`⚠️  48小时内只有 ${finalItems.length} 条AI推理芯片新闻，将只显示这些新闻（不会补充旧新闻）`);
  }

  // 对内容进行分类
  console.log('开始按推理场景分类新闻...');
  const categorizedItems = {
    'cloud-inference': [],
    'edge-inference': [],
    'inference-optimization': [],
    'architecture': [],
    'inference-other': []
  };

  for (const item of finalItems) {
    const category = categorizeItem(item);
    categorizedItems[category].push(item);
    item.category = category;
  }

  console.log(`分类结果:`);
  console.log(`  云端推理: ${categorizedItems['cloud-inference'].length} 条`);
  console.log(`  边缘推理: ${categorizedItems['edge-inference'].length} 条`);
  console.log(`  推理优化: ${categorizedItems['inference-optimization'].length} 条`);
  console.log(`  架构创新: ${categorizedItems['architecture'].length} 条`);
  console.log(`  其他推理: ${categorizedItems['inference-other'].length} 条`);

  // 按配额选取新闻（各类别尽量均衡，总计15条）
  const selectedItems = [
    ...categorizedItems['cloud-inference'].slice(0, 5),        // 云端推理：最多5条
    ...categorizedItems['edge-inference'].slice(0, 4),         // 边缘推理：最多4条
    ...categorizedItems['inference-optimization'].slice(0, 3), // 推理优化：最多3条
    ...categorizedItems['architecture'].slice(0, 3),           // 架构创新：最多3条
    ...categorizedItems['inference-other'].slice(0, 3)         // 其他推理：最多3条
  ];

  // 如果某个类别不足，从其他类别补充（但只从48小时内的数据补充）
  const deficit = 15 - selectedItems.length;
  if (deficit > 0 && selectedItems.length > 0) {
    console.log(`总数不足15条，尝试从48小时内其他AI推理新闻补充 ${deficit} 条`);
    const remainingItems = finalItems.filter(item => !selectedItems.includes(item));
    const supplementItems = remainingItems.slice(0, deficit);
    selectedItems.push(...supplementItems);
    console.log(`实际补充了 ${supplementItems.length} 条`);
  }

  // 按发布时间重新排序
  selectedItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  console.log(`\n最终选取 ${selectedItems.length} 条AI推理芯片新闻`);

  // 翻译所有选中的新闻
  console.log('\n开始翻译新闻（英译中）...');
  for (let i = 0; i < selectedItems.length; i++) {
    const item = selectedItems[i];
    console.log(`\n[${i + 1}/${selectedItems.length}] 翻译: ${item.title.substring(0, 60)}...`);

    // 翻译标题
    if (item.title && !isChinese(item.title)) {
      item.titleZh = await translateToZh(item.title);
      await delay(300); // 延迟300ms避免限流
    } else {
      item.titleZh = item.title; // 已是中文，保留原文
    }

    // 翻译描述（摘要）
    if (item.description && !isChinese(item.description)) {
      item.descriptionZh = await translateToZh(item.description);
      await delay(300); // 延迟300ms避免限流
    } else {
      item.descriptionZh = item.description; // 已是中文，保留原文
    }
  }

  console.log('\n✅ 翻译完成！');

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

  console.log('完成！保存了', selectedItems.length, '条AI推理芯片新闻');
  console.log('\n最新的AI推理芯片新闻（按场景）:');

  // 按类别显示
  const cloudItems = selectedItems.filter(item => item.category === 'cloud-inference');
  const edgeItems = selectedItems.filter(item => item.category === 'edge-inference');
  const optimizationItems = selectedItems.filter(item => item.category === 'inference-optimization');
  const architectureItems = selectedItems.filter(item => item.category === 'architecture');
  const otherInferenceItems = selectedItems.filter(item => item.category === 'inference-other');

  console.log('\n☁️ 云端推理 (' + cloudItems.length + '条):');
  cloudItems.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.title} (${item.source})`);
  });

  console.log('\n📱 边缘推理 (' + edgeItems.length + '条):');
  edgeItems.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.title} (${item.source})`);
  });

  console.log('\n⚡ 推理优化 (' + optimizationItems.length + '条):');
  optimizationItems.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.title} (${item.source})`);
  });

  console.log('\n🏗️ 架构创新 (' + architectureItems.length + '条):');
  architectureItems.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.title} (${item.source})`);
  });

  console.log('\n💡 其他推理 (' + otherInferenceItems.length + '条):');
  otherInferenceItems.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.title} (${item.source})`);
  });
}

// 运行
main().catch(error => {
  console.error('发生错误:', error);
  process.exit(1);
});

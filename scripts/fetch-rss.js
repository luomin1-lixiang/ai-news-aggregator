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
  { url: 'https://www.bloomberg.com/technology/feed', name: 'Bloomberg Technology', type: 'news' },
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

// 列出可用的Gemini模型（调试用）
async function listAvailableModels(apiKey) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    console.log('可用的Gemini模型:');
    if (data.models) {
      data.models.forEach(model => {
        console.log(`  - ${model.name} (支持方法: ${model.supportedGenerationMethods?.join(', ')})`);
      });
    }
    return data.models || [];
  } catch (error) {
    console.error('获取模型列表失败:', error.message);
    return [];
  }
}

// 使用DeepSeek API生成AI摘要（英译中）- 带重试机制
async function generateAISummary(text, isTitle = false, retries = 3) {
  if (!text || text.trim().length === 0) {
    return text;
  }

  // 如果已经是中文，直接返回
  if (isChinese(text)) {
    console.log('检测到中文内容，跳过AI处理');
    return text;
  }

  // 获取DeepSeek API Key
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('未配置DEEPSEEK_API_KEY，返回原文');
    return text;
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // 使用 DeepSeek API (OpenAI兼容格式)
      const url = 'https://api.deepseek.com/v1/chat/completions';

      // 根据是否是标题设置不同的prompt
      const systemPrompt = isTitle
        ? '你是专业的英中翻译助手。只需翻译标题，不要添加任何说明或前缀。'
        : '你是专业的AI芯片新闻编辑。阅读英文新闻后，生成完整的中文摘要。要求：1) 完整介绍背景和上下文 2) 详细解释核心技术原理和创新点 3) 分析性能参数、对比数据 4) 阐述技术影响和应用场景 5) 语言专业但易懂。摘要长度根据原文内容自然确定，无需限制字数。直接输出摘要，不要添加"摘要："等前缀。';

      const userPrompt = isTitle
        ? `翻译这个标题：${text}`
        : `请为以下英文新闻生成完整的中文摘要（长度根据原文内容自然确定）：\n\n${text}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-reasoner',
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

        // 如果是429或503错误，尝试重试
        if ((status === 429 || status === 503) && attempt < retries - 1) {
          const waitTime = Math.pow(2, attempt) * 5000; // 指数退避：5s, 10s, 20s
          console.log(`⚠️  API限流/繁忙 (${status})，${waitTime/1000}秒后重试 (第${attempt + 1}次)...`);
          await delay(waitTime);
          continue; // 继续下一次尝试
        }

        console.error(`DeepSeek API返回错误 (${status}): ${errorText}`);
        return text;
      }

      const data = await response.json();

      // DeepSeek API响应格式（OpenAI兼容）
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const choice = data.choices[0];
        const summary = choice.message.content.trim();
        const charCount = summary.length;
        const finishReason = choice.finish_reason;

        console.log(`✓ DeepSeek${isTitle ? '翻译' : '摘要'}(${charCount}字, ${finishReason}): ${text.substring(0, 30)}... → ${summary.substring(0, 50)}...`);

        // 检查是否被截断
        if (!isTitle && charCount < 300) {
          console.warn(`⚠️  摘要过短(${charCount}字)，finishReason: ${finishReason}`);
        }

        // 如果因为长度限制被截断，警告但仍返回
        if (finishReason === 'length') {
          console.warn(`⚠️  输出达到长度限制，内容可能不完整`);
        }

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

  return text; // 所有重试都失败，返回原文
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

  // 调试：列出可用的Gemini模型
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    console.log('\n检查可用的Gemini模型...');
    await listAvailableModels(apiKey);
    console.log('');
  }

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

  // 翻译所有选中的新闻（使用DeepSeek AI生成摘要）
  // 付费用户优化：批量并发处理，控制并发数避免过载
  console.log('\n开始生成AI摘要（英译中）...');
  console.log('💎 检测到DeepSeek付费用户模式：使用批量并发处理');

  const CONCURRENT_BATCH_SIZE = 5; // 每批并发5个请求

  // 批量处理函数：将数组分批并发处理
  async function processBatch(items, processor, batchSize) {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      console.log(`\n处理第 ${Math.floor(i / batchSize) + 1} 批 (${batch.length}条)...`);
      const batchResults = await Promise.all(batch.map(processor));
      results.push(...batchResults);
      // 批次间短暂延迟，避免瞬时过载
      if (i + batchSize < items.length) {
        await delay(500);
      }
    }
    return results;
  }

  // 第一阶段：批量翻译所有标题
  console.log('\n📝 阶段1：批量翻译标题...');
  const titleTasks = selectedItems
    .filter(item => item.title && !isChinese(item.title))
    .map((item, index) => ({
      item,
      index,
      text: item.title
    }));

  if (titleTasks.length > 0) {
    await processBatch(
      titleTasks,
      async (task) => {
        const translated = await generateAISummary(task.text, true);
        task.item.titleZh = translated;
        console.log(`  ✓ [${task.index + 1}] ${task.text.substring(0, 40)}... → ${translated.substring(0, 30)}...`);
        return translated;
      },
      CONCURRENT_BATCH_SIZE
    );
  }

  // 为已是中文的标题设置titleZh
  selectedItems.forEach(item => {
    if (!item.titleZh) {
      item.titleZh = item.title;
    }
  });

  // 第二阶段：批量生成所有摘要
  console.log('\n📄 阶段2：批量生成摘要...');
  const summaryTasks = selectedItems
    .map((item, index) => {
      const sourceText = item.content || item.description || '';
      return {
        item,
        index,
        text: sourceText,
        needsTranslation: sourceText && !isChinese(sourceText)
      };
    })
    .filter(task => task.needsTranslation);

  if (summaryTasks.length > 0) {
    await processBatch(
      summaryTasks,
      async (task) => {
        const summary = await generateAISummary(task.text, false);
        task.item.descriptionZh = summary;
        console.log(`  ✓ [${task.index + 1}] 摘要生成完成 (${summary.length}字)`);
        return summary;
      },
      CONCURRENT_BATCH_SIZE
    );
  }

  // 为已是中文的内容设置descriptionZh
  selectedItems.forEach(item => {
    if (!item.descriptionZh) {
      item.descriptionZh = item.description || item.content || '';
    }
  });

  console.log('\n✅ AI摘要生成完成！');

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

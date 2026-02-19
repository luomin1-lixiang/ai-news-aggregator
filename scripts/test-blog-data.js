// 临时脚本：生成测试博客数据
const fs = require('fs');
const path = require('path');

const anthropicData = {
  lastUpdated: new Date().toISOString(),
  items: [
    {
      title: "Introducing Claude 3.5 Sonnet",
      titleZh: "Claude 3.5 Sonnet 发布",
      link: "https://www.anthropic.com/news/claude-3-5-sonnet",
      description: "We're announcing Claude 3.5 Sonnet, the first model in our Claude 3.5 family.",
      descriptionZh: "我们宣布推出Claude 3.5 Sonnet，这是我们Claude 3.5系列的第一个模型。这个新模型在多项基准测试中超越了之前的所有版本，展现出卓越的推理能力、代码生成能力和多语言理解能力。Claude 3.5 Sonnet在处理复杂任务时表现出色，特别是在需要深度分析和创造性思维的场景中。该模型经过大规模训练和精心调优，能够更好地理解上下文、遵循指令，并生成高质量的输出。在安全性方面，我们继续坚持负责任AI开发的原则，确保模型的可靠性和可控性。",
      source: "Anthropic News",
      sourceType: "anthropic",
      category: "anthropic-blog",
      author: "Anthropic Team",
      pubDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
    },
    {
      title: "Constitutional AI: Building Safe AI Systems",
      titleZh: "宪法式AI：构建安全的AI系统",
      link: "https://www.anthropic.com/news/constitutional-ai",
      description: "Our latest research on training AI systems to be helpful, harmless, and honest.",
      descriptionZh: "我们最新的研究成果展示了如何训练AI系统使其更加有用、无害且诚实。宪法式AI（Constitutional AI）是一种创新的训练方法，通过明确定义的原则和价值观来指导AI的行为。这种方法的核心思想是让AI系统内化一套可审计的伦理准则，而不仅仅依赖外部过滤器。我们通过两个阶段的训练实现这一目标：首先通过监督学习让模型理解宪法原则，然后通过强化学习让模型在实际应用中遵循这些原则。实验结果表明，采用宪法式AI训练的模型在避免有害输出的同时，仍能保持高度的有用性和响应能力。",
      source: "Anthropic News",
      sourceType: "anthropic",
      category: "anthropic-blog",
      author: "Anthropic Research",
      pubDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
    }
  ]
};

const geminiData = {
  lastUpdated: new Date().toISOString(),
  items: [
    {
      title: "Gemini 1.5 Pro: Our Next-Generation AI Model",
      titleZh: "Gemini 1.5 Pro：我们的下一代AI模型",
      link: "https://blog.google/technology/ai/gemini-1-5-pro",
      description: "Introducing Gemini 1.5 Pro with breakthrough long context understanding.",
      descriptionZh: "今天，我们很高兴地宣布推出Gemini 1.5 Pro，这是我们下一代AI模型，具有突破性的长上下文理解能力。这个新模型可以处理高达100万tokens的上下文，这是之前模型能力的数十倍。这意味着它可以一次性分析整本书、处理数小时的视频内容，或者理解庞大的代码库。除了长上下文能力外，Gemini 1.5 Pro在多模态理解方面也取得了重大进展，能够无缝处理文本、图像、音频和视频的组合输入。在各项基准测试中，该模型展现出卓越的性能，特别是在需要复杂推理和跨模态理解的任务中。我们采用了全新的架构和训练方法，使模型更加高效、可靠。",
      source: "Google AI Blog",
      sourceType: "gemini",
      category: "gemini-blog",
      author: "Google AI Team",
      pubDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    },
    {
      title: "Responsible AI: Our Approach to Building Trustworthy Systems",
      titleZh: "负责任的AI：我们构建可信赖系统的方法",
      link: "https://blog.google/technology/ai/responsible-ai",
      description: "How we're ensuring our AI systems are safe, fair, and beneficial.",
      descriptionZh: "在Google，我们深知人工智能技术的巨大潜力及其带来的责任。本文详细介绍了我们在构建负责任AI系统方面的方法和实践。我们的工作围绕几个核心原则展开：首先是安全性，确保AI系统稳健可靠，不会造成意外伤害；其次是公平性，积极识别和减轻算法偏见，确保AI对所有人群都公平；第三是透明度，让用户理解AI系统的工作原理和局限性；最后是问责制，建立明确的治理框架和评估机制。我们投入大量资源开发了一系列工具和流程，包括公平性评估工具包、红队测试框架、以及严格的发布审查程序。同时，我们积极与学术界、产业界和公民社会合作，共同推动负责任AI标准的制定。",
      source: "Google AI Blog",
      sourceType: "gemini",
      category: "gemini-blog",
      author: "Google Research",
      pubDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
    }
  ]
};

// 保存数据
const anthropicPath = path.join(__dirname, '../data/anthropic-news.json');
const geminiPath = path.join(__dirname, '../data/gemini-news.json');
const publicAnthropicPath = path.join(__dirname, '../public/data/anthropic-news.json');
const publicGeminiPath = path.join(__dirname, '../public/data/gemini-news.json');

fs.writeFileSync(anthropicPath, JSON.stringify(anthropicData, null, 2), 'utf-8');
fs.writeFileSync(geminiPath, JSON.stringify(geminiData, null, 2), 'utf-8');
fs.writeFileSync(publicAnthropicPath, JSON.stringify(anthropicData, null, 2), 'utf-8');
fs.writeFileSync(publicGeminiPath, JSON.stringify(geminiData, null, 2), 'utf-8');

console.log('✅ 测试数据已生成');
console.log(`   Anthropic: ${anthropicData.items.length} 条`);
console.log(`   Gemini: ${geminiData.items.length} 条`);

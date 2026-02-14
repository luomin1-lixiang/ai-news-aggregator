# 新闻分类功能说明

## 📊 功能概述

新增智能分类功能，将AI新闻按主题自动分为三类，并按配额展示。

---

## 🎯 分类策略

### 分类1: AI芯片类 (5条)
**关键词**:
- 公司: NVIDIA, Google TPU, Tenstorrent, SambaNova, Groq, Tesla
- 产品: GPU, TPU, AI chip, AI accelerator, Dojo
- 技术: inference chip, training chip, tensor processing unit

**标签**: 💻 AI芯片
**颜色**: 紫色 (#667eea)

### 分类2: AI硬件类 (5条)
**关键词**:
- 基础设施: hardware, server, data center, datacenter
- 能源: power, energy, cooling
- 组件: processor, memory, storage, rack, infrastructure
- 其他: neural engine, edge device, robotics hardware, quantum computing

**标签**: 🔧 AI硬件
**颜色**: 橙色 (#f59e0b)

### 分类3: 其他AI类 (5条)
**包含**:
- AI应用、模型、软件
- AI公司动态、投资
- AI政策、伦理
- 其他AI相关新闻

**标签**: 🤖 AI资讯
**颜色**: 绿色 (#10b981)

---

## 📈 配额控制

### 目标配置
- **总数**: 15条新闻
- **AI芯片**: 5条
- **AI硬件**: 5条
- **其他AI**: 5条

### 不足处理
如果某个类别不足5条：
1. 尽量获取该类别的所有内容
2. 从其他类别补充
3. 确保总数接近15条

---

## 🔍 分类逻辑

### 优先级
1. **AI芯片** > AI硬件 > 其他AI
2. 一条新闻只属于一个类别
3. 匹配到AI芯片关键词 → 归类为AI芯片
4. 匹配到AI硬件关键词 → 归类为AI硬件
5. 其他AI内容 → 归类为其他AI

### 示例

**AI芯片类**:
```
"NVIDIA announces new H200 GPU for AI training"
→ 包含"nvidia"和"gpu" → AI芯片类
```

**AI硬件类**:
```
"Meta adds 100MW of solar power to its AI data center"
→ 包含"data center"和"power" → AI硬件类
```

**其他AI类**:
```
"OpenAI releases GPT-5 with improved reasoning"
→ 没有芯片/硬件关键词 → 其他AI类
```

---

## 💻 实现细节

### 后端处理 (scripts/fetch-rss.js)

```javascript
// 分类函数
function categorizeItem(item) {
  const text = `${item.title} ${item.description}`.toLowerCase();

  // 检查AI芯片相关
  if (AI_CHIP_KEYWORDS.some(keyword => text.includes(keyword))) {
    return 'ai-chip';
  }

  // 检查AI硬件相关
  if (AI_HARDWARE_KEYWORDS.some(keyword => text.includes(keyword))) {
    return 'ai-hardware';
  }

  // 其他AI相关
  return 'ai-other';
}

// 按配额选取
const selectedItems = [
  ...categorizedItems['ai-chip'].slice(0, 5),
  ...categorizedItems['ai-hardware'].slice(0, 5),
  ...categorizedItems['ai-other'].slice(0, 5)
];
```

### 前端展示 (pages/index.js)

```javascript
// 类别标签配置
const getCategoryLabel = (category) => {
  switch (category) {
    case 'ai-chip':
      return { text: 'AI芯片', icon: '💻', color: '#667eea' };
    case 'ai-hardware':
      return { text: 'AI硬件', icon: '🔧', color: '#f59e0b' };
    case 'ai-other':
      return { text: 'AI资讯', icon: '🤖', color: '#10b981' };
  }
};
```

每条新闻显示：
- 类别图标 (💻/🔧/🤖)
- 类别文字标签
- 对应颜色背景

---

## 📋 数据结构变化

### 新增字段

```json
{
  "title": "NVIDIA announces new GPU",
  "description": "...",
  "category": "ai-chip",    // 新增：类别标识
  "link": "https://...",
  ...
}
```

### 存储格式
- 每条新闻增加 `category` 字段
- 值为: `'ai-chip'` | `'ai-hardware'` | `'ai-other'`

---

## 🎨 前端效果

### 类别标签样式
- **位置**: 新闻头部，时间后面
- **样式**: 圆角矩形，半透明背景
- **内容**: 图标 + 文字
- **颜色**: 根据类别动态显示

### 示例

```
📰 TechCrunch AI • John Doe • 2小时前 • 💻 AI芯片

NVIDIA Announces New H200 GPU
------------------------------------------------
NVIDIA today announced its latest...
```

---

## 🔧 自定义配置

### 修改配额

在 `scripts/fetch-rss.js` 中修改:

```javascript
const selectedItems = [
  ...categorizedItems['ai-chip'].slice(0, 10),     // 改为10条
  ...categorizedItems['ai-hardware'].slice(0, 3),  // 改为3条
  ...categorizedItems['ai-other'].slice(0, 2)      // 改为2条
];
```

### 添加关键词

```javascript
const AI_CHIP_KEYWORDS = [
  'nvidia', 'tpu', 'groq',
  'cerebras',  // 新增关键词
  'graphcore'  // 新增关键词
];
```

### 调整优先级

修改 `categorizeItem()` 函数中的检查顺序。

---

## 📊 运行示例

### 控制台输出

```
开始按类别分类新闻...
分类结果:
  AI芯片类: 8 条
  AI硬件类: 6 条
  其他AI类: 8 条

最终选取 15 条新闻

最新的15条（按类别）:

📊 AI芯片类 (5条):
  1. NVIDIA announces H200 GPU (TechCrunch AI)
  2. Google expands TPU v5 availability (The Verge AI)
  3. Groq raises $640M for inference chips (TechCrunch AI)
  ...

🔧 AI硬件类 (5条):
  1. Meta adds 100MW solar power (TechCrunch AI)
  2. Microsoft builds new data centers (The Verge AI)
  ...

🤖 其他AI类 (5条):
  1. OpenAI releases GPT-5 (TechCrunch AI)
  2. Anthropic updates Claude (The Verge AI)
  ...
```

---

## ⚙️ 测试命令

```bash
# 运行抓取脚本
npm run fetch-news

# 检查分类结果
node -e "const data = require('./public/data/news.json'); \
  console.log('AI芯片:', data.items.filter(i => i.category === 'ai-chip').length); \
  console.log('AI硬件:', data.items.filter(i => i.category === 'ai-hardware').length); \
  console.log('其他AI:', data.items.filter(i => i.category === 'ai-other').length);"
```

---

## 🎯 优势

1. **精准定位** - 专注AI芯片和硬件领域
2. **平衡展示** - 各类别配额控制
3. **清晰分类** - 用户一眼识别内容类型
4. **灵活配置** - 易于调整关键词和配额
5. **智能降级** - 不足时自动补充

---

## 🔄 后续优化

### 可能的改进

1. **机器学习分类** - 使用ML模型替代关键词匹配
2. **动态配额** - 根据可用内容自动调整
3. **子分类** - AI芯片进一步细分(训练/推理/边缘)
4. **过滤选项** - 前端添加类别筛选按钮
5. **统计分析** - 展示各类别趋势图

---

**更新时间**: 2026-02-14
**功能状态**: ✅ 已实现，待测试

# API更新说明

## 2025年2月14日更新

### 问题描述

HuggingFace 免费 Inference API 端点已废弃，返回 410 Gone 错误：
```
{"error":"https://api-inference.huggingface.co is no longer supported. Please use https://router.hug..."}
```

### 解决方案

已将项目从依赖 HuggingFace API 改为使用本地关键词匹配方案。

### 具体修改

#### 1. AI分类功能
- **之前**: 使用 `facebook/bart-large-mnli` 模型进行零样本分类
- **现在**: 使用扩展的关键词列表进行匹配
- **优点**:
  - 不依赖外部API，更稳定
  - 响应速度更快
  - 无API调用限制
  - 成本为零

#### 2. 翻译功能
- **之前**: 使用 `Helsinki-NLP/opus-mt-en-zh` 模型翻译英文到中文
- **现在**: 直接使用原文（英文内容保持英文）
- **影响**:
  - 英文数据源将显示英文内容
  - 中文数据源不受影响
  - 可考虑未来添加其他翻译服务（如Google Translate API、DeepL等）

#### 3. 增强的关键词列表

新增了更多AI相关关键词，提高分类准确度：

**英文关键词**:
- 基础: AI, machine learning, deep learning, neural network
- 模型: GPT, BERT, Claude, Gemini, Copilot
- 技术: transformer, diffusion, reinforcement learning
- 框架: TensorFlow, PyTorch, Keras, LangChain
- 公司: OpenAI, Anthropic, DeepMind, HuggingFace

**中文关键词**:
- 人工智能, 机器学习, 深度学习, 神经网络
- 大模型, 大语言模型, 生成式AI
- 自然语言处理, 计算机视觉, 语音识别
- AI芯片, AI加速器

### 测试建议

1. 在 GitHub Actions 中重新运行 workflow
2. 检查日志输出，应该看到：
   ```
   注意：HuggingFace免费API已废弃，将使用关键词匹配方案
   处理内容翻译（当前使用原文，翻译功能已禁用）...
   ```
3. 验证生成的 `news.json` 文件包含正确的内容

### 后续优化方向

如果需要恢复翻译功能，可以考虑：

1. **Google Cloud Translation API**
   - 每月免费 500,000 字符
   - 质量高，支持多种语言
   - 需要配置 Google Cloud 账号

2. **DeepL API**
   - 每月免费 500,000 字符
   - 翻译质量非常好
   - 需要注册 DeepL 账号

3. **LibreTranslate**
   - 开源免费
   - 可自托管
   - 质量略低但完全免费

4. **微软 Azure Translator**
   - 每月免费 2,000,000 字符
   - 质量好，价格合理

### 兼容性

- ✅ 关键词匹配方案与所有数据源兼容
- ✅ 不需要配置 API Key
- ✅ GitHub Actions 无需修改
- ✅ 前端页面无需修改

### 影响评估

**正面影响**:
- 更稳定，不依赖可能变更的外部API
- 更快速，无网络延迟
- 完全免费，无API限制

**负面影响**:
- 分类准确度可能略低于AI模型
- 英文内容不再自动翻译为中文

**总体评价**: 对于个人和小规模使用，关键词匹配方案完全够用，且更加可靠。

---

**更新者**: Claude Opus 4.5
**更新日期**: 2025-02-14
**影响范围**: scripts/fetch-rss.js

# 翻译功能使用指南

## 功能说明

新增功能：使用HuggingFace的免费翻译模型自动将英文内容翻译成中文。

### 翻译模型

- **模型**: Helsinki-NLP/opus-mt-en-zh
- **类型**: 英译中专用模型
- **成本**: 完全免费（有调用限制）
- **质量**: 中等，适合新闻摘要翻译

---

## 如何启用翻译功能

### 方法1: 使用HuggingFace API（推荐）

**步骤**:

1. 注册HuggingFace账号（如果还没有）
   - 访问: https://huggingface.co/join
   - 填写邮箱和密码注册

2. 获取API Token
   - 登录后点击右上角头像 → Settings
   - 左侧菜单选择 "Access Tokens"
   - 点击 "New token"
   - 名称填写: `AI News Translator`
   - 权限选择: **Read**（只读）
   - 点击 "Generate token"
   - **立即复制token**（只显示一次！）

3. 配置环境变量

   **本地测试**:
   ```bash
   # Windows (PowerShell)
   cd ai-news-aggregator
   echo HUGGINGFACE_API_KEY=你的token > .env

   # 或者手动创建 .env 文件，内容如下：
   HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx
   ```

   **GitHub部署**:
   - 在GitHub仓库: Settings → Secrets → Actions
   - 点击 "New repository secret"
   - Name: `HUGGINGFACE_API_KEY`
   - Value: 粘贴你的token
   - 点击 "Add secret"

4. 运行测试
   ```bash
   npm run fetch-news
   ```

   你会看到类似输出：
   ```
   开始翻译英文内容到中文...
   翻译标题: What's behind the mass exodus at xAI?...
   翻译描述: The past few days have been a wild ride...
   翻译完成！
   ```

---

### 方法2: 不配置API（降级方案）

如果不配置HuggingFace API Key：
- ❌ 不会进行翻译
- ✅ 保留原文显示
- ✅ 其他功能正常工作

---

## 功能特点

### 智能语言检测

- 自动检测内容语言（中文/英文）
- 如果内容已包含30%以上中文，跳过翻译
- 节省API调用次数

### 失败降级

- 如果翻译API调用失败，自动使用原文
- 不影响数据抓取流程
- 确保系统稳定性

### 长度限制

- 标题：全文翻译
- 描述：限制500字符（避免超时）
- 优化翻译速度和成功率

### 调用延迟

- 每次翻译间隔500ms
- 避免触发API频率限制
- 确保稳定性

---

## 翻译效果示例

### 示例1: 标题翻译

**原文**:
```
What's behind the mass exodus at xAI?
```

**翻译后**:
```
xAI大规模人员流失背后的原因是什么？
```

### 示例2: 描述翻译

**原文**:
```
The past few days have been a wild ride for xAI, which is racking up
staff and cofounder departure announcements left and right.
```

**翻译后**:
```
过去几天对xAI来说是一段疯狂的旅程，员工和联合创始人纷纷离职的消息接连不断。
```

---

## API调用限制

HuggingFace免费API限制：

- **调用频率**: 每分钟约30次
- **每日限额**: 约1000次
- **延迟**: 通常1-3秒/请求

**我们的优化**:
- 每次翻译间隔500ms（每分钟最多120次，但实际更少）
- 智能跳过中文内容
- 限制描述长度
- 失败自动降级

**预计消耗**:
- 每天抓取10-20条英文内容
- 每条需要2次翻译（标题+描述）
- **总计: 20-40次/天**
- **远低于限额**

---

## 成本分析

| 方案 | 成本 | 翻译质量 | 速度 |
|------|------|----------|------|
| HuggingFace免费API | **$0/月** | 中等 | 1-3秒/条 |
| 不翻译（原文） | $0/月 | N/A | 即时 |

---

## 故障排查

### 问题1: "未配置HuggingFace API Key"

**原因**: 没有设置环境变量

**解决方案**:
1. 确认`.env`文件存在且包含正确的key
2. 重新运行`npm run fetch-news`

### 问题2: "翻译API调用失败"

**可能原因**:
- API Key错误或过期
- API调用频率过快
- 网络问题

**解决方案**:
1. 检查API Key是否正确
2. 等待1分钟后重试
3. 查看HuggingFace API状态: https://status.huggingface.co/

### 问题3: 翻译质量不理想

**说明**: Helsinki-NLP模型是通用翻译模型，不是专门针对AI新闻训练的

**改进方案**:
1. 接受当前翻译质量（已经够用）
2. 或考虑付费API（如Google Translate、DeepL）

### 问题4: 翻译速度慢

**原因**:
- HuggingFace免费API有延迟
- 每条内容需要2次翻译调用

**优化**:
- 已限制描述长度为500字符
- 已添加智能语言检测
- 考虑接受英文原文（不翻译）

---

## 数据结构变化

### 翻译前

```json
{
  "title": "What's behind the mass exodus at xAI?",
  "description": "The past few days have been...",
  "link": "https://...",
  "author": "Hayden Field",
  "source": "The Verge AI",
  "pubDate": "2026-02-13T17:10:44.000Z"
}
```

### 翻译后

```json
{
  "title": "What's behind the mass exodus at xAI?",
  "titleZh": "xAI大规模人员流失背后的原因是什么？",
  "description": "The past few days have been...",
  "descriptionZh": "过去几天对xAI来说...",
  "link": "https://...",
  "author": "Hayden Field",
  "source": "The Verge AI",
  "pubDate": "2026-02-13T17:10:44.000Z"
}
```

**说明**:
- 保留原始英文字段
- 新增中文翻译字段（`titleZh`, `descriptionZh`）
- 前端优先显示中文，降级显示英文

---

## 禁用翻译功能

如果不想使用翻译功能：

### 方法1: 不配置API Key
- 简单地不设置`HUGGINGFACE_API_KEY`环境变量
- 系统会自动跳过翻译

### 方法2: 注释翻译代码
在 `scripts/fetch-rss.js` 中注释掉翻译部分：

```javascript
// 翻译英文内容到中文
/*
console.log('开始翻译英文内容到中文...');
for (const item of aiRelatedItems) {
  // ... 翻译代码
}
console.log('翻译完成！');
*/
```

---

## 最佳实践

1. **本地测试先配置API Key** - 确保翻译功能正常工作
2. **观察翻译质量** - 决定是否继续使用
3. **监控API调用** - 确保不超过免费限额
4. **接受部分失败** - 翻译失败时会自动使用原文

---

## 下一步

1. 获取HuggingFace API Key
2. 配置环境变量
3. 运行 `npm run fetch-news` 测试
4. 查看翻译效果
5. 部署到GitHub并配置Secret

---

**更新时间**: 2026-02-14
**功能状态**: ✅ 已实现，待测试

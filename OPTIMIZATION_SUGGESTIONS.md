# RSS抓取脚本优化建议

基于本地测试，发现部分RSS源存在超时问题，以下是优化方案。

## 问题1: 超时时间过短

当前设置为10秒，对于国际网站和RSSHub可能不够。

### 修改位置
`scripts/fetch-rss.js` 第15行

### 当前代码
```javascript
const parser = new Parser({
  timeout: 10000,  // 10秒
  ...
});
```

### 建议修改
```javascript
const parser = new Parser({
  timeout: 30000,  // 增加到30秒
  ...
});
```

---

## 问题2: YouTube RSS源可能需要代理

YouTube的RSS feed在某些网络环境下可能较慢。

### 建议方案A: 使用RSSHub代理
将YouTube RSS改为通过RSSHub访问（如果RSSHub可用）

### 建议方案B: 添加更多YouTube频道
增加YouTube频道数量，即使部分失败也能获取足够内容

---

## 问题3: RSSHub不稳定

国内访问RSSHub可能被限流或被墙。

### 解决方案

#### 方案1: 使用自建RSSHub实例
部署自己的RSSHub实例到Vercel或其他平台

#### 方案2: 使用官方RSS源
机器之心和36氪可能有官方RSS源，不依赖RSSHub

建议数据源调整：
```javascript
const RSS_FEEDS = [
  // 中文AI新闻 - 直接RSS源
  { url: 'https://www.jiqizhixin.com/rss', name: '机器之心', type: 'news' },
  // 或使用备用来源
  { url: 'https://www.aixinzhijie.com/rss', name: 'AI新知', type: 'news' },
  { url: 'https://news.cnblogs.com/tag/ai/rss', name: '博客园AI', type: 'news' },
];
```

#### 方案3: 使用更稳定的数据源

推荐添加：
```javascript
// 稳定的英文源
{ url: 'https://openai.com/blog/rss.xml', name: 'OpenAI Blog', type: 'news' },
{ url: 'https://ai.googleblog.com/feeds/posts/default', name: 'Google AI Blog', type: 'news' },
{ url: 'https://deepmind.com/blog/feed/basic/', name: 'DeepMind Blog', type: 'news' },
{ url: 'https://www.anthropic.com/news/rss.xml', name: 'Anthropic News', type: 'news' },

// 稳定的中文源
{ url: 'https://news.cnblogs.com/tag/ai/rss', name: '博客园AI', type: 'news' },
```

---

## 问题4: 缺少重试机制

单次失败就放弃该数据源。

### 建议添加重试函数

在 `scripts/fetch-rss.js` 中添加：

```javascript
// 添加重试函数
async function fetchWithRetry(feedConfig, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`正在抓取: ${feedConfig.name}${i > 0 ? ` (重试 ${i}/${maxRetries-1})` : ''}`);
      const feed = await parser.parseURL(feedConfig.url);
      return { success: true, feed, config: feedConfig };
    } catch (error) {
      console.log(`${feedConfig.name} 失败:`, error.message);
      if (i < maxRetries - 1) {
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  return { success: false, config: feedConfig };
}
```

然后修改主函数：
```javascript
// 抓取所有RSS源（带重试）
const feedResults = await Promise.all(
  RSS_FEEDS.map(feed => fetchWithRetry(feed, 3))
);

// 提取成功的结果
let allItems = feedResults
  .filter(result => result.success)
  .flatMap(result => {
    // 处理feed.items...
  });
```

---

## 当前可用的稳定数据源

基于测试，以下数据源工作正常：

### ✅ 稳定可用
1. TechCrunch AI - https://techcrunch.com/tag/artificial-intelligence/feed/
2. The Verge AI - https://www.theverge.com/rss/ai-artificial-intelligence/index.xml

### ⚠️ 需要优化
1. YouTube RSS - 需要增加超时时间或添加代理
2. RSSHub源 - 考虑替换为直接RSS源

### 建议配置（更稳定）

```javascript
const RSS_FEEDS = [
  // YouTube（增加超时时间后应该可用）
  { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCXZCJLdBC09xxGZ6gcdrc6A', name: 'Two Minute Papers', type: 'youtube' },
  { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCUHW94eEFW7hkUMVaZz4eDg', name: 'AI Explained', type: 'youtube' },
  { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCbfYPyITQ-7l4upoX8nvctg', name: 'Lex Fridman', type: 'youtube' },

  // 英文新闻（已验证可用）
  { url: 'https://techcrunch.com/tag/artificial-intelligence/feed/', name: 'TechCrunch AI', type: 'news' },
  { url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', name: 'The Verge AI', type: 'news' },
  { url: 'https://venturebeat.com/category/ai/feed/', name: 'VentureBeat AI', type: 'news' },
  { url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed', name: 'MIT Tech Review AI', type: 'news' },

  // AI公司博客（推荐添加）
  { url: 'https://openai.com/blog/rss.xml', name: 'OpenAI Blog', type: 'news' },
  { url: 'https://ai.googleblog.com/feeds/posts/default', name: 'Google AI Blog', type: 'news' },

  // 中文（需要测试或找替代源）
  // 暂时注释掉不稳定的源
  // { url: 'https://rsshub.app/jiqizhixin/latest', name: '机器之心', type: 'news' },
  // { url: 'https://rsshub.app/36kr/newsflashes', name: '36氪AI快讯', type: 'news' },
];
```

---

## 优先级建议

### 高优先级（推荐立即修改）
1. ✅ 增加超时时间到30秒
2. ✅ 添加更多稳定的英文数据源

### 中优先级（可选）
1. 添加重试机制
2. 寻找稳定的中文RSS源替代RSSHub

### 低优先级（暂不需要）
1. 自建RSSHub实例
2. 添加代理支持

---

## 测试建议

修改后建议测试：
1. 本地运行 `npm run fetch-news` 验证
2. 在GitHub Actions上运行（网络环境可能更好）
3. 观察1周的数据抓取情况

---

## 注意事项

1. **不要删除现有数据源配置**，先注释掉，观察一段时间
2. **添加新源时先测试**，确保RSS格式正确
3. **GitHub Actions环境可能更好**，本地超时不代表线上也会超时

---

**最后更新**: 2026-02-14

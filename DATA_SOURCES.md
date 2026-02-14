# RSS数据源配置指南

这个文件帮助你理解和自定义新闻数据源。

## 当前已配置的数据源

### YouTube频道（type: youtube）

| 频道名称 | Channel ID | 说明 |
|---------|-----------|------|
| Two Minute Papers | UCXZCJLdBC09xxGZ6gcdrc6A | AI论文解读 |
| AI Explained | UCUHW94eEFW7hkUMVaZz4eDg | AI技术讲解 |
| Lex Fridman | UCbfYPyITQ-7l4upoX8nvctg | AI访谈节目 |

**YouTube RSS格式**：
```
https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}
```

### 中文新闻网站（type: news）

| 网站名称 | RSS源 | 说明 |
|---------|------|------|
| 机器之心 | rsshub.app/jiqizhixin/latest | AI专业媒体 |
| 36氪AI快讯 | rsshub.app/36kr/newsflashes | 科技资讯 |

### 英文新闻网站（type: news）

| 网站名称 | RSS源 | 说明 |
|---------|------|------|
| TechCrunch AI | techcrunch.com/tag/artificial-intelligence/feed/ | 科技新闻 |
| The Verge AI | theverge.com/rss/ai-artificial-intelligence/index.xml | 科技媒体 |

### Twitter/X源（type: twitter）

⚠️ **注意**：Twitter/X的API访问受限，推荐使用Nitter（Twitter的开源前端）

**可用的Nitter实例列表**：
- https://nitter.net
- https://nitter.42l.fr
- https://nitter.nixnet.services

（完整列表：https://github.com/zedeus/nitter/wiki/Instances）

**Nitter RSS格式**：
```
https://nitter.net/{username}/rss
```

**推荐关注的AI相关Twitter账号**：
- OpenAI (@OpenAI)
- Anthropic (@AnthropicAI)
- Andrew Ng (@AndrewYNg)
- Yann LeCun (@ylecun)
- Andrej Karpathy (@karpathy)
- Sam Altman (@sama)

## 如何添加新的数据源

### 1. YouTube频道

**步骤**：
1. 打开想要订阅的YouTube频道
2. 查看页面源代码（右键 → 查看网页源代码）
3. 搜索 `"channelId":`，找到类似 `UC...` 的ID
4. 在 `scripts/fetch-rss.js` 的 `RSS_FEEDS` 数组中添加：

```javascript
{
  url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UC你的频道ID',
  name: '频道名称',
  type: 'youtube'
}
```

### 2. 网站RSS源

**步骤**：
1. 查找目标网站的RSS链接（通常在网站底部或"订阅"按钮）
2. 如果网站没有RSS，可以尝试使用RSSHub：https://docs.rsshub.app/
3. 添加到配置：

```javascript
{
  url: 'https://网站RSS地址',
  name: '网站名称',
  type: 'news'
}
```

### 3. Twitter账号（通过Nitter）

**步骤**：
1. 选择一个可用的Nitter实例（建议先测试是否能访问）
2. 添加到配置：

```javascript
{
  url: 'https://nitter.net/Twitter用户名/rss',
  name: 'Twitter用户显示名',
  type: 'twitter'
}
```

**示例**：
```javascript
{
  url: 'https://nitter.net/OpenAI/rss',
  name: 'OpenAI Twitter',
  type: 'twitter'
}
```

## 推荐的AI相关数据源

### 中文

- **机器之心**：https://rsshub.app/jiqizhixin/latest
- **量子位**：https://rsshub.app/qbitai/news
- **AI科技评论**：https://rsshub.app/leiphone/category/ai
- **新智元**：https://rsshub.app/163/dy/article/T1467284926140
- **PaperWeekly**：https://rsshub.app/paperweekly/papers

### 英文

- **MIT Technology Review AI**：https://www.technologyreview.com/topic/artificial-intelligence/feed
- **VentureBeat AI**：https://venturebeat.com/category/ai/feed/
- **AI Business**：https://aibusiness.com/feed
- **Towards Data Science**：https://towardsdatascience.com/feed

### AI公司博客

- **OpenAI Blog**：https://openai.com/blog/rss.xml
- **Google AI Blog**：https://ai.googleblog.com/feeds/posts/default
- **DeepMind Blog**：https://deepmind.com/blog/feed/basic/

## 测试新数据源

添加新源后，在本地测试：

```bash
npm run fetch-news
```

查看日志输出，确认：
1. ✅ 能成功抓取
2. ✅ 内容被正确分类为AI相关
3. ✅ 数据格式正确

## 数据源维护建议

1. **定期检查**：某些RSS源可能会失效，建议每月检查一次
2. **分散风险**：不要依赖单一数据源，配置多个备用源
3. **质量优先**：选择权威、更新频繁的数据源
4. **避免重复**：同一内容可能出现在多个源中，系统会自动去重

## 故障排查

### 问题1：某个源抓取失败

**可能原因**：
- RSS链接已失效
- 网站更改了RSS地址
- 网络连接问题
- 网站屏蔽了GitHub Actions的IP

**解决方案**：
1. 在浏览器中访问RSS链接，确认是否可用
2. 查看GitHub Actions日志，找到具体错误信息
3. 尝试更换RSS源或使用RSSHub等服务

### 问题2：内容不是AI相关却被收录

**解决方案**：
1. 优化关键词列表（`scripts/fetch-rss.js` 中的 `AI_KEYWORDS`）
2. 提高HuggingFace分类的阈值（当前是0.5）
3. 手动排除某些来源

### 问题3：Nitter实例无法访问

**解决方案**：
1. 更换其他Nitter实例
2. 使用RSSHub的Twitter路由：`https://rsshub.app/twitter/user/用户名`

---

**更多帮助**请查看 [README.md](README.md) 或在GitHub提交Issue。

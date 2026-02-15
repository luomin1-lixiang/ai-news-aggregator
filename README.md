# AI新闻聚合网站

[![Deploy Status](https://github.com/luomin1-lixiang/ai-news-aggregator/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/luomin1-lixiang/ai-news-aggregator/actions)
[![Fetch News](https://github.com/luomin1-lixiang/ai-news-aggregator/actions/workflows/fetch-news.yml/badge.svg)](https://github.com/luomin1-lixiang/ai-news-aggregator/actions)

> 自动抓取AI领域热门新闻的智能聚合网站，每天早上8点自动更新

🌐 **在线访问**：https://luomin1-lixiang.github.io/ai-news-aggregator/

---

## ✨ 功能特点

- ✅ **全自动化**：每天早上8:00（北京时间）自动抓取最新AI新闻
- ✅ **37个优质数据源**：覆盖YouTube、Reuters、BBC、MIT、TechCrunch、机器之心、量子位等
- ✅ **智能分类**：AI芯片、AI硬件、AI资讯三大类别
- ✅ **严格时效性**：只显示48小时内的新闻，确保内容新鲜
- ✅ **关键词匹配**：40+精选AI关键词，智能过滤相关内容
- ✅ **可选翻译**：支持HuggingFace API英译中（可选）
- ✅ **响应式设计**：完美支持手机、平板、电脑访问
- ✅ **GitHub Pages托管**：完全免费，无需服务器

---

## 📊 数据源列表

### YouTube频道（3个）
- Two Minute Papers
- AI Explained
- Lex Fridman

### 国际主流权威媒体（4个）
- **Reuters AI** 🆕
- **BBC Tech** 🆕
- **MIT Tech Review** 🆕
- **Wired AI** 🆕

### 科技专业媒体（5个）
- TechCrunch AI
- The Verge AI
- **VentureBeat AI** 🆕
- **Ars Technica** 🆕
- **The Information** 🆕

### AI公司官方博客（4个）
- **OpenAI Blog** 🆕
- **Google AI Blog** 🆕
- **Anthropic News** 🆕
- **DeepMind Blog** 🆕

### AI硬件/芯片专业源（3个）
- **Chips and Cheese** 🆕
- **AnandTech** 🆕
- **SemiAnalysis** 🆕

### 学术/研究源（2个）
- **arXiv AI Papers** 🆕
- **Papers With Code** 🆕

### 中文优质AI媒体（6个）
- 机器之心
- 36氪AI快讯
- **量子位** 🆕
- **新智元** 🆕
- **AI科技评论** 🆕
- **虎嗅AI** 🆕

**总计：37个RSS源** | 🆕 表示新增源

---

## 🚀 快速开始

### 方法1：Fork本仓库（推荐）

1. **Fork仓库**
   - 访问：https://github.com/luomin1-lixiang/ai-news-aggregator
   - 点击右上角 `Fork` 按钮

2. **启用GitHub Pages**
   - 进入你fork的仓库 → Settings → Pages
   - Source选择：**GitHub Actions**
   - 保存后等待部署完成

3. **启用定时任务**
   - 进入 Actions 标签
   - 点击 "Fetch AI News" → 点击 "Enable workflow"
   - 手动运行一次：Run workflow → 选择main分支 → Run workflow

4. **访问你的网站**
   - 地址：`https://你的用户名.github.io/ai-news-aggregator/`

**总耗时：约5分钟**

### 方法2：从零开始部署

详细步骤请参考下方的"完整部署教程"章节。

---

## 🛠️ 完整部署教程

<details>
<summary>点击展开详细步骤</summary>

### 第一步：创建GitHub仓库

1. 登录 GitHub
2. 点击右上角 `+` → `New repository`
3. 填写信息：
   - Repository name: `ai-news-aggregator`
   - 选择 Public
   - ✅ Add a README file
4. 创建仓库

### 第二步：上传项目文件

#### 选项A：使用Git命令（推荐）

```bash
# 克隆你的空仓库
git clone https://github.com/你的用户名/ai-news-aggregator.git
cd ai-news-aggregator

# 复制项目文件到此目录

# 提交并推送
git add .
git commit -m "Initial commit"
git push origin main
```

#### 选项B：使用GitHub网页上传

1. 在仓库页面点击 `Add file` → `Upload files`
2. 拖拽所有项目文件到上传区
3. 提交更改

### 第三步：配置GitHub Actions权限

1. 进入仓库 Settings → Actions → General
2. Workflow permissions 选择：
   - ✅ **Read and write permissions**
   - ✅ Allow GitHub Actions to create and approve pull requests
3. 保存

### 第四步：启用GitHub Pages

1. Settings → Pages
2. Source选择：**GitHub Actions**（不是 Deploy from a branch）
3. 保存

### 第五步：配置SSH密钥（可选，用于本地开发）

```bash
# 生成SSH密钥
ssh-keygen -t ed25519 -C "your_email@example.com"

# 复制公钥
cat ~/.ssh/id_ed25519.pub

# 添加到GitHub：Settings → SSH and GPG keys → New SSH key
```

### 第六步：启用定时任务

1. 进入 Actions 标签
2. 如果看到禁用提示，点击启用
3. 点击 "Fetch AI News" workflow
4. 点击 "Run workflow" 手动运行一次
5. 运行成功后，定时任务会自动激活

### 第七步：配置HuggingFace API（可选）

如果需要AI翻译功能：

1. 注册 HuggingFace：https://huggingface.co/join
2. 获取 API Key：Settings → Access Tokens → New token
3. 在GitHub仓库中添加Secret：
   - Settings → Secrets and variables → Actions → New repository secret
   - Name: `HUGGINGFACE_API_KEY`
   - Value: 粘贴你的API Key

**注意**：如果不配置，系统会使用关键词匹配（完全可用）

</details>

---

## ⚙️ 工作原理

### 自动化流程

```
每天早上 08:00 (北京时间)
    ↓
触发 GitHub Actions "Fetch AI News"
    ↓
从 37 个 RSS 源抓取新闻
    ↓
AI相关性过滤（关键词匹配）
    ↓
时间过滤（48小时内）
    ↓
智能分类（AI芯片/硬件/其他）
    ↓
可选翻译（HuggingFace API）
    ↓
更新 news.json 文件
    ↓
自动触发 "Deploy to GitHub Pages"
    ↓
构建 Next.js 静态网站
    ↓
部署到 GitHub Pages
    ↓
网站更新完成（约 08:05）
```

### 筛选策略

1. **AI相关性判断**：
   - 40+精选AI关键词匹配
   - 涵盖：机器学习、深度学习、大模型、ChatGPT、Claude等

2. **时间过滤**：
   - **严格48小时限制**
   - 宁可显示少于15条，也不显示旧新闻

3. **分类策略**：
   - AI芯片：Nvidia、TPU、GPU、AI芯片等（最多5条）
   - AI硬件：服务器、数据中心、算力等（最多5条）
   - AI资讯：其他AI相关内容（最多5条）

4. **优先级排序**：
   - 按发布时间从新到旧排序
   - 确保最新内容优先展示

---

## 🔧 配置说明

### 修改抓取时间

编辑 `.github/workflows/fetch-news.yml`:

```yaml
schedule:
  - cron: '0 0 * * *'  # UTC 0点 = 北京时间8点
```

常用时间配置：
- 早上6点：`cron: '22 0 * * *'`
- 中午12点：`cron: '4 0 * * *'`
- 晚上8点：`cron: '12 0 * * *'`
- 每6小时：`cron: '0 */6 * * *'`

### 添加新数据源

编辑 `scripts/fetch-rss.js`，在 `RSS_FEEDS` 数组中添加：

```javascript
const RSS_FEEDS = [
  // 添加你的RSS源
  { url: 'RSS源URL', name: '源名称', type: 'news' },
  // ...
];
```

### 调整时间限制

如果想改为24小时或72小时，编辑 `scripts/fetch-rss.js` 第310-324行：

```javascript
// 改为24小时
const twentyFourHoursAgo = new Date();
twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

// 改为72小时
const seventyTwoHoursAgo = new Date();
seventyTwoHoursAgo.setHours(seventyTwoHoursAgo.getHours() - 72);
```

### 修改显示数量

编辑 `scripts/fetch-rss.js` 第376-381行，调整各类别配额：

```javascript
const selectedItems = [
  ...categorizedItems['ai-chip'].slice(0, 10),      // 改为10条
  ...categorizedItems['ai-hardware'].slice(0, 10),  // 改为10条
  ...categorizedItems['ai-other'].slice(0, 10)      // 改为10条
];
```

---

## 📁 项目结构

```
ai-news-aggregator/
├── .github/
│   └── workflows/
│       ├── fetch-news.yml          # 定时抓取workflow
│       └── deploy-pages.yml        # GitHub Pages部署workflow
├── data/
│   └── news.json                   # 新闻数据（自动生成）
├── pages/
│   ├── _app.js                     # Next.js应用入口
│   └── index.js                    # 主页面
├── public/
│   ├── data/
│   │   └── news.json               # 公开访问的新闻数据
│   └── .nojekyll                   # 禁用Jekyll处理
├── scripts/
│   └── fetch-rss.js                # RSS抓取核心脚本
├── styles/
│   ├── globals.css                 # 全局样式
│   └── Home.module.css             # 主页样式
├── .gitignore                      # Git忽略文件
├── next.config.js                  # Next.js配置（含basePath）
├── package.json                    # 项目依赖
├── mem.md                          # 项目记忆文档
├── GITHUB_PAGES_CHECKLIST.md       # 部署检查清单
└── README.md                       # 本文档
```

---

## 🐛 常见问题

### Q1: 网站显示"暂无新闻数据"？

**原因**：首次部署时数据文件为空

**解决**：
1. 进入 Actions 标签
2. 手动运行 "Fetch AI News" workflow
3. 等待完成后刷新网站

### Q2: 定时任务没有自动运行？

**原因**：GitHub需要手动激活scheduled workflows

**解决**：
1. 手动运行一次 "Fetch AI News" workflow
2. 或推送一次代码更新
3. 之后每天会自动运行

### Q3: 为什么有些新闻是旧的？

**解决**：已修复！当前版本严格限制48小时内，不会出现旧新闻。

### Q4: 如何查看抓取日志？

**方法**：
1. 进入 Actions 标签
2. 点击最近的 "Fetch AI News" 运行记录
3. 展开 "Fetch RSS feeds and classify" 步骤查看详细日志

### Q5: 某些RSS源无法访问怎么办？

**说明**：
- 系统会自动跳过失败的源
- 在日志中会显示 "抓取 XXX 失败"
- 不影响其他源的正常抓取

### Q6: 如何添加翻译功能？

**方法1**（免费）：
- 配置 HuggingFace API Key
- 翻译质量一般

**方法2**（推荐，高质量）：
- 使用 Claude API（约$1-2/月）
- 翻译质量极高
- 需要虚拟信用卡支付

### Q7: 网站样式丢失或显示404？

**原因**：basePath配置问题

**解决**：确认 `next.config.js` 中：
```javascript
basePath: '/ai-news-aggregator'  // 必须与仓库名一致
```

---

## 🔒 安全说明

- ✅ 所有API Key存储在GitHub Secrets中，不会暴露
- ✅ 只使用公开的RSS源，不访问私有数据
- ✅ GitHub Actions运行在隔离环境中
- ✅ 静态网站，无后端安全风险

---

## 📈 性能优化

- ⚡ Next.js静态导出，加载速度极快
- ⚡ GitHub Pages CDN加速
- ⚡ 数据预渲染，无需等待API
- ⚡ 响应式图片优化

---

## 🛡️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 14.0.4 | React框架 |
| React | 18.2.0 | 前端UI |
| Node.js | 18+ | 运行环境 |
| rss-parser | 3.13.0 | RSS解析 |
| node-fetch | 2.7.0 | HTTP请求 |
| dotenv | 16.3.1 | 环境变量 |
| GitHub Actions | - | CI/CD |
| GitHub Pages | - | 静态托管 |

---

## 📝 更新日志

### v2.0.0 (2026-02-14) - 重大更新

**新增功能**：
- ✅ 扩展到37个RSS源（从7个增加）
- ✅ 添加国际权威媒体（Reuters, BBC, MIT等）
- ✅ 添加AI芯片专业源（Chips and Cheese等）
- ✅ 添加学术研究源（arXiv, Papers With Code）
- ✅ 严格48小时时间限制

**重大修复**：
- ✅ 修复数据损失问题（15条变10条）
- ✅ 修复GitHub Pages basePath路径问题
- ✅ 移除"使用所有AI内容"的降级逻辑
- ✅ 优化分类和配额策略

**迁移**：
- ✅ 从Netlify迁移到GitHub Pages
- ✅ 配置SSH认证
- ✅ 完善自动化流程

### v1.0.0 (2024-02-14)
- ✅ 初始版本发布
- ✅ 基础RSS抓取功能
- ✅ HuggingFace AI分类
- ✅ 自动化定时任务

---

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

**贡献方式**：
1. Fork本仓库
2. 创建特性分支：`git checkout -b feature/新功能`
3. 提交更改：`git commit -m "添加新功能"`
4. 推送分支：`git push origin feature/新功能`
5. 提交Pull Request

---

## 📄 许可证

MIT License

Copyright (c) 2026

---

## 🔗 相关链接

- **在线网站**：https://luomin1-lixiang.github.io/ai-news-aggregator/
- **GitHub仓库**：https://github.com/luomin1-lixiang/ai-news-aggregator
- **问题反馈**：https://github.com/luomin1-lixiang/ai-news-aggregator/issues

---

## 💡 后续计划

- [ ] 集成Claude API实现高质量翻译
- [ ] 添加新闻摘要生成
- [ ] 支持用户自定义关注主题
- [ ] 添加新闻收藏功能
- [ ] 支持RSS订阅输出
- [ ] 添加搜索功能
- [ ] 优化移动端体验

---

**如有问题，欢迎在GitHub提Issue！🚀**

*最后更新：2026-02-14*

# AI新闻聚合网站 - 部署指南

这是一个自动抓取AI领域热门新闻的网站，每天早上8点自动更新。

## 功能特点

- ✅ 每天早上8:00自动抓取AI相关新闻
- ✅ 支持YouTube、TechCrunch、The Verge、机器之心、36氪等多个数据源
- ✅ 使用HuggingFace AI模型自动分类内容
- ✅ 按发布时间排序，展示前10条热门内容
- ✅ 保留最近30天的历史记录
- ✅ 响应式设计，支持手机和电脑访问

## 部署步骤（完整图文教程）

### 第一步：注册GitHub账号

1. 访问 https://github.com/signup
2. 填写邮箱、密码、用户名
3. 完成邮箱验证
4. 完成人机验证（选择图片）

**预计时间：5分钟**

---

### 第二步：创建GitHub仓库

1. 登录GitHub后，点击右上角的 `+` 号，选择 `New repository`
2. 填写仓库信息：
   - **Repository name（仓库名）**：`ai-news-aggregator`
   - **Description（描述）**：AI新闻聚合网站
   - 选择 **Public（公开）**
   - ✅ 勾选 `Add a README file`
3. 点击 `Create repository` 按钮

**预计时间：2分钟**

---

### 第三步：上传项目文件到GitHub

#### 方法A：使用GitHub网页上传（推荐-最简单）

1. 在你的仓库页面，点击 `Add file` → `Upload files`
2. 将 `ai-news-aggregator` 文件夹中的**所有文件和文件夹**拖拽到上传区域
3. 在底部填写提交信息：`Initial commit`
4. 点击 `Commit changes` 按钮

**预计时间：3分钟**

#### 方法B：使用GitHub Desktop（图形化工具）

如果你不想在网页上操作，可以下载GitHub Desktop：

1. 下载并安装：https://desktop.github.com/
2. 登录你的GitHub账号
3. Clone（克隆）你刚创建的仓库到本地
4. 将项目文件复制到克隆的文件夹中
5. 在GitHub Desktop中提交（Commit）并推送（Push）

---

### 第四步：获取HuggingFace API Key（可选但推荐）

1. 访问 https://huggingface.co/join 注册账号
2. 登录后，点击右上角头像 → `Settings`
3. 在左侧菜单选择 `Access Tokens`
4. 点击 `New token` 按钮：
   - **Name（名称）**：AI News Aggregator
   - **Role（权限）**：Read（读取）
5. 点击 `Generate token`，复制生成的token（类似：`hf_xxxxxxxxxxxxx`）

⚠️ **重要**：Token只会显示一次，请立即复制保存！

**预计时间：3分钟**

---

### 第五步：在GitHub中配置Secret（密钥）

1. 在你的GitHub仓库页面，点击 `Settings`（设置）
2. 在左侧菜单找到 `Secrets and variables` → `Actions`
3. 点击 `New repository secret` 按钮
4. 填写：
   - **Name（名称）**：`HUGGINGFACE_API_KEY`
   - **Value（值）**：粘贴你刚才复制的HuggingFace token
5. 点击 `Add secret` 按钮

**如果你跳过了第四步**（没有HuggingFace账号），系统会自动使用关键词匹配，准确度会稍低但也可用。

**预计时间：2分钟**

---

### 第六步：启用GitHub Actions

1. 在你的仓库页面，点击 `Actions` 标签
2. 如果看到提示 "Workflows aren't being run on this forked repository"，点击 `I understand my workflows, go ahead and enable them` 按钮
3. 在左侧找到 `Fetch AI News` workflow
4. 点击 `Run workflow` 按钮（下拉菜单）→ 再点击绿色的 `Run workflow` 按钮
5. 等待1-2分钟，刷新页面，应该能看到一个绿色的✅（表示成功）

**第一次手动运行后，系统会每天早上8点自动运行。**

**预计时间：3分钟**

---

### 第七步：部署到Netlify

1. 访问 https://app.netlify.com/signup 注册账号
   - 建议选择 `Sign up with GitHub`（用GitHub账号登录）
   - 授权Netlify访问你的GitHub账号

2. 登录后，点击 `Add new site` → `Import an existing project`

3. 选择 `Deploy with GitHub`

4. 在仓库列表中找到 `ai-news-aggregator`，点击它

5. 配置构建设置（通常会自动识别）：
   - **Branch to deploy（部署分支）**：`main`
   - **Build command（构建命令）**：`npm run export`
   - **Publish directory（发布目录）**：`out`

6. 点击 `Deploy site` 按钮

7. 等待3-5分钟，部署完成后，你会看到一个网址（类似：`https://random-name-123456.netlify.app`）

8. 点击网址，就能看到你的网站了！

**预计时间：5分钟**

---

### 第八步：自定义域名（可选）

如果你想要一个好记的域名（如 `ai-news.netlify.app`）：

1. 在Netlify网站页面，点击 `Site settings`
2. 点击 `Change site name`
3. 输入你想要的名字（只能用英文和数字）
4. 保存后，你的网址就变成了 `https://你的名字.netlify.app`

**预计时间：1分钟**

---

## 部署完成！🎉

现在你的网站已经上线了！以后每天早上8点，GitHub Actions会自动：
1. 抓取最新的AI新闻
2. 用AI模型过滤相关内容
3. 更新数据文件
4. 自动触发Netlify重新部署

你只需要打开网址，就能看到最新的内容！

---

## 常见问题

### Q1: 为什么网站上没有内容？

A: 第一次部署时，`data/news.json` 是空的，需要等待GitHub Actions第一次运行（每天早上8点），或者在Actions页面手动运行一次。

### Q2: 如何添加更多数据源？

A: 编辑 `scripts/fetch-rss.js` 文件，在 `RSS_FEEDS` 数组中添加新的RSS源。

### Q3: 如何调整抓取时间？

A: 编辑 `.github/workflows/fetch-news.yml` 文件，修改 `cron` 表达式：
- `'0 0 * * *'` = 每天北京时间8:00
- `'0 12 * * *'` = 每天北京时间20:00
- `'0 */6 * * *'` = 每6小时一次

### Q4: 如何查看抓取日志？

A: 在GitHub仓库的 `Actions` 标签下，点击最近的workflow运行记录，可以看到详细日志。

### Q5: HuggingFace API调用失败怎么办？

A: 系统会自动降级到关键词匹配模式，不影响使用。你可以在GitHub Actions日志中看到相关提示。

### Q6: 如何添加Nitter（Twitter）数据源？

A: Nitter实例不稳定，建议使用公开的实例列表：https://github.com/zedeus/nitter/wiki/Instances

在 `RSS_FEEDS` 中添加：
```javascript
{ url: 'https://nitter.net/username/rss', name: 'Twitter用户名', type: 'twitter' }
```

将 `username` 替换为你想关注的Twitter用户名。

---

## 技术架构

- **前端框架**：Next.js 14 + React 18
- **样式**：CSS Modules
- **RSS解析**：rss-parser
- **AI分类**：HuggingFace Inference API (facebook/bart-large-mnli)
- **定时任务**：GitHub Actions
- **部署平台**：Netlify
- **数据存储**：JSON文件

---

## 项目结构

```
ai-news-aggregator/
├── .github/
│   └── workflows/
│       └── fetch-news.yml      # GitHub Actions定时任务配置
├── data/
│   └── news.json               # 新闻数据存储
├── pages/
│   ├── _app.js                 # Next.js应用入口
│   └── index.js                # 主页面
├── scripts/
│   └── fetch-rss.js            # RSS抓取和AI分类脚本
├── styles/
│   ├── globals.css             # 全局样式
│   └── Home.module.css         # 主页样式
├── .gitignore                  # Git忽略文件
├── netlify.toml                # Netlify配置
├── next.config.js              # Next.js配置
├── package.json                # 项目依赖
└── README.md                   # 本文档
```

---

## 更新日志

### v1.0.0 (2024-02-14)
- ✅ 初始版本发布
- ✅ 支持多个RSS数据源
- ✅ 集成HuggingFace AI分类
- ✅ 自动化定时抓取
- ✅ 响应式网页设计

---

## 许可证

MIT License

---

## 联系方式

如有问题，请在GitHub仓库中提交Issue。

---

**祝你使用愉快！🚀**

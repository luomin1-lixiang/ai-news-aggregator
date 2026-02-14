# 本地开发指南

如果你想在本地电脑上测试这个项目，请按以下步骤操作：

## 前置要求

1. 安装 Node.js（版本 18 或更高）
   - 下载地址：https://nodejs.org/
   - 下载 LTS 版本即可

## 本地运行步骤

### 1. 安装依赖

打开命令行（Windows: cmd 或 PowerShell），进入项目目录：

```bash
cd ai-news-aggregator
npm install
```

### 2. 配置环境变量（可选）

复制环境变量示例文件：

```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

然后编辑 `.env` 文件，填入你的 HuggingFace API Key。

### 3. 测试RSS抓取脚本

运行抓取脚本：

```bash
npm run fetch-news
```

成功后，你会在 `data/news.json` 中看到抓取的新闻数据。

### 4. 启动开发服务器

```bash
npm run dev
```

然后在浏览器中访问 http://localhost:3000

### 5. 构建生产版本

```bash
npm run export
```

构建完成后，静态文件会生成在 `out/` 目录中。

## 常见问题

### Q: npm install 很慢怎么办？

A: 使用国内镜像源：

```bash
npm config set registry https://registry.npmmirror.com
npm install
```

### Q: 运行时出现端口占用错误

A: Next.js默认使用3000端口，如果被占用，可以指定其他端口：

```bash
npm run dev -- -p 3001
```

### Q: 如何调试抓取脚本？

A: 在 `scripts/fetch-rss.js` 中添加更多 `console.log` 语句，然后运行：

```bash
node scripts/fetch-rss.js
```

## 文件修改后自动重新部署

如果你已经部署到GitHub + Netlify：

1. 在本地修改文件
2. 提交到GitHub：
   ```bash
   git add .
   git commit -m "Update: 你的修改说明"
   git push
   ```
3. Netlify会自动检测到更改并重新部署

---

更多详细信息请查看 [README.md](README.md)

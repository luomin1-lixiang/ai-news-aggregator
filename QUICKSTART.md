# 快速部署指南（5步完成）

## 步骤1：注册GitHub（5分钟）
访问 https://github.com/signup 注册账号

## 步骤2：创建仓库（2分钟）
1. 点击右上角 `+` → `New repository`
2. 名称填 `ai-news-aggregator`
3. 选择 `Public`
4. 点击 `Create repository`

## 步骤3：上传文件（3分钟）
1. 点击 `Add file` → `Upload files`
2. 拖拽所有项目文件到上传区
3. 点击 `Commit changes`

## 步骤4：配置HuggingFace（可选，5分钟）
1. 访问 https://huggingface.co/join 注册
2. 获取API Token: Settings → Access Tokens → New token
3. 在GitHub仓库: Settings → Secrets → Actions → New secret
4. 名称: `HUGGINGFACE_API_KEY`，值: 粘贴token

**跳过此步骤会使用关键词匹配，准确度稍低**

## 步骤5：部署到Netlify（5分钟）
1. 访问 https://app.netlify.com 用GitHub登录
2. `Add new site` → `Import from GitHub`
3. 选择 `ai-news-aggregator` 仓库
4. 点击 `Deploy site`
5. 完成！

## 启动定时抓取
在GitHub仓库的 `Actions` 标签下，手动运行一次 `Fetch AI News`

---

**总耗时：20分钟 | 完全免费 | 全自动运行**

详细说明请查看 [README.md](README.md)

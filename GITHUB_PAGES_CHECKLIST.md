# GitHub Pages 部署检查清单

## 状态检查

### ✅ 本地代码状态
- [x] 代码已推送到GitHub
- [x] workflow文件已提交（deploy-pages.yml）
- [x] next.config.js已配置basePath
- [x] .nojekyll文件已添加

---

## 需要在GitHub网页上检查的设置

### 第1项：检查workflow文件是否存在

访问：https://github.com/luomin1-lixiang/ai-news-aggregator/tree/main/.github/workflows

**应该看到**：
- [x] deploy-pages.yml ✅
- [x] fetch-news.yml ✅

---

### 第2项：检查Actions权限设置

访问：https://github.com/luomin1-lixiang/ai-news-aggregator/settings/actions

**需要确认**：

#### General标签
滚动到页面底部，找到 **"Workflow permissions"**

**应该选择**：
- [ ] ✅ **Read and write permissions**（读写权限）
- [ ] ✅ 勾选 **"Allow GitHub Actions to create and approve pull requests"**

然后点击 **Save** 按钮

---

### 第3项：启用GitHub Pages

访问：https://github.com/luomin1-lixiang/ai-news-aggregator/settings/pages

**需要配置**：

#### Build and deployment 部分

**Source（来源）** 下拉菜单：
- [ ] ✅ 选择 **"GitHub Actions"**（不要选 "Deploy from a branch"）

**选择后的效果**：
- 页面会显示："Use GitHub Actions workflows to build and deploy your site."
- 顶部可能显示："Your site is ready to be published at https://luomin1-lixiang.github.io/ai-news-aggregator/"

---

### 第4项：检查仓库可见性

访问：https://github.com/luomin1-lixiang/ai-news-aggregator/settings

**需要确认**：

**Danger Zone** 部分（页面最底部）

**仓库可见性**：
- [ ] ✅ 仓库是 **Public**（公开）
  - 或者你有 GitHub Pro/Team/Enterprise 账号（支持Private仓库使用Pages）

---

## 完成上述设置后的操作

### 第5项：首次部署

1. 访问：https://github.com/luomin1-lixiang/ai-news-aggregator/actions

2. 在左侧列表中找到 **"Deploy to GitHub Pages"**

3. 点击右上角的 **"Run workflow"** 按钮

4. 在弹出菜单中：
   - Branch: 选择 **main**
   - 点击绿色的 **"Run workflow"** 按钮

5. 等待3-5分钟，观察workflow运行：
   - 🟡 黄色圆圈 = 正在运行
   - ✅ 绿色勾号 = 部署成功
   - ❌ 红色叉号 = 部署失败（点击查看日志）

---

## 部署成功后

### 访问你的网站

地址：https://luomin1-lixiang.github.io/ai-news-aggregator/

**注意**：必须包含末尾的 `/ai-news-aggregator/`

---

## 常见错误排查

### 错误1：workflow无法运行

**现象**：点击"Run workflow"后没反应

**检查**：
- Settings → Actions → General → Workflow permissions
- 确认选择了 "Read and write permissions"

---

### 错误2：部署失败 - Permission denied

**现象**：workflow运行到deploy步骤失败

**解决**：
1. Settings → Pages → Source 必须是 "GitHub Actions"
2. Settings → Actions → General → 确认workflow权限正确

---

### 错误3：网站404

**现象**：部署成功但访问显示404

**检查**：
1. 确认访问的URL是：`https://luomin1-lixiang.github.io/ai-news-aggregator/`
2. 注意末尾的斜杠 `/`
3. 注意路径中包含 `/ai-news-aggregator/`

---

### 错误4：样式丢失

**现象**：网站打开了但没有CSS样式

**原因**：basePath配置问题（已修复）

**验证**：查看浏览器控制台（F12）是否有404错误

---

## 检查完成时间线

- [ ] **现在**：按照清单检查GitHub设置
- [ ] **5分钟后**：首次运行workflow
- [ ] **10分钟后**：网站部署完成，可以访问
- [ ] **明天早上8点**：自动抓取新闻并更新网站

---

## 快速检查命令（可选）

如果你安装了 `gh` CLI工具，可以运行：

```bash
# 检查workflow状态
gh workflow list

# 查看最近的workflow运行
gh run list

# 触发workflow
gh workflow run "Deploy to GitHub Pages"
```

---

## 联系支持

如果遇到问题：
1. 查看Actions日志：https://github.com/luomin1-lixiang/ai-news-aggregator/actions
2. 查看GitHub Pages设置：https://github.com/luomin1-lixiang/ai-news-aggregator/settings/pages
3. 检查workflow文件语法：https://github.com/luomin1-lixiang/ai-news-aggregator/blob/main/.github/workflows/deploy-pages.yml

---

**创建时间**：2026-02-14
**预期完成**：2026-02-14（今天！）

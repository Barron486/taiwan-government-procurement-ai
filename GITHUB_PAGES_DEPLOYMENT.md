# GitHub Pages 部署指南

## 📋 概述

本專案支援兩種部署方式：
- **Vercel**：完整功能，包含 API 代理（推薦）
- **GitHub Pages**：靜態網站，可能受 CORS 限制

## 🚀 GitHub Pages 部署步驟

### 步驟 1：準備 GitHub Pages 版本

1. **使用 GitHub Pages 專用檔案**：
   - 主頁面：`index-github.html` → 重命名為 `index.html`
   - 公司分析：需要修改 `company_analysis.html` 以支援 GitHub Pages

### 步驟 2：設定 GitHub Pages

1. **前往 GitHub Repository 設定**：
   - 點擊 `Settings` 標籤
   - 滾動到 `Pages` 區段
   - 在 `Source` 選擇 `Deploy from a branch`
   - 選擇 `main` 分支和 `/ (root)` 資料夾
   - 點擊 `Save`

2. **等待部署**：
   - GitHub 會自動建置和部署
   - 部署完成後，網站會出現在 `https://yourusername.github.io/taiwan-government-procurement-ai`

### 步驟 3：修改檔案以支援 GitHub Pages

#### 選項 A：建立 GitHub Pages 分支

```bash
# 建立 GitHub Pages 專用分支
git checkout -b gh-pages

# 複製 GitHub Pages 版本檔案
cp index-github.html index.html

# 提交變更
git add .
git commit -m "📄 新增 GitHub Pages 版本"
git push origin gh-pages
```

#### 選項 B：使用 GitHub Actions 自動部署

建立 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Pages
        uses: actions/configure-pages@v4
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## ⚠️ GitHub Pages 限制

### 1. **CORS 限制**
- GitHub Pages 無法使用 Serverless Functions
- 直接 API 呼叫可能被瀏覽器阻擋
- 建議使用 Vercel 版本以獲得最佳體驗

### 2. **功能差異**
| 功能 | Vercel | GitHub Pages |
|------|--------|--------------|
| 基本搜尋 | ✅ | ✅ |
| 標案詳情 | ✅ | ⚠️ 可能失敗 |
| AI 分析 | ✅ | ✅ |
| 公司分析 | ✅ | ⚠️ 可能失敗 |
| API 代理 | ✅ | ❌ |

### 3. **解決方案**

#### 方案 A：使用 CORS 代理服務
```javascript
// 在 GitHub Pages 版本中使用 CORS 代理
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
const API_URL = `${CORS_PROXY}https://pcc-api.openfun.app/api`;
```

#### 方案 B：使用 JSONP（如果 API 支援）
```javascript
// 使用 JSONP 繞過 CORS 限制
function jsonpRequest(url, callback) {
    const script = document.createElement('script');
    script.src = `${url}&callback=${callback}`;
    document.head.appendChild(script);
}
```

## 🔧 修改現有檔案以支援 GitHub Pages

### 1. 修改 `company_analysis.html`

在檔案開頭新增：

```html
<script>
// GitHub Pages 檢測
if (window.location.hostname.includes('github.io')) {
    console.log('🔧 GitHub Pages 模式：直接 API 呼叫（可能受 CORS 限制）');
    // 使用直接 API 呼叫
} else {
    console.log('🔧 Vercel 模式：使用 API 代理');
    // 使用 API 代理
}
</script>
```

### 2. 建立環境檢測

```javascript
// 檢測部署環境
function getDeploymentMode() {
    if (window.location.hostname.includes('vercel.app')) {
        return 'vercel';
    } else if (window.location.hostname.includes('github.io')) {
        return 'github-pages';
    } else {
        return 'local';
    }
}

// 根據環境選擇 API 配置
const deploymentMode = getDeploymentMode();
if (deploymentMode === 'github-pages') {
    // 使用直接 API 呼叫
    const API_BASES = ['https://pcc-api.openfun.app/api', 'https://pcc.g0v.ronny.tw/api'];
} else {
    // 使用 API 代理
    const USE_PROXY = window.API_CONFIG && window.API_CONFIG.getApiBase();
}
```

## 📊 部署比較

### Vercel 部署
- ✅ **完整功能**：所有功能正常運作
- ✅ **API 代理**：解決 CORS 問題
- ✅ **自動部署**：Git push 即部署
- ✅ **全球 CDN**：快速載入
- ❌ **成本**：免費方案有使用限制

### GitHub Pages 部署
- ✅ **完全免費**：無使用限制
- ✅ **簡單部署**：只需推送到 GitHub
- ✅ **版本控制**：與 Git 完美整合
- ❌ **功能限制**：可能受 CORS 限制
- ❌ **無後端**：無法使用 Serverless Functions

## 🎯 建議

### 主要部署：Vercel
- 使用 Vercel 作為主要部署平台
- 提供完整功能和最佳使用者體驗
- 支援 API 代理和 Serverless Functions

### 備用部署：GitHub Pages
- 作為備用或展示用途
- 適合靜態展示和基本功能
- 可以作為 Vercel 的備用方案

## 📝 部署檢查清單

### Vercel 部署
- [ ] 程式碼已推送到 GitHub
- [ ] Vercel 專案已連接
- [ ] API 代理正常運作
- [ ] 所有功能測試通過

### GitHub Pages 部署
- [ ] 建立 `gh-pages` 分支
- [ ] 複製 GitHub Pages 版本檔案
- [ ] 設定 GitHub Pages 來源
- [ ] 測試基本功能
- [ ] 確認 CORS 限制影響

---

## 🚀 快速開始

### 立即部署到 GitHub Pages：

1. **建立 GitHub Pages 分支**：
```bash
git checkout -b gh-pages
cp index-github.html index.html
git add .
git commit -m "📄 新增 GitHub Pages 版本"
git push origin gh-pages
```

2. **設定 GitHub Pages**：
   - 前往 Repository Settings
   - 選擇 Pages 設定
   - 選擇 `gh-pages` 分支
   - 等待部署完成

3. **測試功能**：
   - 訪問 `https://yourusername.github.io/taiwan-government-procurement-ai`
   - 測試基本搜尋功能
   - 確認 CORS 限制影響

---

**現在您可以同時使用 Vercel 和 GitHub Pages 部署您的專案了！** 🎉

# 🚀 台灣政府採購查詢系統 - 部署指南

## ✅ 已完成：推送至 GitHub

您的最新版本已成功推送至 GitHub：
```
https://github.com/Barron486/taiwan-government-procurement-ai
```

---

## 📋 部署方案總覽

### 方案 1: GitHub Pages（推薦 ⭐）
- ✅ **完全免費**
- ✅ **自動部署**
- ✅ **HTTPS 支援**
- ✅ **CDN 加速**
- ✅ **最適合您的專案**

### 方案 2: Vercel
- ✅ 免費方案充足
- ✅ 全球 CDN
- ✅ 自動部署
- ⚡ 極快的載入速度

### 方案 3: Netlify
- ✅ 免費方案
- ✅ 表單處理
- ✅ 自動部署
- 🔧 進階功能豐富

---

## 🎯 方案 1: GitHub Pages 部署（推薦）

### 步驟 1: 啟用 GitHub Pages

1. **前往您的 GitHub Repository**
   ```
   https://github.com/Barron486/taiwan-government-procurement-ai
   ```

2. **點擊 `Settings`（設定）**
   - 在上方導覽列找到 Settings 標籤

3. **找到 Pages 設定**
   - 左側選單點擊 `Pages`

4. **設定來源**
   - **Source（來源）**: 選擇 `Deploy from a branch`
   - **Branch（分支）**: 選擇 `main`
   - **資料夾**: 選擇 `/ (root)`
   - 點擊 `Save`

5. **等待部署完成**
   - 約 1-3 分鐘
   - 刷新頁面後會看到部署 URL

### 步驟 2: 訪問您的網站

部署完成後，您的網站將可在以下網址訪問：
```
https://barron486.github.io/taiwan-government-procurement-ai/
```

**主要頁面**：
- 首頁（搜尋系統）: `https://barron486.github.io/taiwan-government-procurement-ai/`
- 公司分析: `https://barron486.github.io/taiwan-government-procurement-ai/company_analysis.html`
- 搜尋比較: `https://barron486.github.io/taiwan-government-procurement-ai/search_comparison.html`

### 步驟 3: 測試功能

1. **開啟網站**
2. **輸入 Gemini API Key**
3. **測試所有功能**：
   - ✅ 基本搜尋
   - ✅ 詳細資料顯示
   - ✅ 公司分析
   - ✅ AI 分析
   - ✅ 自動監控
   - ✅ 分享功能

---

## 🎯 方案 2: Vercel 部署

### 步驟 1: 註冊 Vercel

1. 前往 [Vercel](https://vercel.com)
2. 使用 GitHub 帳號登入

### 步驟 2: 匯入專案

1. 點擊 `Add New...` → `Project`
2. 選擇 `taiwan-government-procurement-ai` repository
3. 保持預設設定
4. 點擊 `Deploy`

### 步驟 3: 獲取網址

部署完成後，您會獲得類似以下的網址：
```
https://taiwan-government-procurement-ai.vercel.app
```

---

## 🎯 方案 3: Netlify 部署

### 步驟 1: 註冊 Netlify

1. 前往 [Netlify](https://netlify.com)
2. 使用 GitHub 帳號登入

### 步驟 2: 匯入專案

1. 點擊 `Add new site` → `Import an existing project`
2. 選擇 `GitHub`
3. 選擇 `taiwan-government-procurement-ai` repository
4. 保持預設設定
5. 點擊 `Deploy site`

### 步驟 3: 獲取網址

部署完成後，您會獲得類似以下的網址：
```
https://taiwan-government-procurement-ai.netlify.app
```

---

## 🔧 自訂網域（選用）

如果您有自己的網域（例如：`procurement.example.com`）：

### GitHub Pages
1. Settings → Pages → Custom domain
2. 輸入您的網域
3. 在您的 DNS 設定中新增 CNAME 記錄

### Vercel / Netlify
1. 專案設定 → Domains
2. 新增您的網域
3. 按照指示設定 DNS

---

## ⚙️ 環境變數設定（重要）

### API Key 管理建議

**目前方式（用戶輸入）**：
- ✅ 用戶自行輸入 API Key
- ✅ 儲存在 localStorage
- ✅ 不會暴露您的 API Key

**如果要內建 API Key（不推薦）**：
- ⚠️ 可能被濫用
- ⚠️ 可能超出配額
- 💡 建議：使用後端 API 代理

---

## 📊 監控與分析

### 新增 Google Analytics（選用）

在 `index.html` 的 `<head>` 區段加入：

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## 🔒 安全性建議

### 1. API Key 保護
- ✅ 在 Google Cloud Console 設定 API Key 限制
- ✅ 限制使用的網域（例如：`barron486.github.io`）
- ✅ 設定每日配額限制

### 2. CORS 設定
- ✅ 確保 API 來源正確設定
- ✅ 使用 HTTPS（GitHub Pages 自動提供）

### 3. 內容安全政策（CSP）
如需加強安全性，可在 `index.html` 加入：

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://generativelanguage.googleapis.com; 
               style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com;">
```

---

## 🚀 持續部署（CI/CD）

### GitHub Pages
- ✅ **自動部署**：每次 push 到 main 分支會自動更新

### 未來更新流程
```bash
# 1. 修改程式碼
# 2. 提交更新
git add .
git commit -m "更新說明"
git push origin main

# 3. 等待 1-3 分鐘，網站自動更新
```

---

## 📱 PWA 化（選用進階功能）

讓您的網站可以像 App 一樣安裝到桌面：

### 1. 創建 `manifest.json`
```json
{
  "name": "台灣政府採購查詢系統",
  "short_name": "採購查詢",
  "description": "AI 智能分析版政府採購查詢系統",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#667eea",
  "theme_color": "#667eea",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 2. 在 `index.html` 加入
```html
<link rel="manifest" href="/manifest.json">
```

---

## 🎉 部署完成檢查清單

- [ ] ✅ 程式碼已推送到 GitHub
- [ ] ✅ GitHub Pages 已啟用
- [ ] ✅ 網站可以正常訪問
- [ ] ✅ 所有功能正常運作
- [ ] ✅ API Key 限制已設定
- [ ] ✅ 自動監控功能測試
- [ ] ✅ 分享功能測試
- [ ] ✅ 行動裝置瀏覽測試

---

## 🆘 常見問題

### Q1: 網站顯示 404
**A**: 等待 1-3 分鐘讓 GitHub Pages 完成部署，然後刷新頁面。

### Q2: CSS/JS 沒有載入
**A**: 檢查 GitHub Pages 設定是否正確，確認分支和資料夾設定。

### Q3: API 呼叫失敗
**A**: 
1. 確認 API Key 是否正確
2. 檢查 Google Cloud Console 中的 API Key 限制設定
3. 確認網域限制包含 GitHub Pages 網址

### Q4: 自動監控不工作
**A**: 
1. 確認瀏覽器分頁保持開啟
2. 檢查瀏覽器通知權限
3. 確認監控已啟動（綠色「運作中」狀態）

---

## 📞 技術支援

如有任何問題：
1. 檢查瀏覽器 Console（F12）的錯誤訊息
2. 查看 GitHub Actions 部署日誌
3. 參考 [GitHub Pages 文件](https://docs.github.com/en/pages)

---

**部署時間**: 2025年10月  
**版本**: 2.0 - 含自動監控功能  
**作者**: Barron


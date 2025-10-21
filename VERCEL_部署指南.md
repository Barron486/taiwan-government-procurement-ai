# 🚀 Vercel 部署指南

## 方法一：透過 GitHub 自動部署（推薦）

### 步驟 1：登入 Vercel
1. 前往 https://vercel.com
2. 點擊「Sign Up」或「Log In」
3. 使用 GitHub 帳號登入

### 步驟 2：導入 GitHub 專案
1. 登入後，點擊「Add New...」→「Project」
2. 選擇「Import Git Repository」
3. 授權 Vercel 存取您的 GitHub
4. 找到並選擇 `taiwan-government-procurement-ai` 專案
5. 點擊「Import」

### 步驟 3：配置專案設定
Vercel 會自動檢測到您的 `vercel.json` 設定檔，無需額外配置。

**自動配置項目：**
- ✅ Framework Preset: Other
- ✅ Root Directory: `./`
- ✅ Build Command: (自動)
- ✅ Output Directory: (自動)
- ✅ Install Command: `npm install`

### 步驟 4：部署
1. 確認所有設定無誤
2. 點擊「Deploy」按鈕
3. 等待部署完成（通常 1-2 分鐘）

### 步驟 5：取得部署網址
部署成功後，您會看到：
- **Production URL**: `https://taiwan-government-procurement-ai-xxxx.vercel.app`
- 點擊「Visit」查看您的網站

---

## 方法二：使用 Vercel CLI（需要安裝 Node.js）

### 前置需求
確保已安裝 Node.js 和 npm：
```bash
# 檢查是否已安裝
node --version
npm --version
```

如果沒有安裝，請前往 https://nodejs.org 下載安裝。

### 安裝 Vercel CLI
```bash
npm install -g vercel
```

### 登入 Vercel
```bash
vercel login
```
系統會開啟瀏覽器，請用 GitHub 帳號登入。

### 部署專案
```bash
cd /Users/Barron/taiwan-government-procurement-ai
vercel --prod
```

按照提示操作：
1. Set up and deploy? → **Y**
2. Which scope? → 選擇您的帳號
3. Link to existing project? → **N**
4. What's your project's name? → `taiwan-government-procurement-ai`
5. In which directory is your code located? → `./`
6. Want to override the settings? → **N**

部署完成後會顯示您的專案網址。

---

## 方法三：使用 Vercel Desktop App

### 下載並安裝
1. 前往 https://vercel.com/download
2. 下載適合您系統的版本
3. 安裝並啟動應用程式

### 部署專案
1. 用 GitHub 帳號登入
2. 拖曳專案資料夾到視窗中
3. 點擊「Deploy」

---

## 部署後檢查清單

### ✅ 功能測試
部署成功後，請測試以下功能：

1. **主頁面**
   - [ ] 搜尋功能正常
   - [ ] 可以查看詳細資料
   - [ ] 分享功能正常

2. **公司分析頁面**
   - [ ] 可以搜尋公司
   - [ ] 顯示得標記錄
   - [ ] AI 分析功能正常（需要 API Key）

3. **API 代理**
   - [ ] 沒有 CORS 錯誤
   - [ ] 搜尋速度正常
   - [ ] 資料正確顯示

### 🔧 如果遇到問題

#### 問題 1：500 Internal Server Error
**解決方法：**
1. 檢查 Vercel 控制台的 Logs
2. 確認 `api/proxy.js` 沒有語法錯誤
3. 檢查 `vercel.json` 配置是否正確

#### 問題 2：API 代理不工作
**解決方法：**
1. 檢查 `config.js` 中的環境偵測邏輯
2. 開啟瀏覽器 Console 確認是否使用代理模式
3. 檢查 Network 標籤，確認請求路徑正確

#### 問題 3：部署成功但頁面空白
**解決方法：**
1. 清除瀏覽器快取
2. 檢查 Console 是否有 JavaScript 錯誤
3. 確認 `index.html` 中的所有資源路徑正確

---

## 環境變數設定（選用）

如果需要設定環境變數：

1. 進入 Vercel 專案設定
2. 點擊「Settings」→「Environment Variables」
3. 新增變數：
   - `GEMINI_API_KEY`: 您的 Gemini API Key
   - `NODE_VERSION`: `22.x`

---

## 自動部署

連接 GitHub 後，每次推送到 `main` 分支都會自動部署：

```bash
git add .
git commit -m "更新內容"
git push origin main
```

Vercel 會自動：
1. 偵測到新的 commit
2. 開始建置
3. 部署到 production
4. 更新您的網站

---

## 域名設定（選用）

### 使用自訂域名
1. 進入 Vercel 專案設定
2. 點擊「Domains」
3. 輸入您的域名
4. 按照指示設定 DNS 記錄

### 使用 Vercel 子域名
預設會分配一個 `.vercel.app` 域名，例如：
- `taiwan-government-procurement-ai.vercel.app`

---

## 監控與分析

### 查看部署日誌
1. 進入專案控制台
2. 點擊「Deployments」
3. 選擇特定部署查看詳細日誌

### 查看函數日誌
1. 點擊「Functions」標籤
2. 查看 API 函數的執行情況
3. 檢查錯誤和效能

---

## 成本說明

Vercel 免費方案包含：
- ✅ 無限部署
- ✅ 100GB 頻寬/月
- ✅ 1000 個 Serverless Function 調用/月
- ✅ 自動 HTTPS
- ✅ 全球 CDN

對於個人專案來說，免費方案通常已經足夠。

---

## 快速連結

- Vercel 官網: https://vercel.com
- Vercel 文件: https://vercel.com/docs
- GitHub 整合: https://vercel.com/docs/git/vercel-for-github
- Serverless Functions: https://vercel.com/docs/functions

---

## 需要幫助？

如果在部署過程中遇到任何問題，請：
1. 檢查 Vercel 控制台的錯誤訊息
2. 查看瀏覽器 Console 的錯誤
3. 參考 `VERCEL_DEPLOYMENT.md` 中的詳細說明

祝您部署順利！🚀


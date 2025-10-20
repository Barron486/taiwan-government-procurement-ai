# 🚀 Vercel 部署指南 - API 代理版本

## 📋 為什麼需要 Vercel？

### 問題
- ❌ 政府採購 API 沒有官方 CORS 支援
- ❌ 第三方 API 有嚴格的速率限制（429 錯誤）
- ❌ GitHub Pages 純前端無法解決 CORS 問題

### 解決方案
- ✅ **Vercel Serverless Functions** 作為 API 代理
- ✅ 完全免費（每月 100GB 流量，100k 次請求）
- ✅ 全球 CDN 加速
- ✅ 自動 HTTPS
- ✅ 內建快取機制

---

## 🚀 快速部署（3 分鐘）

### 步驟 1: 註冊 Vercel

1. 前往 [Vercel](https://vercel.com)
2. 點擊 **Sign Up**
3. 選擇 **Continue with GitHub**
4. 授權 Vercel 訪問您的 GitHub

### 步驟 2: 匯入專案

1. 在 Vercel Dashboard 點擊 **Add New...** → **Project**
2. 找到 `taiwan-government-procurement-ai` repository
3. 點擊 **Import**

### 步驟 3: 配置專案

保持所有預設設定：

```
Framework Preset: Other
Root Directory: ./
Build Command: (留空)
Output Directory: (留空)
Install Command: (留空)
```

### 步驟 4: 部署

1. 點擊 **Deploy**
2. 等待 1-2 分鐘
3. 部署完成！

---

## 🌐 獲取您的 API 端點

部署完成後，您會獲得兩個 URL：

### 1. 主網站
```
https://taiwan-government-procurement-ai.vercel.app
```

### 2. API 代理端點
```
https://taiwan-government-procurement-ai.vercel.app/api/proxy
```

---

## 🔧 API 使用方式

### 基本格式
```
GET /api/proxy?path={原始路徑}&{其他參數}
```

### 範例

#### 搜尋標案
```
GET /api/proxy?path=/searchbytitle&query=醫療&page=1
```

#### 取得標案詳情
```
GET /api/proxy?path=/tender&unit_id=A.9.51.1.9&job_number=AD14E05A
```

#### 搜尋公司
```
GET /api/proxy?path=/searchbycompanyname&query=台積電&page=1
```

---

## 📊 快取機制

API 代理內建智能快取：

| 類型 | 快取時間 | 說明 |
|------|----------|------|
| 搜尋結果 | 5 分鐘 | `/search*` 路徑 |
| 標案詳情 | 1 小時 | `/tender` 路徑 |
| 列表資料 | 10 分鐘 | `/listbyunit` 路徑 |

**優點**：
- ✅ 減少對原始 API 的請求
- ✅ 降低觸發速率限制的機會
- ✅ 提升回應速度

---

## 🔄 自動部署

### GitHub 連接

Vercel 已自動連接您的 GitHub repository：

**每次 push 到 main 分支時**：
1. ✅ Vercel 自動偵測變更
2. ✅ 自動建置和部署
3. ✅ 約 1-2 分鐘完成
4. ✅ 立即生效

### 部署狀態

在 Vercel Dashboard 可以看到：
- 部署歷史
- 建置日誌
- 效能指標
- 錯誤追蹤

---

## 📈 監控與分析

### 查看使用量

在 Vercel Dashboard → Analytics 可以看到：
- 📊 請求次數
- ⏱️ 回應時間
- 🌍 使用者地區
- 🔥 熱門端點

### 免費額度

Vercel 免費方案提供：
- ✅ 100GB 流量/月
- ✅ 100,000 次 Serverless Function 執行/月
- ✅ 無限網站數量
- ✅ 自動 SSL 憑證

**足夠個人專案使用！**

---

## 🎯 前端整合

### 自動切換

前端已配置為自動檢測環境：

```javascript
// 本地開發 (localhost)
使用直接 API：https://pcc-api.openfun.app/api

// 生產環境 (vercel.app, github.io)
使用 Vercel 代理：https://taiwan-government-procurement-ai.vercel.app/api/proxy
```

### 無需手動設定

`config.js` 會自動處理：
- ✅ 環境檢測
- ✅ API 切換
- ✅ URL 構建

---

## 🔒 安全性設定

### 環境變數（選用）

如果需要加入 API Key 或其他敏感資訊：

1. Vercel Dashboard → Settings → Environment Variables
2. 新增變數：
   ```
   API_KEY=your_secret_key
   ```
3. 在 `api/proxy.js` 中使用：
   ```javascript
   const apiKey = process.env.API_KEY;
   ```

### CORS 設定

已在 `vercel.json` 配置：
- ✅ 允許所有來源（`*`）
- ✅ 支援 GET、POST、OPTIONS
- ✅ 允許 Content-Type header

**如需限制特定網域**，修改 `vercel.json`：
```json
{
  "key": "Access-Control-Allow-Origin",
  "value": "https://yourdomain.com"
}
```

---

## 🐛 故障排除

### API 代理沒有回應

**檢查**：
1. Vercel 部署狀態（Dashboard → Deployments）
2. 瀏覽器 Console 的錯誤訊息
3. Vercel Function Logs（Dashboard → Functions）

**解決**：
```bash
# 本地測試
vercel dev

# 重新部署
vercel --prod
```

### CORS 錯誤

**檢查**：
- `vercel.json` 中的 CORS 設定
- 瀏覽器 Network 面板的 Response Headers

**解決**：
確認 `vercel.json` 包含正確的 CORS headers

### 快取問題

**清除快取**：
- Vercel Dashboard → Settings → Data Cache → Purge
- 或等待快取自動過期

---

## 📞 支援資源

### Vercel 文件
- [Serverless Functions](https://vercel.com/docs/functions)
- [部署設定](https://vercel.com/docs/deployments)
- [環境變數](https://vercel.com/docs/environment-variables)

### 專案文件
- `api/proxy.js` - API 代理原始碼
- `config.js` - 前端 API 配置
- `vercel.json` - Vercel 部署配置

---

## 🎉 部署完成檢查清單

- [ ] ✅ Vercel 帳號已建立
- [ ] ✅ GitHub repository 已連接
- [ ] ✅ 專案已部署成功
- [ ] ✅ API 代理端點可訪問
- [ ] ✅ 前端可正常呼叫 API
- [ ] ✅ 沒有 CORS 錯誤
- [ ] ✅ 沒有 429 速率限制錯誤

---

## 💡 進階優化

### 1. 自訂網域

```bash
# Vercel Dashboard → Settings → Domains
# 新增您的網域並設定 DNS
```

### 2. 效能優化

```javascript
// 調整快取時間（api/proxy.js）
const CACHE_TIME = {
    search: 600,   // 改為 10 分鐘
    tender: 7200,  // 改為 2 小時
    list: 1200     // 改為 20 分鐘
};
```

### 3. 速率限制保護

```javascript
// 在 api/proxy.js 加入請求限制
const requestCounts = new Map();

function checkRateLimit(ip) {
    const count = requestCounts.get(ip) || 0;
    if (count > 100) {  // 每 IP 每分鐘 100 次
        throw new Error('請求過於頻繁');
    }
    requestCounts.set(ip, count + 1);
    setTimeout(() => requestCounts.delete(ip), 60000);
}
```

---

**部署時間**: 2025年10月  
**版本**: 2.0 - Vercel API 代理版本  
**作者**: Barron


# 政府採購 API 使用說明

## API 來源

- **官方 API**: `https://pcc-api.openfun.app/api`
- **舊網址**: `https://pcc.g0v.ronny.tw/api` (會重定向到上面的網址)
- **開源專案**: https://github.com/openfunltd/pcc.g0v.ronny.tw
- **授權**: BSD License

## Cloudflare 403 問題說明

### 為什麼 curl 測試會失敗？

當使用命令列工具（如 curl）測試 API 時，會收到 **403 Forbidden** 錯誤：

```bash
curl "https://pcc-api.openfun.app/api/searchbycompanyname?query=測試&page=1"
# HTTP/2 403
# cf-mitigated: challenge
```

**原因**：
- Cloudflare 的安全防護會檢查請求的來源
- 命令列工具缺少瀏覽器特有的 headers（User-Agent、Cookies 等）
- Cloudflare 將其視為潛在的自動化攻擊而阻擋

### 在瀏覽器中為什麼可以正常運作？

瀏覽器發送請求時會自動包含：
- ✅ 正確的 User-Agent
- ✅ Accept headers
- ✅ Cookies（如果有 Cloudflare challenge cookies）
- ✅ Referer 資訊
- ✅ 其他瀏覽器特徵

因此 Cloudflare 會允許瀏覽器的請求通過。

## 測試方法

### ❌ 錯誤的測試方式

```bash
# 這會失敗（403）
curl "https://pcc-api.openfun.app/api/searchbycompanyname?query=測試"
```

### ✅ 正確的測試方式

1. **使用瀏覽器**
   - 直接在瀏覽器中開啟 API URL
   - 使用瀏覽器的開發者工具 (F12) 查看 Network 標籤

2. **使用我們的調試工具**
   ```
   開啟 debug_api.html
   點擊測試按鈕
   ```

3. **在網頁應用中使用**
   ```javascript
   // 這在網頁中會正常運作
   fetch('https://pcc-api.openfun.app/api/searchbycompanyname?query=測試&page=1')
       .then(r => r.json())
       .then(data => console.log(data));
   ```

## 可用的 API 端點

### 1. 搜尋相關

#### 依公司名稱搜尋
```
GET /api/searchbycompanyname
參數:
  - query: 公司名稱
  - page: 頁數(1開始)
```

#### 依標案名稱搜尋
```
GET /api/searchbytitle
參數:
  - query: 標案名稱
  - page: 頁數(1開始)
```

#### 依統一編號搜尋
```
GET /api/searchbycompanyid
參數:
  - query: 統一編號
  - page: 頁數(1開始)
```

### 2. 列表相關

#### 取得標案詳細資料
```
GET /api/tender
參數:
  - unit_id: 單位代碼
  - job_number: 標案代碼
```

#### 列出特定機關的標案
```
GET /api/listbyunit
參數:
  - unit_id: 機關代碼
  - page: 頁數(1開始)
```

#### 列出特定日期的標案
```
GET /api/listbydate
參數:
  - date: 日期(YYYYMMDD格式)
```

### 3. 資訊相關

#### 取得資料狀況
```
GET /api/getinfo
回傳:
  - 最新資料時間
  - 最舊資料時間
  - 公告數
```

#### API 列表
```
GET /api/
回傳: 所有可用的 API 列表
```

## 回應格式

```json
{
  "query": "搜尋關鍵字",
  "page": 1,
  "total_records": 304,
  "total_pages": 4,
  "took": 0.123,
  "records": [
    {
      "date": "20230829",
      "filename": "BDM-1-70370443",
      "unit_id": "A.1.2.3",
      "job_number": "AD12345",
      "unit_name": "機關名稱",
      "brief": {
        "type": "決標公告",
        "title": "標案名稱",
        "category": "工程類",
        "companies": {
          "names": ["公司A", "公司B"],
          "winner": ["公司A"]
        }
      },
      "detail": {
        "機關資料:機關名稱": "...",
        "採購資料:預算金額": "...",
        "決標資料:總決標金額": "...",
        ...
      }
    }
  ]
}
```

## 目前系統配置

我們的系統已經正確配置：

```javascript
// index.html 和 company_analysis.html
const API_BASE = 'https://pcc-api.openfun.app/api';
```

這是正確的配置，無需修改。

## 如果 API 真的無法使用怎麼辦？

如果遇到持續的 API 問題，可以考慮：

1. **檢查瀏覽器 Console**
   - 按 F12 打開開發者工具
   - 查看 Console 和 Network 標籤
   - 確認是否有實際的網路錯誤

2. **使用備用來源**
   - 可以考慮本地快取
   - 或使用其他政府採購資料來源

3. **回報問題**
   - 到 GitHub Issues: https://github.com/openfunltd/pcc.g0v.ronny.tw/issues
   - 說明問題和錯誤訊息

## 結論

✅ 我們目前使用的 API (`pcc-api.openfun.app`) 是正確的  
✅ curl 測試失敗是正常的（Cloudflare 防護）  
✅ 在瀏覽器中應該可以正常運作  
✅ 請使用 `debug_api.html` 在瀏覽器中測試

# 詳細資料處理流程 - 視覺化說明

## 🎯 快速理解

詳細資料處理是一個**四階段**的過程：

```
🖱️ 點擊 → 📡 請求 → 🔄 處理 → 📺 顯示
```

---

## 📊 階段一：用戶點擊「詳細資料」

### 在搜尋結果中：

```html
┌─────────────────────────────────────────────┐
│  標案卡片                                    │
├─────────────────────────────────────────────┤
│  標題: 試劑採購案                           │
│  機關: 衛生福利部臺南醫院                   │
│  日期: 2023/10/15                            │
│                                               │
│  [詳細資料] [AI對話] [分享▼]               │
│     ↑                                         │
│     點擊這裡！                               │
└─────────────────────────────────────────────┘
```

### 觸發的函數調用：

```javascript
showDetail(
    'A.9.51.1.9',    // unitId - 機關代碼
    'AD14E05A',      // jobNumber - 標案編號  
    '20231015'       // date - 日期
)
```

---

## 📡 階段二：API 請求與重試

### 請求流程：

```
第1次嘗試
    ↓
發送 HTTP 請求 → API: /tender?unit_id=...&job_number=...
    ↓
設定10秒超時
    ↓
等待回應...
    │
    ├──→ 成功 (200 OK) → 繼續處理 ✅
    │
    └──→ 失敗 (403/404/timeout)
            ↓
         等待 1 秒
            ↓
       第2次嘗試
            ↓
         失敗？
            ↓
         等待 2 秒
            ↓
       第3次嘗試
            ↓
         失敗？
            ↓
       顯示錯誤訊息 ❌
```

### 實際的 API 請求：

```http
GET https://pcc-api.openfun.app/api/tender?unit_id=A.9.51.1.9&job_number=AD14E05A
Headers:
  Accept: application/json
  Content-Type: application/json
  Cache-Control: no-cache
```

---

## 🔄 階段三：資料處理與解析

### 3.1 接收 API 回應

```json
{
  "records": [
    {
      "unit_id": "A.9.51.1.9",
      "job_number": "AD14E05A",
      "date": "20231015",
      "brief": { ... },
      "detail": { ... }
    },
    {
      "unit_id": "A.9.51.1.9",
      "job_number": "AD14E05A",
      "date": "20231020",
      "brief": { ... },
      "detail": { ... }
    }
  ]
}
```

### 3.2 資料提取

```javascript
// Step 1: 取得記錄陣列
const records = data.records || [data];
// 結果: [record1, record2, ...]

// Step 2: 取第一筆作為主要顯示
const currentRecord = records[0];

// Step 3: 提取結構化資料
const brief = currentRecord.brief || {};
const detail = currentRecord.detail || {};

// Step 4: 保存所有記錄供分頁使用
window.tenderRecords = records;
```

### 3.3 資料映射

```
API 欄位名稱                    →   顯示名稱
═══════════════════════════════════════════════════
brief.title                     →   標案名稱
brief.type                      →   標案類型
detail['機關資料:機關名稱']     →   機關名稱
detail['採購資料:預算金額']     →   預算金額
detail['領投開標:開標時間']     →   開標時間
detail['招標資料:招標方式']     →   招標方式
detail['決標資料:總決標金額']   →   總決標金額
detail['投標廠商:投標廠商1:廠商名稱'] → 得標廠商
```

### 3.4 日期格式化

```javascript
// 原始: "20231015"
const dateStr = "20231015";

// 提取各部分
const year = dateStr.substring(0, 4);   // "2023"
const month = dateStr.substring(4, 6);  // "10"
const day = dateStr.substring(6, 8);    // "15"

// 格式化輸出
const formattedDate = `${year}年${month}月${day}日`;
// 結果: "2023年10月15日"
```

### 3.5 民國年轉西元年 (行事曆功能)

```javascript
// 原始: "114/10/03 15:30"
const dateStr = "114/10/03 15:30";

// 分割日期和時間
const [datePart, timePart] = dateStr.split(' ');
// datePart: "114/10/03"
// timePart: "15:30"

// 分割日期
const [y, m, d] = datePart.split('/');
// y: "114" (民國年)

// 民國年 → 西元年
const year = parseInt(y) + 1911;
// 114 + 1911 = 2025

// 最終: 2025年10月03日 15:30
```

---

## 📺 階段四：Modal 顯示

### 4.1 清理舊 Modal

```javascript
// 步驟 1: 找到舊的 Modal
const oldModal = document.getElementById('detailModal');

// 步驟 2: 銷毀 Bootstrap 實例
if (oldModal) {
    const bsModal = bootstrap.Modal.getInstance(oldModal);
    if (bsModal) {
        bsModal.dispose();  // 清理事件監聽器和資源
    }
    oldModal.remove();  // 從 DOM 移除
}

// 步驟 3: 清理背景遮罩
document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.remove();
});

// 步驟 4: 重置 body 樣式
document.body.classList.remove('modal-open');
document.body.style.overflow = '';
document.body.style.paddingRight = '';
```

**為什麼需要這麼仔細清理？**
- 避免多個 Modal 重疊
- 避免背景遮罩殘留
- 避免 body 滾動被鎖定
- 避免記憶體洩漏

---

### 4.2 創建新 Modal

```javascript
// 步驟 1: 將 HTML 插入頁面
document.body.insertAdjacentHTML('beforeend', detailHtml);

// 步驟 2: 取得 Modal 元素
const modalElement = document.getElementById('detailModal');

// 步驟 3: 初始化 Bootstrap Modal
const modal = new bootstrap.Modal(modalElement, {
    backdrop: true,   // 顯示背景遮罩
    keyboard: true,   // 允許 ESC 關閉
    focus: true       // 自動聚焦
});

// 步驟 4: 顯示 Modal
modal.show();
```

---

### 4.3 事件監聽

```javascript
// 監聽顯示完成事件
modalElement.addEventListener('shown.bs.modal', function () {
    console.log('✅ Modal 已成功顯示');
    // 可以在這裡執行額外的初始化
});

// 監聽關閉事件
modalElement.addEventListener('hidden.bs.modal', function () {
    console.log('Modal 已關閉，開始清理');
    // 清理資源
    modalElement.remove();
    document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
});
```

---

## 🎨 Modal 內容結構

```
┌────────────────────────────────────────────────────────┐
│  標案詳細資料                                     [✕]  │
├────────────────────────────────────────────────────────┤
│                                                         │
│  【標案進度分頁】(如果有多筆記錄)                     │
│  [2023/10/15 招標公告] [2023/10/20 決標公告*]        │
│                                                         │
│  ┌───────────────────────────────────────────────┐   │
│  │ 基本資訊                                       │   │
│  ├───────────────────────────────────────────────┤   │
│  │ 標案名稱    │ 試劑採購案                      │   │
│  │ 標案類型    │ 決標公告                        │   │
│  │ 機關名稱    │ 衛生福利部臺南醫院              │   │
│  │ 預算金額    │ 1,000,000 元                    │   │
│  └───────────────────────────────────────────────┘   │
│                                                         │
│  ┌───────────────────────────────────────────────┐   │
│  │ 招標資訊                                       │   │
│  ├───────────────────────────────────────────────┤   │
│  │ 招標方式    │ 公開招標                        │   │
│  │ 決標方式    │ 最低標                          │   │
│  │ 開標時間    │ 114/10/03 15:30                 │   │
│  │ 開標地點    │ 本院一樓會議室                  │   │
│  │ 截止投標    │ 114/10/01 17:00                 │   │
│  └───────────────────────────────────────────────┘   │
│                                                         │
│  【重要時間提醒】                                      │
│  [📅 開標時間加入行事曆] [⏰ 截止投標加入行事曆]     │
│                                                         │
│  【相關公司】                                          │
│  • 公司 A                                              │
│  • 公司 B                                              │
│                                                         │
│  [🔗 查看完整標案頁面] [✕ 關閉此頁面]                │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## 🔍 detail 欄位命名規則

### 格式: `主類別:子類別:項目`

```
機關資料:機關名稱
│      │  └─ 項目名稱
│      └──── 子類別
└─────────── 主類別

領投開標:開標時間
│      │  └─ 項目名稱
│      └──── 子類別（領標投標開標）
└─────────── 主類別

投標廠商:投標廠商1:廠商名稱
│      │       │    └─ 項目名稱
│      │       └────── 廠商編號
│      └────────────── 子類別
└───────────────────── 主類別
```

### 常用欄位分類：

#### 📌 機關相關
- `機關資料:機關名稱`
- `機關資料:單位名稱`
- `機關資料:機關地址`
- `機關資料:聯絡人`

#### 💰 金額相關
- `採購資料:預算金額`
- `採購資料:決標金額`
- `決標資料:總決標金額`
- `投標廠商:投標廠商1:決標金額`

#### 📅 時間相關
- `領投開標:開標時間`
- `領投開標:截止投標`
- `決標資料:決標日期`

#### 🏢 廠商相關
- `投標廠商:投標廠商1:廠商名稱`
- `投標廠商:投標廠商1:是否得標`
- `投標廠商:投標廠商2:廠商名稱`

#### 📝 招標相關
- `招標資料:招標方式`
- `招標資料:決標方式`
- `招標資料:是否訂有底價`

---

## 💡 實際案例演示

### 案例：查看「免疫染色試劑採購案」詳細資料

#### Step 1: 用戶點擊
```javascript
// 傳遞參數
unitId = "A.9.51.1.9"
jobNumber = "AD14E05A"  
date = "20231015"
```

#### Step 2: API 請求
```
GET https://pcc-api.openfun.app/api/tender?unit_id=A.9.51.1.9&job_number=AD14E05A

等待回應... (最多10秒)
```

#### Step 3: 收到資料
```json
{
  "records": [
    {
      "brief": {
        "title": "免疫染色試劑採購",
        "type": "決標公告"
      },
      "detail": {
        "機關資料:機關名稱": "衛生福利部臺南醫院",
        "採購資料:預算金額": "1,000,000 元",
        "決標資料:總決標金額": "950,000 元",
        "領投開標:開標時間": "114/10/03 15:30",
        "投標廠商:投標廠商1:廠商名稱": "龐德生技有限公司",
        "投標廠商:投標廠商1:決標金額": "950,000 元"
      }
    }
  ]
}
```

#### Step 4: 提取資料
```javascript
const brief = {
  title: "免疫染色試劑採購",
  type: "決標公告"
}

const detail = {
  "機關資料:機關名稱": "衛生福利部臺南醫院",
  "採購資料:預算金額": "1,000,000 元",
  "決標資料:總決標金額": "950,000 元",
  ...
}
```

#### Step 5: 生成顯示內容
```
標案名稱: 免疫染色試劑採購
標案類型: 決標公告
機關名稱: 衛生福利部臺南醫院
預算金額: 1,000,000 元

招標方式: 公開招標
開標時間: 114/10/03 15:30
↓
[📅 開標時間加入行事曆]  ← 點擊後調用 addToCalendar()
```

#### Step 6: 顯示 Modal
```
┌──────────────────────────────────┐
│  標案詳細資料              [✕]  │
├──────────────────────────────────┤
│                                   │
│  [完整的標案資訊表格]            │
│                                   │
│  [📅 開標時間加入行事曆]        │
│  [⏰ 截止投標加入行事曆]        │
│                                   │
│  [🔗 查看完整標案頁面]          │
│  [✕ 關閉此頁面]                │
│                                   │
└──────────────────────────────────┘
```

---

## 🧩 特殊功能說明

### 1. 分頁功能（多筆公告）

當同一標案有多次公告時：

```
招標公告 (10/01) → 更新公告 (10/10) → 決標公告 (10/20)
    ↓                  ↓                  ↓
 records[0]        records[1]         records[2]
    ↓                  ↓                  ↓
[10/01 招標公告] [10/10 更新公告] [10/20 決標公告*]
                                              ↑
                                         當前顯示
```

**切換方式**:
```javascript
// 點擊分頁按鈕
<button onclick="switchTenderRecord(2)">
    10/20<br>決標公告
</button>

// 函數處理
function switchTenderRecord(index) {
    // 從 window.tenderRecords 取得對應記錄
    const record = window.tenderRecords[index];
    
    // 更新顯示內容（不重建 Modal）
    document.getElementById('tenderDetailContent').innerHTML = `...`;
}
```

---

### 2. 行事曆功能

**資料轉換流程**:

```
原始資料: "114/10/03 15:30"
    ↓
分割: ["114/10/03", "15:30"]
    ↓
民國年轉西元年: 114 + 1911 = 2025
    ↓
格式化: "20251003T153000"
    ↓
構建 Google Calendar URL:
https://calendar.google.com/calendar/render?
  action=TEMPLATE
  &text=試劑採購案 - 開標
  &dates=20251003T153000/20251003T163000
  &details=機關：衛生福利部臺南醫院...
  &location=衛生福利部臺南醫院
    ↓
開啟新分頁
```

---

### 3. 政府採購網連結

**連結優先順序**:

```
1. detail.url (如果是 web.pcc.gov.tw)
   ✅ 最準確
   ↓
2. detail.pkPmsMain
   https://web.pcc.gov.tw/tps/QueryTender/query/searchTenderDetail?pkPmsMain=XXX
   ✅ 次準確
   ↓
3. record.url (如果是 web.pcc.gov.tw)
   ✅ 可用
   ↓
4. record.url (g0v 整理的資料)
   https://pcc.g0v.ronny.tw/tender.html?...
   ⚠️ 備用方案
   ↓
5. '#'
   ❌ 無法取得連結
```

**實際執行**:
```javascript
function buildGovUrl(record) {
    if (record.detail?.url?.startsWith('https://web.pcc.gov.tw')) {
        return record.detail.url;  // 方案1
    }
    if (record.detail?.pkPmsMain) {
        return `https://web.pcc.gov.tw/...?pkPmsMain=${record.detail.pkPmsMain}`;  // 方案2
    }
    if (record.url?.startsWith('https://web.pcc.gov.tw')) {
        return record.url;  // 方案3
    }
    if (record.url) {
        return record.url.startsWith('http') ? 
            record.url : 
            `https://pcc.g0v.ronny.tw${record.url}`;  // 方案4
    }
    return '#';  // 方案5
}
```

---

## ⚠️ 常見問題處理

### 問題 1: Modal 沒有顯示

**可能原因**:
1. ❌ 舊 Modal 沒有清理乾淨
2. ❌ Bootstrap 未正確載入
3. ❌ Modal HTML 生成錯誤

**解決方式**:
```javascript
// 檢查點 1: Modal 元素是否存在
const modalElement = document.getElementById('detailModal');
if (!modalElement) {
    throw new Error('無法創建 modal 元素');
}

// 檢查點 2: Bootstrap 是否可用
if (typeof bootstrap === 'undefined') {
    throw new Error('Bootstrap 未載入');
}

// 檢查點 3: 完整清理舊 Modal
// (已在代碼中實現)
```

---

### 問題 2: 資料顯示「無資料」

**可能原因**:
1. ❌ API 回應中沒有該欄位
2. ❌ 欄位名稱拼寫錯誤
3. ❌ 資料結構不符合預期

**調試方式**:
```javascript
// 在 Console 中檢查
console.log('完整 detail:', detail);
console.log('所有欄位:', Object.keys(detail));

// 尋找特定欄位
Object.keys(detail).forEach(key => {
    if (key.includes('金額')) {
        console.log('金額欄位:', key, '=', detail[key]);
    }
});
```

---

### 問題 3: 行事曆時間不正確

**可能原因**:
1. ❌ 民國年轉換錯誤
2. ❌ 日期格式不符合預期

**驗證方式**:
```javascript
// 測試民國年轉換
const minguo = 114;
const western = minguo + 1911;
console.log(`民國 ${minguo} 年 = 西元 ${western} 年`);
// 應該輸出: 民國 114 年 = 西元 2025 年

// 測試日期解析
const dateStr = "114/10/03 15:30";
console.log('原始:', dateStr);
// 預期輸出: 2025-10-03 15:30
```

---

## 📈 資料流動圖

```
                        🖱️ 用戶點擊
                             │
                             ↓
              ┌──────────────────────────┐
              │   showDetail()           │
              │   - 準備參數             │
              │   - 初始化重試機制       │
              └──────────┬───────────────┘
                         │
                         ↓
              ┌──────────────────────────┐
              │   API 請求 (重試最多3次) │
              │   - 設定超時 (10秒)      │
              │   - CORS 模式            │
              │   - JSON 格式            │
              └──────────┬───────────────┘
                         │
           ┌─────────────┴─────────────┐
           │                           │
           ↓ 成功                      ↓ 失敗
┌──────────────────┐        ┌──────────────────┐
│   解析 JSON      │        │   錯誤處理       │
│   - records[]    │        │   - 重試         │
│   - brief        │        │   - 顯示錯誤     │
│   - detail       │        └──────────────────┘
└────────┬─────────┘
         │
         ↓
┌──────────────────────────┐
│   資料提取               │
│   - currentRecord        │
│   - 格式化日期           │
│   - 建立分頁按鈕         │
└────────┬─────────────────┘
         │
         ↓
┌──────────────────────────┐
│   生成 HTML              │
│   - 基本資訊表格         │
│   - 招標資訊表格         │
│   - 行事曆按鈕           │
│   - 相關公司列表         │
└────────┬─────────────────┘
         │
         ↓
┌──────────────────────────┐
│   Modal 管理             │
│   - 清理舊 Modal         │
│   - 創建新 Modal         │
│   - 綁定事件             │
└────────┬─────────────────┘
         │
         ↓
┌──────────────────────────┐
│   顯示給用戶             │
│   - modal.show()         │
│   - 用戶可以互動         │
└──────────────────────────┘
```

---

## 🎓 關鍵技術點

### 1. Promise 與 async/await
```javascript
// 使用 async/await 處理異步操作
async function showDetail(unitId, jobNumber, date) {
    const response = await fetch(...);  // 等待請求完成
    const data = await response.json(); // 等待解析完成
    // 繼續處理...
}
```

### 2. AbortController (超時控制)
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000);

fetch(url, { signal: controller.signal })
    .then(...)
    .finally(() => clearTimeout(timeoutId));
```

### 3. 模板字串 (Template Literals)
```javascript
const html = `
    <div>${title}</div>
    <div>${detail['機關資料:機關名稱'] || '無資料'}</div>
`;
```

### 4. 可選鏈 (Optional Chaining)
```javascript
const companyNames = brief.companies?.names?.length > 0 ? 
    brief.companies.names : [];

// 等同於:
if (brief.companies && brief.companies.names && brief.companies.names.length > 0) {
    companyNames = brief.companies.names;
} else {
    companyNames = [];
}
```

### 5. Bootstrap Modal API
```javascript
// 創建實例
const modal = new bootstrap.Modal(element, options);

// 顯示
modal.show();

// 隱藏
modal.hide();

// 銷毀
modal.dispose();

// 獲取實例
const instance = bootstrap.Modal.getInstance(element);
```

---

## 📝 開發者筆記

### 調試技巧

#### 1. 查看完整的 API 回應
```javascript
console.log('API 回應資料:', data);
console.log('Records 數量:', data.records?.length);
console.log('第一筆 detail 所有欄位:', Object.keys(data.records[0].detail));
```

#### 2. 追蹤 Modal 狀態
```javascript
// 檢查是否有殘留 Modal
console.log('現有 Modal:', document.querySelectorAll('#detailModal').length);
console.log('現有 Backdrop:', document.querySelectorAll('.modal-backdrop').length);
console.log('Body classes:', document.body.className);
```

#### 3. 測試特定欄位
```javascript
// 檢查某個欄位是否存在
const fieldName = '決標資料:總決標金額';
console.log(`${fieldName}:`, detail[fieldName]);

// 列出所有包含「金額」的欄位
Object.keys(detail).forEach(key => {
    if (key.includes('金額')) {
        console.log(key, '=', detail[key]);
    }
});
```

---

## ✅ 完整的處理檢查清單

### 在 showDetail() 函數中：
- [x] 設定重試機制（最多3次）
- [x] 設定超時控制（10秒）
- [x] 發送 API 請求
- [x] 檢查 HTTP 狀態碼
- [x] 解析 JSON 資料
- [x] 提取 records 陣列
- [x] 取得 brief 和 detail
- [x] 格式化日期
- [x] 生成分頁按鈕（如有多筆）
- [x] 生成 Modal HTML
- [x] 清理舊 Modal
- [x] 創建新 Modal
- [x] 顯示 Modal
- [x] 綁定事件監聽
- [x] 錯誤處理

### 在顯示內容時：
- [x] 基本資訊表格
- [x] 招標資訊表格
- [x] 條件顯示行事曆按鈕
- [x] 條件顯示相關公司
- [x] 提供政府採購網連結
- [x] 提供關閉按鈕

---

## 🎯 總結

詳細資料處理是一個**穩健、完整、用戶友善**的系統：

✅ **穩健**: 重試機制、超時控制、錯誤處理  
✅ **完整**: 支援多筆記錄、分頁切換、行事曆整合  
✅ **友善**: 清晰的資料呈現、便捷的操作按鈕、直觀的 UI

**核心流程**:
```
點擊 → API請求 → 資料解析 → HTML生成 → Modal顯示
```

**關鍵技術**:
```
Fetch API + async/await + Bootstrap Modal + 模板字串
```

---

**文檔完成！** 📚

如有任何疑問，請參考此文檔或查看 Console 的詳細日誌。

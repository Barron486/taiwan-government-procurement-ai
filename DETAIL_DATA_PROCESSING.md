# 詳細資料處理流程說明

## 📋 目錄
1. [完整流程概覽](#完整流程概覽)
2. [資料結構說明](#資料結構說明)
3. [處理步驟詳解](#處理步驟詳解)
4. [關鍵函數解析](#關鍵函數解析)
5. [錯誤處理機制](#錯誤處理機制)
6. [資料顯示邏輯](#資料顯示邏輯)

---

## 📊 完整流程概覽

```
使用者點擊「詳細資料」按鈕
    ↓
showDetail(unitId, jobNumber, date) 被調用
    ↓
向 API 發送請求（最多重試3次）
    ↓
API 返回標案詳細資料
    ↓
解析並提取資料結構
    ↓
生成 Modal HTML
    ↓
顯示 Bootstrap Modal
    ↓
用戶查看詳細資料
```

---

## 🗂️ 資料結構說明

### API 回應格式

```javascript
{
  "records": [
    {
      // 基本資訊
      "unit_id": "A.9.51.1.9",           // 機關代碼
      "job_number": "AD14E05A",          // 標案編號
      "date": "20231015",                 // 日期 (YYYYMMDD)
      "unit_name": "衛生福利部臺南醫院", // 機關名稱
      
      // 摘要資訊 (brief)
      "brief": {
        "title": "試劑採購案",          // 標案名稱
        "type": "決標公告",              // 公告類型
        "category": "財物類",            // 標的分類
        "companies": {
          "names": ["公司A", "公司B"],  // 相關公司
          "winner": ["公司A"]            // 得標廠商
        }
      },
      
      // 詳細資料 (detail) - 這是最重要的部分！
      "detail": {
        // 機關資料
        "機關資料:機關名稱": "衛生福利部臺南醫院",
        "機關資料:單位名稱": "醫事室",
        "機關資料:機關地址": "台南市...",
        "機關資料:聯絡人": "王小明",
        
        // 採購資料
        "採購資料:標案案號": "AD14E05A",
        "採購資料:標案名稱": "試劑採購案",
        "採購資料:預算金額": "1,000,000 元",
        "採購資料:決標金額": "950,000 元",
        "採購資料:採購類別": "財物類-醫療器材",
        
        // 招標資料
        "招標資料:招標方式": "公開招標",
        "招標資料:決標方式": "最低標",
        
        // 領投開標資訊
        "領投開標:開標時間": "114/10/03 15:30",
        "領投開標:開標地點": "本院一樓會議室",
        "領投開標:截止投標": "114/10/01 17:00",
        "領投開標:是否須繳納押標金:押標金額度": "20,000 元",
        
        // 決標資料
        "決標資料:決標日期": "114/10/05",
        "決標資料:總決標金額": "950,000 元",
        
        // 投標廠商資料
        "投標廠商:投標廠商1:廠商名稱": "公司A",
        "投標廠商:投標廠商1:是否得標": "是",
        "投標廠商:投標廠商1:決標金額": "950,000 元",
        
        // 政府採購網連結
        "url": "https://web.pcc.gov.tw/...",
        "pkPmsMain": "12345678"  // 政府採購網的主鍵
      }
    },
    // 可能有多筆記錄（同一標案的不同公告）
    { ... },
    { ... }
  ]
}
```

---

## 🔄 處理步驟詳解

### 步驟 1: 用戶觸發事件

**觸發位置**: `index.html` 搜尋結果卡片

```html
<button onclick="showDetail('A.9.51.1.9', 'AD14E05A', '20231015')">
    詳細資料
</button>
```

**傳遞參數**:
- `unitId`: 機關代碼 (例如: "A.9.51.1.9")
- `jobNumber`: 標案編號 (例如: "AD14E05A")
- `date`: 日期 (例如: "20231015")

---

### 步驟 2: 發送 API 請求

**函數**: `showDetail(unitId, jobNumber, date)`

```javascript
async function showDetail(unitId, jobNumber, date) {
    const maxRetries = 3;  // 最多重試3次
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // 1. 顯示載入訊息
            showMessage(`正在載入標案詳細資料... (嘗試 ${attempt}/${maxRetries})`, 'info');
            
            // 2. 創建 AbortController 用於超時控制
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超時
            
            // 3. 發送 API 請求
            const response = await fetch(
                `${API_BASE}/tender?unit_id=${unitId}&job_number=${jobNumber}`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache'
                    },
                    mode: 'cors',
                    signal: controller.signal  // 綁定超時控制
                }
            );
            
            clearTimeout(timeoutId);
            
            // 4. 檢查回應狀態
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // 5. 解析 JSON 資料
            const data = await response.json();
            
            // 繼續處理資料...
            
        } catch (error) {
            lastError = error;
            // 如果不是最後一次嘗試，等待後重試
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            }
        }
    }
}
```

**重試邏輯**:
- 第1次失敗 → 等待 1 秒後重試
- 第2次失敗 → 等待 2 秒後重試
- 第3次失敗 → 顯示錯誤訊息

**超時控制**:
- 每次請求限時 10 秒
- 超時會自動中止請求並重試

---

### 步驟 3: 解析資料結構

```javascript
// 取得所有記錄（可能有多筆）
const records = data.records || [data];
const currentRecord = records[0];

// 提取主要資料結構
const brief = currentRecord.brief || {};
const detail = currentRecord.detail || {};

// 格式化日期
const dateStr = currentRecord.date ? currentRecord.date.toString() : date.toString();
const formattedDate = `${dateStr.substring(0,4)}年${dateStr.substring(4,6)}月${dateStr.substring(6,8)}日`;
```

**資料提取優先順序**:
1. 先檢查 `data.records` 陣列
2. 如果沒有 `records`，使用 `data` 本身
3. 取第一筆記錄作為主要顯示內容
4. 提取 `brief` 和 `detail` 物件

---

### 步驟 4: 處理多筆記錄（分頁功能）

如果同一標案有多次公告（例如：招標公告 → 決標公告），會生成分頁按鈕：

```javascript
const paginationButtons = records.length > 1 ? `
    <div class="mb-3">
        <h6>標案進度分頁</h6>
        <div class="btn-group" role="group">
            ${records.map((record, index) => {
                const recordDate = record.date ? record.date.toString() : '';
                const recordFormattedDate = recordDate ? 
                    `${recordDate.substring(0,4)}年${recordDate.substring(4,6)}月${recordDate.substring(6,8)}日` : '';
                const recordType = record.brief?.type || '無資料';
                const isActive = index === 0 ? 'active' : '';
                
                return `
                    <button type="button" 
                            class="btn btn-outline-primary btn-sm ${isActive}" 
                            onclick="switchTenderRecord(${index})" 
                            data-record-index="${index}">
                        ${recordFormattedDate}<br>
                        <small>${recordType}</small>
                    </button>
                `;
            }).join('')}
        </div>
    </div>
` : '';
```

**分頁邏輯**:
- 檢查 `records.length > 1`
- 為每筆記錄生成一個按鈕
- 按鈕顯示日期和公告類型
- 點擊按鈕調用 `switchTenderRecord(index)` 切換顯示

---

### 步驟 5: 生成 Modal HTML

```javascript
const detailHtml = `
    <div class="modal fade" id="detailModal" tabindex="-1">
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">標案詳細資料</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    ${paginationButtons}
                    
                    <div id="tenderDetailContent">
                        <!-- 基本資訊 -->
                        <h6>基本資訊</h6>
                        <table class="table table-sm">
                            <tr><td><strong>標案名稱</strong></td><td>${brief.title || '無資料'}</td></tr>
                            <tr><td><strong>標案類型</strong></td><td>${brief.type || '無資料'}</td></tr>
                            <tr><td><strong>發布日期</strong></td><td>${formattedDate}</td></tr>
                            <tr><td><strong>機關名稱</strong></td><td>${detail['機關資料:機關名稱'] || '無資料'}</td></tr>
                            <tr><td><strong>標案編號</strong></td><td>${currentRecord.job_number || '無資料'}</td></tr>
                            <tr><td><strong>機關代碼</strong></td><td>${currentRecord.unit_id || '無資料'}</td></tr>
                            <tr><td><strong>分類</strong></td><td>${brief.category || '無資料'}</td></tr>
                            <tr><td><strong>預算金額</strong></td><td>${detail['採購資料:預算金額'] || '無資料'}</td></tr>
                        </table>
                        
                        <!-- 招標資訊 -->
                        <h6 class="mt-3">招標資訊</h6>
                        <table class="table table-sm">
                            <tr><td><strong>招標方式</strong></td><td>${detail['招標資料:招標方式'] || '無資料'}</td></tr>
                            <tr><td><strong>決標方式</strong></td><td>${detail['招標資料:決標方式'] || '無資料'}</td></tr>
                            <tr><td><strong>開標時間</strong></td><td>${detail['領投開標:開標時間'] || '無資料'}</td></tr>
                            <tr><td><strong>開標地點</strong></td><td>${detail['領投開標:開標地點'] || '無資料'}</td></tr>
                            <tr><td><strong>截止投標</strong></td><td>${detail['領投開標:截止投標'] || '無資料'}</td></tr>
                            <tr><td><strong>押標金</strong></td><td>${detail['領投開標:是否須繳納押標金:押標金額度'] || '無資料'}</td></tr>
                        </table>
                        
                        <!-- 重要時間提醒（行事曆功能） -->
                        <div class="mt-3">
                            <h6>重要時間提醒</h6>
                            <div class="d-flex gap-2 flex-wrap">
                                ${detail['領投開標:開標時間'] ? `
                                    <button class="btn btn-outline-primary btn-sm" 
                                            onclick="addToCalendar(...)">
                                        <i class="fas fa-calendar-plus me-1"></i>開標時間加入行事曆
                                    </button>
                                ` : ''}
                                ${detail['領投開標:截止投標'] ? `
                                    <button class="btn btn-outline-warning btn-sm" 
                                            onclick="addToCalendar(...)">
                                        <i class="fas fa-calendar-times me-1"></i>截止投標加入行事曆
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        
                        <!-- 相關公司 -->
                        ${brief.companies?.names?.length > 0 ? `
                            <h6 class="mt-3">相關公司</h6>
                            <ul>
                                ${brief.companies.names.map(name => `<li>${name}</li>`).join('')}
                            </ul>
                        ` : '<p class="mt-3">無相關公司資料</p>'}
                        
                        <!-- 操作按鈕 -->
                        <div class="mt-3">
                            <a href="${buildGovUrl(currentRecord)}" target="_blank" class="btn btn-primary me-2">
                                <i class="fas fa-external-link-alt me-1"></i>查看完整標案頁面
                            </a>
                            <button class="btn btn-secondary me-2" onclick="closeDetailModal()">
                                <i class="fas fa-times me-1"></i>關閉此頁面
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;
```

---

### 步驟 6: 顯示 Modal

```javascript
// 1. 清理舊的 Modal
const oldModal = document.getElementById('detailModal');
if (oldModal) {
    const bsModal = bootstrap.Modal.getInstance(oldModal);
    if (bsModal) {
        bsModal.dispose();  // 銷毀 Bootstrap Modal 實例
    }
    oldModal.remove();  // 移除 DOM 元素
}

// 2. 移除殘留的 backdrop
document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());

// 3. 確保 body 沒有 modal-open class
document.body.classList.remove('modal-open');
document.body.style.overflow = '';
document.body.style.paddingRight = '';

// 4. 添加新的 Modal
document.body.insertAdjacentHTML('beforeend', detailHtml);

// 5. 初始化並顯示 Modal
const modalElement = document.getElementById('detailModal');
const modal = new bootstrap.Modal(modalElement, {
    backdrop: true,
    keyboard: true,
    focus: true
});

modal.show();

// 6. 監聽事件
modalElement.addEventListener('shown.bs.modal', function () {
    console.log('Modal 已成功顯示');
});

modalElement.addEventListener('hidden.bs.modal', function () {
    console.log('Modal 已關閉');
    modalElement.remove();
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
});
```

---

## 🔑 關鍵函數解析

### 1. `buildGovUrl(record)` - 構建政府採購網連結

```javascript
function buildGovUrl(record) {
    // 優先順序 1: detail.url 中的政府採購網連結
    if (record.detail && record.detail.url && 
        record.detail.url.startsWith('https://web.pcc.gov.tw')) {
        return record.detail.url;
    }
    
    // 優先順序 2: 使用 pkPmsMain 構建連結
    if (record.detail && record.detail.pkPmsMain) {
        return `https://web.pcc.gov.tw/tps/QueryTender/query/searchTenderDetail?pkPmsMain=${record.detail.pkPmsMain}`;
    }
    
    // 優先順序 3: record.url
    if (record.url && record.url.startsWith('https://web.pcc.gov.tw')) {
        return record.url;
    }
    
    // 備用方案: 使用 g0v 的連結
    if (record.url) {
        return record.url.startsWith('http') ? record.url : `https://pcc.g0v.ronny.tw${record.url}`;
    }
    
    return '#';
}
```

**用途**:
- 為「查看完整標案頁面」按鈕提供正確連結
- 優先使用官方政府採購網連結
- 備用方案使用 g0v 整理的資料

---

### 2. `switchTenderRecord(index)` - 切換分頁

```javascript
function switchTenderRecord(index) {
    if (!window.tenderRecords || !window.tenderRecords[index]) {
        return;
    }
    
    const record = window.tenderRecords[index];
    const brief = record.brief || {};
    const detail = record.detail || {};
    
    // 更新內容區域
    const content = document.getElementById('tenderDetailContent');
    if (content) {
        content.innerHTML = `...新的內容...`;
    }
    
    // 更新按鈕狀態
    document.querySelectorAll('[data-record-index]').forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.dataset.recordIndex) === index) {
            btn.classList.add('active');
        }
    });
}
```

**用途**:
- 在不重新載入的情況下切換顯示不同公告
- 保存所有記錄在 `window.tenderRecords`
- 只更新內容區域，不重建整個 Modal

---

### 3. `addToCalendar()` - 加入行事曆

```javascript
function addToCalendar(title, dateStr, unit, url) {
    // 1. 解析民國年日期 (例如: "114/10/03 15:30")
    const parts = dateStr.split(' ');
    const datePart = parts[0];  // "114/10/03"
    const timePart = parts[1] || '09:00';  // "15:30"
    
    const [y, m, d] = datePart.split('/');
    const [h, min] = timePart.split(':');
    
    // 2. 民國年轉西元年
    const year = parseInt(y) + 1911;
    const month = m.padStart(2, '0');
    const day = d.padStart(2, '0');
    const hour = h.padStart(2, '0');
    const minute = min.padStart(2, '0');
    
    // 3. 構建 Google Calendar URL
    const startDate = `${year}${month}${day}T${hour}${minute}00`;
    const endDate = `${year}${month}${day}T${String(parseInt(hour) + 1).padStart(2, '0')}${minute}00`;
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(`機關：${unit}\n標案連結：${url}`)}&location=${encodeURIComponent(unit)}`;
    
    // 4. 開啟 Google Calendar
    window.open(calendarUrl, '_blank');
}
```

**功能**:
- 將開標時間或截止投標時間加入 Google Calendar
- 自動轉換民國年為西元年
- 包含標案資訊和連結

---

## 🛡️ 錯誤處理機制

### 1. API 請求失敗

```javascript
try {
    const response = await fetch(...);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
} catch (error) {
    lastError = error;
    
    // 分類錯誤類型
    if (error.name === 'AbortError') {
        errorMessage = '請求超時，請檢查網路連線';
    } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        errorMessage = '網路連線失敗，請檢查網路連線或稍後再試';
    } else if (error.message.includes('CORS')) {
        errorMessage = '跨域請求被阻擋，請檢查瀏覽器設定';
    } else {
        errorMessage = error.message;
    }
    
    // 重試或顯示錯誤
    if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    } else {
        showNotification('載入詳細資料失敗', errorMessage, 'error');
    }
}
```

---

### 2. 資料缺失處理

使用 `||` 運算符提供預設值：

```javascript
const title = brief.title || '無資料';
const type = brief.type || '無資料';
const budget = detail['採購資料:預算金額'] || '無資料';
```

使用 `?.` 可選鏈：

```javascript
const companyNames = brief.companies?.names?.length > 0 ? 
    brief.companies.names : [];
```

---

### 3. Modal 顯示失敗

```javascript
const modalElement = document.getElementById('detailModal');
if (!modalElement) {
    throw new Error('無法創建 modal 元素');
}

try {
    const modal = new bootstrap.Modal(modalElement, {...});
    modal.show();
} catch (modalError) {
    console.error('Modal 初始化錯誤:', modalError);
    throw new Error(`Modal 初始化失敗: ${modalError.message}`);
}
```

---

## 📱 資料顯示邏輯

### 1. 基本資訊區塊

**顯示欄位**:
- 標案名稱 (`brief.title`)
- 標案類型 (`brief.type`)
- 發布日期 (格式化 `date`)
- 機關名稱 (`detail['機關資料:機關名稱']`)
- 標案編號 (`job_number`)
- 機關代碼 (`unit_id`)
- 分類 (`brief.category`)
- 預算金額 (`detail['採購資料:預算金額']`)

---

### 2. 招標資訊區塊

**顯示欄位**:
- 招標方式 (`detail['招標資料:招標方式']`)
- 決標方式 (`detail['招標資料:決標方式']`)
- 開標時間 (`detail['領投開標:開標時間']`)
- 開標地點 (`detail['領投開標:開標地點']`)
- 截止投標 (`detail['領投開標:截止投標']`)
- 押標金 (`detail['領投開標:是否須繳納押標金:押標金額度']`)

---

### 3. 條件顯示邏輯

**重要時間提醒**:
```javascript
${detail['領投開標:開標時間'] ? `
    <button ...>開標時間加入行事曆</button>
` : ''}
```
- 只有當有開標時間時才顯示按鈕

**相關公司**:
```javascript
${brief.companies?.names?.length > 0 ? `
    <ul>${brief.companies.names.map(name => `<li>${name}</li>`).join('')}</ul>
` : '<p>無相關公司資料</p>'}
```
- 有公司資料時顯示列表
- 沒有時顯示「無相關公司資料」

---

## 🔄 資料流圖

```
┌─────────────────────────────────────────────────────┐
│  搜尋結果卡片                                        │
│  [詳細資料] 按鈕                                     │
│  onClick="showDetail(unitId, jobNumber, date)"      │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│  showDetail() 函數                                   │
│  - 重試機制 (最多3次)                               │
│  - 超時控制 (10秒)                                   │
│  - 發送 API 請求                                     │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│  API: /tender?unit_id=...&job_number=...            │
│  回傳: { records: [...] }                           │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│  資料解析                                            │
│  - records = data.records || [data]                 │
│  - brief = records[0].brief                         │
│  - detail = records[0].detail                       │
└────────────────┬────────────────────────────────────┘
                 │
                 ├──→ 多筆記錄？
                 │    ├─ 是 → 生成分頁按鈕
                 │    └─ 否 → 跳過
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│  生成 Modal HTML                                     │
│  - 基本資訊表格                                      │
│  - 招標資訊表格                                      │
│  - 重要時間提醒 (條件顯示)                          │
│  - 相關公司列表 (條件顯示)                          │
│  - 操作按鈕                                          │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│  清理與準備                                          │
│  - 移除舊 Modal                                      │
│  - 清理 backdrop                                     │
│  - 重置 body 樣式                                    │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│  顯示 Modal                                          │
│  - 插入 HTML 到 body                                 │
│  - 初始化 Bootstrap Modal                           │
│  - modal.show()                                      │
│  - 監聽顯示/隱藏事件                                │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│  用戶互動                                            │
│  - 查看資料                                          │
│  - 切換分頁 (switchTenderRecord)                    │
│  - 加入行事曆 (addToCalendar)                       │
│  - 查看完整頁面 (buildGovUrl)                       │
│  - 關閉 Modal                                        │
└─────────────────────────────────────────────────────┘
```

---

## 📝 關鍵要點總結

### ✅ 優點

1. **完整的錯誤處理**
   - 最多重試3次
   - 10秒超時保護
   - 詳細的錯誤分類

2. **彈性的資料解析**
   - 支援多種資料結構
   - 預設值處理
   - 可選鏈避免錯誤

3. **良好的用戶體驗**
   - 載入狀態提示
   - 分頁功能
   - 行事曆整合
   - 直接連結到政府採購網

4. **穩定的 Modal 管理**
   - 完整清理舊 Modal
   - 事件監聽
   - 自動清理資源

### ⚠️ 注意事項

1. **API 依賴**
   - 需要穩定的 API 連接
   - Cloudflare 403 問題 (但在瀏覽器中通常正常)

2. **資料格式**
   - 依賴特定的欄位命名 (如 "機關資料:機關名稱")
   - 需要處理資料缺失的情況

3. **效能考量**
   - 每次都重新創建 Modal
   - 可能有記憶體洩漏風險 (已有清理機制)

---

## 🔧 優化建議

### 1. 快取機制
```javascript
const detailCache = new Map();

async function showDetail(unitId, jobNumber, date) {
    const cacheKey = `${unitId}-${jobNumber}`;
    
    // 檢查快取
    if (detailCache.has(cacheKey)) {
        displayModal(detailCache.get(cacheKey));
        return;
    }
    
    // 載入資料...
    detailCache.set(cacheKey, data);
}
```

### 2. 預載入
```javascript
// 在搜尋結果顯示時預載入前幾筆的詳細資料
searchResults.slice(0, 3).forEach(record => {
    preloadDetail(record.unit_id, record.job_number);
});
```

### 3. 更好的錯誤訊息
```javascript
// 提供更友善的錯誤提示
if (response.status === 404) {
    showError('找不到此標案的詳細資料，可能已被移除');
} else if (response.status === 403) {
    showError('暫時無法存取，請稍後再試');
}
```

---

**文檔完成！** 📄

這份文檔詳細說明了詳細資料的完整處理流程，從用戶點擊到資料顯示的每個步驟。

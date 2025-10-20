/**
 * Vercel Serverless Function - 政府採購 API 代理
 * 解決 CORS 問題並加入快取機制
 */

// API 來源列表
const API_BASES = [
    'https://pcc-api.openfun.app/api',
    'https://pcc.g0v.ronny.tw/api'
];

// 快取時間設定（秒）
const CACHE_TIME = {
    search: 300,      // 搜尋結果快取 5 分鐘
    tender: 3600,     // 標案詳情快取 1 小時
    list: 600         // 列表快取 10 分鐘
};

// 記憶體快取（簡單實作）
const cache = new Map();

/**
 * 從快取獲取資料
 */
function getFromCache(key) {
    const cached = cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > cached.maxAge * 1000) {
        cache.delete(key);
        return null;
    }
    
    return cached.data;
}

/**
 * 儲存到快取
 */
function saveToCache(key, data, maxAge) {
    cache.set(key, {
        data,
        timestamp: Date.now(),
        maxAge
    });
    
    // 限制快取大小，避免記憶體溢出
    if (cache.size > 1000) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
    }
}

/**
 * 從多個 API 來源嘗試獲取資料
 */
async function fetchFromApis(path, options = {}) {
    let lastError = null;
    
    for (const base of API_BASES) {
        try {
            const url = `${base}${path}`;
            console.log(`嘗試 API: ${url}`);
            
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Taiwan-Procurement-System/2.0',
                    ...options.headers
                },
                // 10 秒超時
                signal: AbortSignal.timeout(10000)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`成功從 ${base} 獲取資料`);
            return data;
            
        } catch (error) {
            console.warn(`API ${base} 失敗:`, error.message);
            lastError = error;
            continue;
        }
    }
    
    throw new Error(`所有 API 來源均失敗: ${lastError?.message || '未知錯誤'}`);
}

/**
 * 主要處理函數
 */
export default async function handler(req, res) {
    // 設定 CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // 處理 OPTIONS 預檢請求
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // 只允許 GET 請求
    if (req.method !== 'GET') {
        res.status(405).json({ error: '只支援 GET 請求' });
        return;
    }
    
    try {
        // 從 query 參數獲取路徑和參數
        const { path, ...params } = req.query;
        
        if (!path) {
            res.status(400).json({ 
                error: '缺少 path 參數',
                example: '/api/proxy?path=/searchbytitle&query=醫療&page=1'
            });
            return;
        }
        
        // 構建完整路徑
        const queryString = new URLSearchParams(params).toString();
        const fullPath = queryString ? `${path}?${queryString}` : path;
        
        // 生成快取鍵
        const cacheKey = `api:${fullPath}`;
        
        // 嘗試從快取獲取
        const cachedData = getFromCache(cacheKey);
        if (cachedData) {
            console.log(`快取命中: ${cacheKey}`);
            res.setHeader('X-Cache', 'HIT');
            res.status(200).json(cachedData);
            return;
        }
        
        // 從 API 獲取資料
        const data = await fetchFromApis(fullPath);
        
        // 決定快取時間
        let cacheTime = CACHE_TIME.search;
        if (path.includes('/tender')) {
            cacheTime = CACHE_TIME.tender;
        } else if (path.includes('/listbyunit')) {
            cacheTime = CACHE_TIME.list;
        }
        
        // 儲存到快取
        saveToCache(cacheKey, data, cacheTime);
        
        // 設定快取 headers
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('Cache-Control', `public, max-age=${cacheTime}`);
        
        // 返回資料
        res.status(200).json(data);
        
    } catch (error) {
        console.error('API 代理錯誤:', error);
        
        res.status(500).json({ 
            error: 'API 請求失敗',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}


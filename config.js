/**
 * API 配置檔案
 * 根據環境自動切換 API 端點
 */

// 檢測當前環境
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const isGitHubPages = window.location.hostname.includes('github.io');

// API 配置
const API_CONFIG = {
    // Vercel API 代理（生產環境使用）
    VERCEL_PROXY: 'https://taiwan-government-procurement-ai.vercel.app/api/proxy',
    
    // 直接 API（本地開發使用）
    DIRECT_APIS: [
        'https://pcc-api.openfun.app/api',
        'https://pcc.g0v.ronny.tw/api'
    ],
    
    // 根據環境選擇 API
    getApiBase() {
        // 如果是生產環境或 GitHub Pages，使用 Vercel 代理
        if (isProduction || isGitHubPages) {
            console.log('🚀 使用 Vercel API 代理');
            return this.VERCEL_PROXY;
        }
        
        // 本地開發，直接使用 API
        console.log('💻 本地開發模式，直接使用 API');
        return null; // 返回 null 表示使用直接 API
    },
    
    // 構建 API 請求 URL
    buildUrl(path, params = {}) {
        const apiBase = this.getApiBase();
        
        if (apiBase === this.VERCEL_PROXY) {
            // 使用 Vercel 代理
            const queryParams = new URLSearchParams({
                path,
                ...params
            });
            return `${apiBase}?${queryParams}`;
        } else {
            // 直接使用 API
            const queryString = new URLSearchParams(params).toString();
            const fullPath = queryString ? `${path}?${queryString}` : path;
            return this.DIRECT_APIS[0] + fullPath;
        }
    }
};

// 輸出環境資訊
console.log('📍 環境檢測:', {
    hostname: window.location.hostname,
    isProduction,
    isGitHubPages,
    apiMode: API_CONFIG.getApiBase() ? 'Proxy' : 'Direct'
});

// 導出配置
window.API_CONFIG = API_CONFIG;


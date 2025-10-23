/**
 * API 配置檔案
 * 根據環境自動切換 API 端點
 */

// API 配置（自動偵測是否走本機/雲端代理）
const API_CONFIG = {
    DIRECT_APIS: [
        'https://pcc-api.openfun.app/api',
        'https://pcc.g0v.ronny.tw/api'
    ],
    getApiBase() {
        const h = window.location.hostname;
        // 在以下環境使用相對路徑代理 `/api`
        if (
            h.includes('vercel.app') ||
            h.includes('github.io') ||
            h.endsWith('.appspot.com') ||
            h.endsWith('.run.app') ||
            h === 'localhost' ||
            h === '127.0.0.1'
        ) return '/api';
        return null; // 其他情況直接打 API（例如本地純檔案伺服器）
    },
    buildUrl(path, params = {}) {
        const apiBase = this.getApiBase();
        const qs = new URLSearchParams(params).toString();
        const sep = path.includes('?') ? '&' : '?';
        if (apiBase) return `${apiBase}${path}${qs ? sep + qs : ''}`;
        return `${this.DIRECT_APIS[0]}${path}${qs ? sep + qs : ''}`;
    }
};

// 導出配置
window.API_CONFIG = API_CONFIG;


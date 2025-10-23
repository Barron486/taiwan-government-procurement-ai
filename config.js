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
        // Vercel：沿用既有雲端代理（避免自動部署破壞）
        if (h.includes('vercel.app')) return 'https://taiwan-government-procurement-ai.vercel.app/api/proxy';
        // GitHub Pages：無後端，改為直連
        if (h.includes('github.io')) return null;
        // GCP/本機：使用相對路徑代理 `/api`
        if (h.endsWith('.appspot.com') || h.endsWith('.run.app') || h === 'localhost' || h === '127.0.0.1') return '/api';
        return null;
    },
    buildUrl(path, params = {}) {
        const apiBase = this.getApiBase();
        const qs = new URLSearchParams(params).toString();
        const sep = path.includes('?') ? '&' : '?';
        if (apiBase) {
            // Vercel proxy 需要以 query 方式傳 path
            if (apiBase.startsWith('https://') && apiBase.includes('/api/proxy')) {
                const qp = new URLSearchParams({ path: path + (qs ? sep + qs : '') }).toString();
                return `${apiBase}?${qp}`;
            }
            return `${apiBase}${path}${qs ? sep + qs : ''}`;
        }
        return `${this.DIRECT_APIS[0]}${path}${qs ? sep + qs : ''}`;
    }
};

// 導出配置
window.API_CONFIG = API_CONFIG;


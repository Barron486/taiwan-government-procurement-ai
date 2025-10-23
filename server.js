// Minimal Cloud Run server: serves static files and proxies /api/* to upstreams
import express from 'express';

const app = express();

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = {
  '/search': 5 * 60 * 1000,
  '/listbyunit': 5 * 60 * 1000,
  '/tender': 60 * 60 * 1000,
  default: 10 * 60 * 1000
};

const API_BASES = [
  'https://pcc-api.openfun.app/api',
  'https://pcc.g0v.ronny.tw/api'
];

function getCacheKey(pathWithQuery) {
  return pathWithQuery;
}

function getCacheTtlForPath(pathname) {
  for (const key in CACHE_TTL) {
    if (key !== 'default' && pathname.startsWith(key)) return CACHE_TTL[key];
  }
  return CACHE_TTL.default;
}

// CORS for proxy
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
}

app.options('/api/*', (req, res) => {
  setCors(res);
  res.status(200).end();
});

app.get('/api/*', async (req, res) => {
  setCors(res);
  try {
    const urlObj = new URL(req.originalUrl, `http://${req.headers.host}`);
    const targetPath = urlObj.pathname.replace('/api', '');
    const fullPath = `${targetPath}${urlObj.search}`;

    // cache
    const cacheKey = getCacheKey(fullPath);
    const cached = cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return res.status(200).json(cached.data);
    }

    let lastErr;
    for (const base of API_BASES) {
      const upstream = base + fullPath;
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 15000);
        const r = await fetch(upstream, { headers: { Accept: 'application/json' }, signal: controller.signal });
        clearTimeout(id);
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        const data = await r.json();
        cache.set(cacheKey, { data, expiry: Date.now() + getCacheTtlForPath(targetPath) });
        return res.status(200).json(data);
      } catch (e) {
        lastErr = e;
      }
    }
    res.status(502).json({ error: 'Upstream failed', details: String(lastErr) });
  } catch (e) {
    res.status(500).json({ error: 'Proxy error', details: String(e) });
  }
});

// Serve static files from project root
app.use(express.static('.', { extensions: ['html'] }));

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: '.' });
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Server listening on :${port}`));




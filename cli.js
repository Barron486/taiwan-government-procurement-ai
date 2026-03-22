#!/usr/bin/env node
/**
 * 台灣政府採購系統 - CLI 診斷工具
 * 供 AI Agent 或開發者快速檢查系統健康狀態
 *
 * 用法：
 *   node cli.js health          # API 健康檢查
 *   node cli.js search <關鍵字>  # 搜尋測試
 *   node cli.js detail <unit_id> <job_number>  # 標案詳情
 *   node cli.js status          # 完整狀態報告
 *   node cli.js endpoints       # 列出所有可用端點
 */

const API_BASES = [
    { name: 'openfun', url: 'https://pcc-api.openfun.app/api' },
    { name: 'g0v',     url: 'https://pcc.g0v.ronny.tw/api' }
];

const VERCEL_PROXY = 'https://taiwan-government-procurement-ai.vercel.app/api/proxy';

const ENDPOINTS = [
    { path: '/searchbytitle',       params: { query: '電腦', page: 1 }, desc: '標案名稱搜尋' },
    { path: '/searchbycompanyname', params: { query: '中華電信', page: 1 }, desc: '公司名稱搜尋' },
    { path: '/searchbycompanyid',   params: { query: '96979933', page: 1 }, desc: '統一編號搜尋' },
    { path: '/listbyunit',          params: { unit_id: '3.76.30', page: 1 }, desc: '機關標案列表' },
    { path: '/tender',              params: { unit_id: '3.76.30', job_number: '1140102' }, desc: '標案詳情' },
    { path: '/getinfo',             params: {}, desc: '資料統計' }
];

// ── 工具函式 ──

function color(code, text) {
    return `\x1b[${code}m${text}\x1b[0m`;
}
const green  = t => color('32', t);
const red    = t => color('31', t);
const yellow = t => color('33', t);
const cyan   = t => color('36', t);
const bold   = t => color('1', t);
const dim    = t => color('2', t);

function buildUrl(base, path, params = {}) {
    const qs = new URLSearchParams(params).toString();
    return `${base}${path}${qs ? '?' + qs : ''}`;
}

async function fetchWithTimeout(url, timeoutMs = 10000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const start = Date.now();
    try {
        const resp = await fetch(url, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json', 'User-Agent': 'PCC-CLI/1.0' }
        });
        const elapsed = Date.now() - start;
        const body = await resp.text();
        let json = null;
        try { json = JSON.parse(body); } catch {}
        return { ok: resp.ok, status: resp.status, elapsed, json, body, headers: resp.headers };
    } catch (err) {
        const elapsed = Date.now() - start;
        return { ok: false, status: 0, elapsed, error: err.name === 'AbortError' ? 'TIMEOUT' : err.message };
    } finally {
        clearTimeout(timer);
    }
}

function formatMs(ms) {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}

function printTable(rows) {
    if (rows.length === 0) return;
    const cols = Object.keys(rows[0]);
    const widths = cols.map(c => Math.max(c.length, ...rows.map(r => String(r[c]).length)));
    const sep = widths.map(w => '─'.repeat(w + 2)).join('┼');
    console.log('┌' + widths.map(w => '─'.repeat(w + 2)).join('┬') + '┐');
    console.log('│' + cols.map((c, i) => ` ${bold(c.padEnd(widths[i]))} `).join('│') + '│');
    console.log('├' + sep + '┤');
    for (const row of rows) {
        console.log('│' + cols.map((c, i) => ` ${String(row[c]).padEnd(widths[i])} `).join('│') + '│');
    }
    console.log('└' + widths.map(w => '─'.repeat(w + 2)).join('┴') + '┘');
}

// ── 指令 ──

async function cmdHealth() {
    console.log(bold('\n🏥 API 健康檢查\n'));

    const results = [];

    // 測試各 API base
    for (const base of API_BASES) {
        const url = buildUrl(base.url, '/searchbytitle', { query: '測試', page: 1 });
        process.stdout.write(`  檢查 ${cyan(base.name)} (${dim(base.url)}) ... `);
        const r = await fetchWithTimeout(url);
        if (r.ok && r.json) {
            const count = r.json.total_records ?? r.json.records?.length ?? '?';
            console.log(green(`✓ ${r.status} OK`) + dim(` ${formatMs(r.elapsed)}, ${count} 筆`));
            results.push({ source: base.name, status: 'OK', code: r.status, time: formatMs(r.elapsed), records: count });
        } else if (r.status === 301) {
            const location = r.headers?.get('location') || '?';
            console.log(yellow(`⤳ 301 → ${location}`) + dim(` ${formatMs(r.elapsed)}`));
            results.push({ source: base.name, status: '301 REDIRECT', code: 301, time: formatMs(r.elapsed), records: '-' });
        } else {
            const msg = r.error || `HTTP ${r.status}`;
            console.log(red(`✗ ${msg}`) + dim(` ${formatMs(r.elapsed)}`));
            results.push({ source: base.name, status: 'FAIL', code: r.status || 'ERR', time: formatMs(r.elapsed), records: '-' });
        }
    }

    // 測試 Vercel proxy
    const proxyUrl = `${VERCEL_PROXY}?${new URLSearchParams({ path: '/searchbytitle?query=測試&page=1' })}`;
    process.stdout.write(`  檢查 ${cyan('vercel-proxy')} ... `);
    const pr = await fetchWithTimeout(proxyUrl);
    if (pr.ok && pr.json) {
        const count = pr.json.total_records ?? pr.json.records?.length ?? '?';
        console.log(green(`✓ ${pr.status} OK`) + dim(` ${formatMs(pr.elapsed)}, ${count} 筆`));
        results.push({ source: 'vercel-proxy', status: 'OK', code: pr.status, time: formatMs(pr.elapsed), records: count });
    } else {
        const msg = pr.error || `HTTP ${pr.status}`;
        console.log(red(`✗ ${msg}`) + dim(` ${formatMs(pr.elapsed)}`));
        results.push({ source: 'vercel-proxy', status: 'FAIL', code: pr.status || 'ERR', time: formatMs(pr.elapsed), records: '-' });
    }

    // 總結
    const allOk = results.every(r => r.status === 'OK');
    const anyOk = results.some(r => r.status === 'OK');
    console.log('\n' + bold('結果：'));
    printTable(results);

    if (allOk) {
        console.log(green('\n✓ 所有 API 來源正常\n'));
        return { ok: true, results };
    } else if (anyOk) {
        console.log(yellow('\n⚠ 部分 API 來源異常，但仍有可用的備援\n'));
        return { ok: true, partial: true, results };
    } else {
        console.log(red('\n✗ 所有 API 來源均無法連線！上游服務可能已停機\n'));
        return { ok: false, results };
    }
}

async function cmdSearch(query) {
    if (!query) {
        console.log(red('錯誤：請提供搜尋關鍵字\n用法：node cli.js search <關鍵字>'));
        process.exit(1);
    }
    console.log(bold(`\n🔍 搜尋測試：「${query}」\n`));

    for (const base of API_BASES) {
        const url = buildUrl(base.url, '/searchbytitle', { query, page: 1 });
        process.stdout.write(`  ${cyan(base.name)} ... `);
        const r = await fetchWithTimeout(url, 15000);

        if (r.ok && r.json) {
            const total = r.json.total_records ?? '?';
            const pages = r.json.total_pages ?? '?';
            const records = r.json.records || [];
            console.log(green(`✓ 找到 ${total} 筆（共 ${pages} 頁）`) + dim(` ${formatMs(r.elapsed)}`));

            if (records.length > 0) {
                console.log(dim('  前 5 筆結果：'));
                for (const rec of records.slice(0, 5)) {
                    const title = rec.brief?.title || rec.title || '(無標題)';
                    const unit  = rec.unit_name || rec.brief?.unit_name || '';
                    console.log(`    • ${title}` + (unit ? dim(` [${unit}]`) : ''));
                }
            }
            // 找到結果就停止
            return { ok: true, source: base.name, total, records };
        } else {
            const msg = r.error || `HTTP ${r.status}`;
            console.log(red(`✗ ${msg}`) + dim(` ${formatMs(r.elapsed)}`));
        }
    }

    console.log(red('\n✗ 所有來源搜尋失敗\n'));
    return { ok: false };
}

async function cmdDetail(unitId, jobNumber) {
    if (!unitId || !jobNumber) {
        console.log(red('錯誤：請提供 unit_id 和 job_number\n用法：node cli.js detail <unit_id> <job_number>'));
        process.exit(1);
    }
    console.log(bold(`\n📄 標案詳情：unit_id=${unitId}, job_number=${jobNumber}\n`));

    for (const base of API_BASES) {
        const url = buildUrl(base.url, '/tender', { unit_id: unitId, job_number: jobNumber });
        process.stdout.write(`  ${cyan(base.name)} ... `);
        const r = await fetchWithTimeout(url, 15000);

        if (r.ok && r.json) {
            console.log(green(`✓ OK`) + dim(` ${formatMs(r.elapsed)}`));
            const data = r.json;
            // 印出前幾個欄位
            const keys = Object.keys(data).slice(0, 20);
            for (const k of keys) {
                const val = typeof data[k] === 'object' ? JSON.stringify(data[k]).slice(0, 80) : String(data[k]).slice(0, 80);
                console.log(`    ${cyan(k)}: ${val}`);
            }
            if (Object.keys(data).length > 20) {
                console.log(dim(`    ... 還有 ${Object.keys(data).length - 20} 個欄位`));
            }
            return { ok: true, source: base.name, data };
        } else {
            const msg = r.error || `HTTP ${r.status}`;
            console.log(red(`✗ ${msg}`) + dim(` ${formatMs(r.elapsed)}`));
        }
    }

    console.log(red('\n✗ 所有來源查詢失敗\n'));
    return { ok: false };
}

async function cmdStatus() {
    console.log(bold('\n📊 系統完整狀態報告\n'));
    console.log(dim(`  時間：${new Date().toISOString()}\n`));

    // 1. 健康檢查
    const health = await cmdHealth();

    // 2. 各端點逐一測試
    console.log(bold('\n🔌 端點測試\n'));

    const epResults = [];
    // 只用第一個可用的 base
    const workingBase = API_BASES[0];

    for (const ep of ENDPOINTS) {
        const url = buildUrl(workingBase.url, ep.path, ep.params);
        process.stdout.write(`  ${ep.desc} (${cyan(ep.path)}) ... `);
        const r = await fetchWithTimeout(url);
        if (r.ok && r.json) {
            console.log(green('✓ OK') + dim(` ${formatMs(r.elapsed)}`));
            epResults.push({ endpoint: ep.path, desc: ep.desc, status: '✓', time: formatMs(r.elapsed) });
        } else {
            const msg = r.error || `HTTP ${r.status}`;
            console.log(red(`✗ ${msg}`) + dim(` ${formatMs(r.elapsed)}`));
            epResults.push({ endpoint: ep.path, desc: ep.desc, status: '✗', time: formatMs(r.elapsed) });
        }
    }

    // 3. 總結
    const totalOk = epResults.filter(e => e.status === '✓').length;
    console.log(bold('\n📋 端點總結：'));
    printTable(epResults);

    const allHealthy = health.ok && totalOk === epResults.length;
    console.log(bold('\n結論：'));
    if (allHealthy) {
        console.log(green('  ✓ 系統全部正常\n'));
    } else if (health.ok) {
        console.log(yellow(`  ⚠ API 來源可用，但 ${epResults.length - totalOk}/${epResults.length} 個端點異常\n`));
    } else {
        console.log(red('  ✗ 上游 API 服務無法連線，建議等待恢復或更換 API 來源\n'));
    }

    // 輸出 JSON 供 AI Agent 解析
    const report = {
        timestamp: new Date().toISOString(),
        healthy: allHealthy,
        api_sources: health.results,
        endpoints: epResults,
        recommendation: allHealthy
            ? '系統正常，無需修復'
            : health.ok
                ? '部分端點異常，建議檢查特定 API 路徑'
                : '上游 API 全部無法連線，非程式碼問題，需等待上游恢復'
    };
    console.log(dim('── JSON 報告（供 AI Agent 使用）──'));
    console.log(JSON.stringify(report, null, 2));
    console.log('');

    return report;
}

function cmdEndpoints() {
    console.log(bold('\n📡 可用 API 端點\n'));

    console.log(bold('  API 來源：'));
    for (const base of API_BASES) {
        console.log(`    • ${cyan(base.name)}: ${base.url}`);
    }
    console.log(`    • ${cyan('vercel-proxy')}: ${VERCEL_PROXY}`);

    console.log(bold('\n  政府採購 API 端點：'));
    const rows = ENDPOINTS.map(e => ({
        路徑: e.path,
        說明: e.desc,
        測試參數: Object.entries(e.params).map(([k, v]) => `${k}=${v}`).join('&')
    }));
    printTable(rows);

    console.log(bold('\n  自訂後端 API：'));
    const custom = [
        { 路徑: '/api/proxy',    說明: 'API 代理（Vercel）',     認證: '無' },
        { 路徑: '/api/ai',       說明: 'AI 分析（POST）',         認證: 'JWT' },
        { 路徑: '/api/credits',  說明: '點數餘額查詢',            認證: 'JWT' },
        { 路徑: '/api/checkout', 說明: 'Stripe 結帳（POST）',    認證: 'JWT' },
        { 路徑: '/api/webhook',  說明: 'Stripe Webhook（POST）', 認證: 'Stripe Sig' }
    ];
    printTable(custom);
    console.log('');
}

function printHelp() {
    console.log(`
${bold('台灣政府採購系統 - CLI 診斷工具')}

${bold('用法：')}
  node cli.js ${cyan('<command>')} [options]

${bold('指令：')}
  ${cyan('health')}                          API 健康檢查（快速）
  ${cyan('search')} <關鍵字>                 搜尋測試
  ${cyan('detail')} <unit_id> <job_number>   標案詳情查詢
  ${cyan('status')}                          完整狀態報告（含 JSON 輸出）
  ${cyan('endpoints')}                       列出所有可用端點
  ${cyan('help')}                            顯示此說明

${bold('範例：')}
  node cli.js health
  node cli.js search 電腦
  node cli.js detail 3.76.30 1140102
  node cli.js status
`);
}

// ── 主程式 ──

const [,, cmd, ...args] = process.argv;

switch (cmd) {
    case 'health':    cmdHealth();                        break;
    case 'search':    cmdSearch(args.join(' '));           break;
    case 'detail':    cmdDetail(args[0], args[1]);        break;
    case 'status':    cmdStatus();                        break;
    case 'endpoints': cmdEndpoints();                     break;
    case 'help':
    case '--help':
    case '-h':        printHelp();                        break;
    default:          printHelp();                        break;
}

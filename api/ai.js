/**
 * Vercel Serverless - Server-side AI Proxy with Credits
 * POST /api/ai
 * Header: Authorization: Bearer <supabase_access_token>
 * Body: { prompt, provider }
 */

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: '只支援 POST' }); return; }

    try {
        const { prompt, provider = 'claude' } = req.body;

        if (!prompt) {
            res.status(400).json({ error: '缺少 prompt 參數' });
            return;
        }

        // ── 驗證 Supabase JWT ──
        const authHeader = req.headers.authorization;
        const token = authHeader?.replace('Bearer ', '').trim();
        if (!token) {
            res.status(401).json({ error: '請先登入', code: 'NOT_LOGGED_IN' });
            return;
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            res.status(401).json({ error: '登入已過期，請重新登入', code: 'AUTH_EXPIRED' });
            return;
        }

        // ── 確認點數 ──
        const { data: credits, error: creditsError } = await supabase
            .from('user_credits')
            .select('balance')
            .eq('user_id', user.id)
            .single();

        if (creditsError || !credits || credits.balance <= 0) {
            res.status(402).json({
                error: '點數不足，請購買點數',
                code: 'INSUFFICIENT_CREDITS',
                balance: credits?.balance ?? 0
            });
            return;
        }

        // ── 呼叫 AI ──
        let result = null;

        if (provider === 'claude') {
            const apiKey = process.env.CLAUDE_API_KEY;
            if (!apiKey) throw new Error('SERVER: CLAUDE_API_KEY 未設定');
            const r = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-6',
                    max_tokens: 4096,
                    messages: [{ role: 'user', content: prompt }]
                }),
                signal: AbortSignal.timeout(60000)
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data.error?.message || `Claude HTTP ${r.status}`);
            result = data.content?.[0]?.text;

        } else if (provider === 'gemini') {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) throw new Error('SERVER: GEMINI_API_KEY 未設定');
            const r = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
                    signal: AbortSignal.timeout(60000)
                }
            );
            const data = await r.json();
            if (!r.ok) throw new Error(data.error?.message || `Gemini HTTP ${r.status}`);
            result = data.candidates?.[0]?.content?.parts?.[0]?.text;

        } else if (provider === 'chatgpt') {
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey) throw new Error('SERVER: OPENAI_API_KEY 未設定');
            const r = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 4096
                }),
                signal: AbortSignal.timeout(60000)
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data.error?.message || `OpenAI HTTP ${r.status}`);
            result = data.choices?.[0]?.message?.content;
        } else {
            res.status(400).json({ error: `不支援的 AI 供應商: ${provider}` });
            return;
        }

        if (!result) throw new Error('AI 回應內容為空');

        // ── 原子扣點 ──
        const { data: newBalance, error: deductError } = await supabase
            .rpc('use_credit', { p_user_id: user.id });

        if (deductError) {
            console.error('扣點失敗:', deductError);
            // AI 已回應，仍回傳結果，但記錄錯誤
        }

        res.status(200).json({
            result,
            creditsRemaining: typeof newBalance === 'number' ? newBalance : credits.balance - 1
        });

    } catch (error) {
        console.error('AI proxy error:', error);
        res.status(500).json({ error: error.message || '伺服器錯誤' });
    }
}

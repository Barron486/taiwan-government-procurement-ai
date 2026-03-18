/**
 * Vercel Serverless - 查詢使用者點數
 * GET /api/credits
 * Header: Authorization: Bearer <supabase_access_token>
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }
    if (req.method !== 'GET') { res.status(405).json({ error: '只支援 GET' }); return; }

    try {
        const token = req.headers.authorization?.replace('Bearer ', '').trim();
        if (!token) {
            res.status(401).json({ error: '請先登入', code: 'NOT_LOGGED_IN' });
            return;
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            res.status(401).json({ error: '登入已過期', code: 'AUTH_EXPIRED' });
            return;
        }

        const { data: credits, error } = await supabase
            .from('user_credits')
            .select('balance, total_purchased, total_used, updated_at')
            .eq('user_id', user.id)
            .single();

        if (error || !credits) {
            // 記錄不存在，回傳 0
            res.status(200).json({ balance: 0, total_purchased: 0, total_used: 0 });
            return;
        }

        res.status(200).json(credits);

    } catch (error) {
        console.error('Credits query error:', error);
        res.status(500).json({ error: error.message });
    }
}

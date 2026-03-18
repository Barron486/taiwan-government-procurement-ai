/**
 * Vercel Serverless - Stripe Webhook Handler
 * POST /api/webhook
 * Stripe → 付款成功 → 新增使用者點數
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Webhook 需要 raw body，關閉 Vercel 的自動 JSON 解析
export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/** 讀取 raw body（給 Stripe 簽名驗證用）*/
function getRawBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end',  () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

export default async function handler(req, res) {
    if (req.method !== 'POST') { res.status(405).end(); return; }

    const rawBody = await getRawBody(req);
    const sig     = req.headers['stripe-signature'];

    let event;
    try {
        event = stripe.webhooks.constructEvent(
            rawBody,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook 簽名驗證失敗:', err.message);
        res.status(400).json({ error: `Webhook Error: ${err.message}` });
        return;
    }

    console.log(`Stripe event: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        // 只處理付款成功的 session
        if (session.payment_status !== 'paid') {
            res.json({ received: true });
            return;
        }

        const { user_id, credits, package_id } = session.metadata;

        if (!user_id || !credits) {
            console.error('Webhook metadata 缺少 user_id 或 credits:', session.metadata);
            res.status(400).json({ error: 'metadata 不完整' });
            return;
        }

        try {
            const { data: newBalance, error } = await supabase.rpc('add_credits', {
                p_user_id:           user_id,
                p_amount:            parseInt(credits),
                p_description:       `購買 ${credits} 次分析點數（${package_id}）`,
                p_stripe_payment_id: session.payment_intent
            });

            if (error) throw error;
            console.log(`✓ 點數已新增: user=${user_id}, credits=${credits}, newBalance=${newBalance}`);

        } catch (err) {
            console.error('新增點數失敗:', err);
            // 回傳 500 讓 Stripe 重試
            res.status(500).json({ error: '新增點數失敗' });
            return;
        }
    }

    res.json({ received: true });
}

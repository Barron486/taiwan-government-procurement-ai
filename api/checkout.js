/**
 * Vercel Serverless - 建立 Stripe Checkout Session
 * POST /api/checkout
 * Header: Authorization: Bearer <supabase_access_token>
 * Body: { packageId }
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 點數方案（TWD 是零小數位幣種，直接填整數）
const PACKAGES = {
    credits_10: {
        credits: 10,
        amount: 150,          // NT$150
        name: '基本包 - 10 次 AI 分析',
        description: '政府採購 AI 分析點數 10 次，點數永不過期'
    },
    credits_30: {
        credits: 30,
        amount: 399,          // NT$399
        name: '標準包 - 30 次 AI 分析',
        description: '政府採購 AI 分析點數 30 次，點數永不過期'
    },
    credits_100: {
        credits: 100,
        amount: 999,          // NT$999
        name: '超值包 - 100 次 AI 分析',
        description: '政府採購 AI 分析點數 100 次，點數永不過期'
    }
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: '只支援 POST' }); return; }

    try {
        // ── 驗證使用者 ──
        const token = req.headers.authorization?.replace('Bearer ', '').trim();
        if (!token) {
            res.status(401).json({ error: '請先登入', code: 'NOT_LOGGED_IN' });
            return;
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            res.status(401).json({ error: '登入已過期，請重新登入', code: 'AUTH_EXPIRED' });
            return;
        }

        // ── 選擇方案 ──
        const { packageId } = req.body;
        const pkg = PACKAGES[packageId];
        if (!pkg) {
            res.status(400).json({ error: `無效的方案 ID: ${packageId}` });
            return;
        }

        // ── APP 基礎網址 ──
        const appUrl = process.env.APP_URL || `https://${req.headers.host}`;

        // ── 建立 Stripe Checkout Session ──
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'twd',
                    unit_amount: pkg.amount,
                    product_data: {
                        name: pkg.name,
                        description: pkg.description
                    }
                },
                quantity: 1
            }],
            mode: 'payment',

            // 自動產生 Invoice PDF，並寄送到 Email
            invoice_creation: {
                enabled: true,
                invoice_data: {
                    description: `${pkg.name}（${pkg.credits} 次 AI 分析點數）`,
                    footer: '感謝您使用台灣政府採購 AI 分析系統',
                    metadata: { package_id: packageId, credits: String(pkg.credits) }
                }
            },

            // 允許輸入統編（tax ID）
            tax_id_collection: { enabled: true },

            // 預填 Email
            customer_email: user.email,

            // 付款完成後跳轉
            success_url: `${appUrl}/pricing.html?success=1&credits=${pkg.credits}`,
            cancel_url:  `${appUrl}/pricing.html?cancelled=1`,

            // metadata 傳給 webhook
            metadata: {
                user_id: user.id,
                user_email: user.email,
                package_id: packageId,
                credits: String(pkg.credits)
            }
        });

        res.status(200).json({ url: session.url });

    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({ error: error.message || '建立付款頁面失敗' });
    }
}

-- =============================================
-- Taiwan Procurement AI - Supabase Schema
-- 執行順序：在 Supabase SQL Editor 貼上執行
-- =============================================

-- 1. 使用者點數表
CREATE TABLE IF NOT EXISTS user_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    balance INTEGER NOT NULL DEFAULT 0,
    total_purchased INTEGER NOT NULL DEFAULT 0,
    total_used INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 點數異動記錄表
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'bonus', 'refund')),
    amount INTEGER NOT NULL,             -- 正數=加點, 負數=扣點
    balance_after INTEGER NOT NULL,      -- 異動後餘額
    description TEXT,
    stripe_payment_intent_id TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 啟用 RLS
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies（使用者只能看自己的資料）
CREATE POLICY "users_read_own_credits"
    ON user_credits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "users_read_own_transactions"
    ON credit_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- 5. 索引
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id
    ON credit_transactions(user_id, created_at DESC);

-- =============================================
-- RPC 函數（SECURITY DEFINER 可繞過 RLS）
-- =============================================

-- 新用戶自動建立點數記錄（觸發器用）
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_credits (user_id, balance, total_purchased)
    VALUES (NEW.id, 3, 0)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO credit_transactions (user_id, type, amount, balance_after, description)
    VALUES (NEW.id, 'bonus', 3, 3, '新用戶贈送 3 次免費 AI 分析');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 觸發器：新用戶註冊時自動送點
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 扣除點數（原子操作，避免競爭條件）
CREATE OR REPLACE FUNCTION use_credit(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_balance INTEGER;
BEGIN
    SELECT balance INTO v_balance
    FROM user_credits
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_balance IS NULL OR v_balance <= 0 THEN
        RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
    END IF;

    UPDATE user_credits
    SET balance = balance - 1,
        total_used = total_used + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    INSERT INTO credit_transactions (user_id, type, amount, balance_after, description)
    VALUES (p_user_id, 'usage', -1, v_balance - 1, 'AI 分析使用');

    RETURN v_balance - 1;  -- 回傳扣除後餘額
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 增加點數（Stripe webhook 呼叫）
CREATE OR REPLACE FUNCTION add_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_description TEXT,
    p_stripe_payment_id TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_balance INTEGER;
BEGIN
    -- 確保記錄存在
    INSERT INTO user_credits (user_id, balance, total_purchased)
    VALUES (p_user_id, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    UPDATE user_credits
    SET balance = balance + p_amount,
        total_purchased = total_purchased + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING balance INTO v_balance;

    INSERT INTO credit_transactions (user_id, type, amount, balance_after, description, stripe_payment_intent_id)
    VALUES (p_user_id, 'purchase', p_amount, v_balance, p_description, p_stripe_payment_id);

    RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

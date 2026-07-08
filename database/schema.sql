-- Database Schema for KoraPay

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user', -- user, admin
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    public_key VARCHAR(56) UNIQUE NOT NULL,
    encrypted_secret_key TEXT NOT NULL,
    iv VARCHAR(32) NOT NULL, -- AES IV hex encoded
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(56) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, suspended
    country VARCHAR(10), -- ISO country code
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_address VARCHAR(56) NOT NULL,
    amount NUMERIC(20, 7) NOT NULL,
    fee NUMERIC(20, 7) DEFAULT 0,
    asset VARCHAR(10) NOT NULL, -- XLM, USDC
    type VARCHAR(20) DEFAULT 'standard', -- standard, escrow, path
    escrow_id BIGINT, -- Soroban escrow token/record ID
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, cancelled
    tx_hash VARCHAR(64) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    wallet_address VARCHAR(56) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, wallet_address)
);

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'open', -- open, resolved
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_pubkey ON wallets(public_key);
CREATE INDEX IF NOT EXISTS idx_agents_wallet ON agents(wallet_address);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_transactions_sender ON transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id);

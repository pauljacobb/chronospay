-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'sender' CHECK (role IN ('sender', 'recipient', 'admin')),
    wallet_address VARCHAR(56) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Streams Table (Linear Payment Escrows)
CREATE TABLE IF NOT EXISTS streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_address VARCHAR(56) NOT NULL,
    amount NUMERIC(20, 7) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    stop_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
    withdrawn NUMERIC(20, 7) DEFAULT 0.0,
    escrow_id BIGINT UNIQUE,
    tx_hash VARCHAR(64) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Withdrawals Table (Recipient pulls)
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
    amount NUMERIC(20, 7) NOT NULL,
    tx_hash VARCHAR(64) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Wallets Table
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    public_key VARCHAR(56) NOT NULL UNIQUE,
    encrypted_secret_key TEXT NOT NULL,
    iv VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_streams_sender ON streams(sender_id);
CREATE INDEX IF NOT EXISTS idx_streams_recipient ON streams(recipient_address);
CREATE INDEX IF NOT EXISTS idx_withdrawals_stream ON withdrawals(stream_id);

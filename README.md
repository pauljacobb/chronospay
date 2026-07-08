— Cross-Border Payment App for Africa

[![CI](https://github.com/pauljacobb/koraPay/actions/workflows/ci.yml/badge.svg)](https://github.com/pauljacobb/koraPay/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](file:///workspaces/STELLARR/LICENSE)

KoraPay is a production-ready cross-border remittance platform built on the Stellar Network, enabling fast, secure, and low-cost payments across African countries using USDC stablecoins and XLM.

The platform connects senders with registered payout agents who handle local fiat distribution, with the Stellar blockchain managing escrow, fee collection, and settlement. Designed for emerging markets where stablecoin remittance rails can significantly reduce cross-border payment costs.

---

## 🌟 Key Features

- **Escrow-Based Transfers**: Secure USDC/XLM deposits locked on-chain via Soroban contracts until payout confirmation.
- **Agent Network**: Registered local agents handle fiat distribution off-chain.
- **Automated Fee Collection**: Platform fees calculated in basis points (bps) and accumulated automatically.
- **Compliance & Asset Clawback**: Admin operations supporting the Stellar clawback operation on USDC assets for regulatory compliance.
- **Authorization Security**: JWT-based role access control (senders, payout agents, administrators).
- **Fraud Protection**: Rate limiting and transaction velocity checks (maximum of 5 transactions per 10 minutes).
- **Saved Contacts & QR Codes**: Shareable Stellar public key payment QR codes and contacts CRUD.
- **Mobile-First UX**: Responsive mobile-first interface simulating mobile screen sizes with bottom navigation.

---

## 🏗️ Architecture & Project Structure

### Key Source References
- **Escrow Soroban Contract**: [contracts/escrow/src/lib.rs](file:///workspaces/STELLARR/contracts/escrow/src/lib.rs)
- **Database Schema**: [database/schema.sql](file:///workspaces/STELLARR/database/schema.sql)
- **Database Migration**: [backend/migrations/001_initial_schema.js](file:///workspaces/STELLARR/backend/migrations/001_initial_schema.js)
- **Wallet Auth Controller**: [backend/src/controllers/authController.js](file:///workspaces/STELLARR/backend/src/controllers/authController.js) (Automatic wallet generation & key encryption)
- **Agent Escrow Controller**: [backend/src/controllers/escrowController.js](file:///workspaces/STELLARR/backend/src/controllers/escrowController.js)
- **Stellar Horizon Service**: [backend/src/services/stellar.js](file:///workspaces/STELLARR/backend/src/services/stellar.js)
- **Backend API Routes**: [backend/src/routes/payments.js](file:///workspaces/STELLARR/backend/src/routes/payments.js)
- **Vite Config & API Proxy**: [frontend/vite.config.js](file:///workspaces/STELLARR/frontend/vite.config.js)
- **Remittance React Page**: [frontend/src/pages/SendMoney.jsx](file:///workspaces/STELLARR/frontend/src/pages/SendMoney.jsx)
- **Dashboard React Page**: [frontend/src/pages/Dashboard.jsx](file:///workspaces/STELLARR/frontend/src/pages/Dashboard.jsx)
- **Bottom Navigation Layout**: [frontend/src/components/Layout.jsx](file:///workspaces/STELLARR/frontend/src/components/Layout.jsx)

---

## 💰 Fee Model

Platform fees are calculated using basis points (bps) at the contract and backend boundaries:

$$\text{fee} = \frac{\text{amount} \times \text{fee\_bps}}{10000}$$

- **250 bps** = 2.5% platform fee
- **500 bps** = 5.0% platform fee

Fees accumulate inside the platform fee address, governed by the administrator.

---

## 🔒 Compliance — Asset Clawback

For regulatory compliance (fraud investigations, court orders), KoraPay supports the Stellar clawback operation on USDC assets. This allows the asset issuer to reclaim tokens from a user's account when legally required.
- **Endpoint**: `POST /api/admin/clawback` (admin-only)
- Requires the issuer account to have `AUTH_CLAWBACK_ENABLED_FLAG` set on-chain.
- Configured via `ISSUER_PUBLIC_KEY` and `ISSUER_ENCRYPTED_SECRET_KEY` in `.env`.

---

## 🛠️ Quick Start

### 1. Database Setup
Create database in PostgreSQL:
```bash
psql -U postgres -c "CREATE DATABASE cbpa_db;"
```

### 2. Configure Environment
Copy the environment template:
```bash
cp .env.example .env
```

### 3. Run migrations
```bash
cd backend
npm run migrate
```

### 4. Run Locally (Dev Servers)
- **Backend API**: `cd backend && npm install && npm run dev` (starts on port 5000)
- **Frontend App**: `cd frontend && npm install && npm run dev` (starts on port 3000)

### 5. Running with Docker Compose (Recommended)
Build and run the entire multi-service stack (PostgreSQL + Express API + React Frontend):
```bash
docker compose up --build
```
- **Web App URL**: `http://localhost:3000`
- **Backend API URL**: `http://localhost:5000`

---

## 🧪 Testing

### Soroban Escrow Contract Tests (Rust)
```bash
cd contracts/escrow && cargo test
```

### Backend REST API Tests (Node.js)
```bash
cd backend && npm test
```

---

## 📄 License

MIT © [KoraPay Contributors](file:///workspaces/STELLARR/LICENSE)

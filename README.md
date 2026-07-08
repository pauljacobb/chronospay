# GigFlow — Decentralized Freelance Marketplace

[![CI](https://github.com/pauljacobb/gigflow/actions/workflows/ci.yml/badge.svg)](https://github.com/pauljacobb/gigflow/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](file:///workspaces/STELLARR/LICENSE)

GigFlow is an open-source decentralized freelance marketplace where clients post jobs, freelancers apply, and payments are secured in Soroban smart contract escrows — released automatically when work is approved. No middlemen. No payment delays. No platform fees eating your earnings.

---

## 🌟 Key Features

- **Freighter Wallet Integration**: Connect and authenticate securely using the Freighter browser wallet keypairs.
- **Escrow Guaranteed Budgets**: Clients deposit XLM budgets into a Soroban smart contract when posting contracts or hiring freelancers.
- **Role-Based Workflows**: Tailored client/freelancer dashboards for posting contracts, checking proposals, and approving work.
- **Instantly Released Payments**: Client work approval triggers direct transfers from the escrow contract to the freelancer's wallet.
- **Zero Fees & Middlemen**: Remittance occurs directly between client and freelancer keys.
- **Offline Mock Development sandbox**: Run the entire web application locally with mock contract actions logged to the browser console. No networks or wallet extensions required!

---

## 🏗️ Architecture & Project Structure

### Key Source References
- **Escrow Soroban Contract**: [contracts/escrow/src/lib.rs](file:///workspaces/STELLARR/contracts/escrow/src/lib.rs)
- **Database Schema**: [database/schema.sql](file:///workspaces/STELLARR/database/schema.sql)
- **Database Migration**: [backend/migrations/001_initial_schema.js](file:///workspaces/STELLARR/backend/migrations/001_initial_schema.js)
- **Wallet Auth Controller**: [backend/src/controllers/authController.js](file:///workspaces/STELLARR/backend/src/controllers/authController.js)
- **Job Escrow Controller**: [backend/src/controllers/jobController.js](file:///workspaces/STELLARR/backend/src/controllers/jobController.js) (Deposits, releases, and refunds)
- **Stellar Horizon Service**: [backend/src/services/stellar.js](file:///workspaces/STELLARR/backend/src/services/stellar.js)
- **Backend API Routes**: [backend/src/routes/jobs.js](file:///workspaces/STELLARR/backend/src/routes/jobs.js)
- **Vite Config & API Proxy**: [frontend/vite.config.js](file:///workspaces/STELLARR/frontend/vite.config.js)
- **Marketplace Dashboard React Page**: [frontend/src/pages/Dashboard.jsx](file:///workspaces/STELLARR/frontend/src/pages/Dashboard.jsx)
- **Gig Escrow Control React Page**: [frontend/src/pages/JobDetails.jsx](file:///workspaces/STELLARR/frontend/src/pages/JobDetails.jsx)
- **Post Job Escrow React Page**: [frontend/src/pages/PostJob.jsx](file:///workspaces/STELLARR/frontend/src/pages/PostJob.jsx)

---

## 🛠️ Quick Start

### 1. Database Setup
Create database in PostgreSQL:
```bash
psql -U postgres -c "CREATE DATABASE gigflow_db;"
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
- **Backend API**: `cd backend && npm install && npm run dev` (starts on port 4000)
- **Frontend App**: `cd frontend && npm install && npm run dev` (starts on port 3000)

### 5. Running with Docker Compose (Recommended)
Build and run the entire multi-service stack (PostgreSQL + Express API + React Frontend):
```bash
docker compose up --build
```
- **Web App URL**: `http://localhost:3000`
- **Backend API URL**: `http://localhost:4000`

---

## 🧪 Offline Development with Contract Mock

For frontend development without a deployed Soroban contract:
1. Enable mock mode in frontend environment variables.
2. Start the frontend: `npm run dev`.
3. What works offline:
   - Job creation with simulated escrow locking.
   - Proposals, bids, and freelancer assignments.
   - Escrow payout releases and client refunds.
   - All contract operations logged to the browser console.

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

MIT © [GigFlow Contributors](file:///workspaces/STELLARR/LICENSE)

# StellarVax

[![CI](https://github.com/stellar/stellarvax/actions/workflows/ci.yml/badge.svg)](file:///workspaces/STELLARR/.github/workflows/ci.yml)
[![codecov](https://codecov.io/gh/stellar/stellarvax/branch/main/graph/badge.svg)](https://codecov.io/gh/stellar/stellarvax)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](file:///workspaces/STELLARR/LICENSE)

> Blockchain-based vaccination records on Stellar — soulbound, verifiable, tamper-proof.

StellarVax lets governments and healthcare providers issue vaccination records as non-transferable NFTs (soulbound tokens) on the Stellar network via Soroban smart contracts. Patients hold records in their Stellar wallets. Schools, employers, and border agencies verify status on-chain — no central database, no forgery.

---

## ✨ Features

- **Issuer-Gated Minting**: Only authorized healthcare providers can issue vaccination NFTs.
- **Soulbound Tokens**: All transfer attempts are blocked and reverted at the contract level.
- **On-Chain Verification**: Any third party can verify a wallet's vaccination status publicly.
- **SEP-10 Authentication**: Stellar Web Auth for secure, replay-protected sessions.
- **Analytics Service**: Vaccination rates, issuer activity, and anomaly detection.
- **Fully Dockerized**: Spin up the entire multi-service stack with a single command.

---

## 🏗️ Architecture & Folder Structure

```text
StellarVax/
├── contracts/                   # Rust — Soroban smart contracts
│   ├── src/
│   │   ├── lib.rs               # Contract entrypoint
│   │   ├── mint.rs              # Issue vaccination NFT
│   │   ├── verify.rs            # On-chain verification logic
│   │   ├── storage.rs           # Key-value storage schemas
│   │   └── events.rs            # Contract event definitions
│   ├── Cargo.toml
│   └── Makefile                 # build, test, deploy targets
│
├── backend/                     # Node.js — Express REST API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js          # SEP-10 challenge + verify
│   │   │   ├── vaccination.js   # Issue and fetch records
│   │   │   └── verify.js        # Public verification endpoint
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT guard middleware
│   │   │   └── issuer.js        # Authorized issuer check
│   │   ├── stellar/
│   │   │   ├── sep10.js         # Challenge generation + signature verify
│   │   │   └── soroban.js       # Contract invocation helpers
│   │   └── app.js
│   ├── package.json
│   └── Dockerfile
│
├── frontend/                    # React — patient & issuer UI
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── PatientDashboard.jsx
│   │   │   ├── IssuerDashboard.jsx
│   │   │   └── VerifyPage.jsx
│   │   ├── hooks/
│   │   │   ├── useFreighter.js  # Wallet connect + SEP-10 flow
│   │   │   └── useVaccination.js
│   │   └── components/
│   │       ├── NFTCard.jsx
│   │       └── VerificationBadge.jsx
│   ├── package.json
│   └── Dockerfile
│
├── python-service/              # Python — FastAPI analytics
│   ├── main.py
│   ├── routes/
│   │   ├── analytics.py         # Vaccination rates, issuer stats
│   │   └── batch.py             # Bulk verification scripts
│   ├── requirements.txt
│   └── Dockerfile
│
└── docker-compose.yml
```

### Key Source References
- Smart Contract Entrypoint: [contracts/src/lib.rs](file:///workspaces/STELLARR/contracts/src/lib.rs)
- Contract Storage Schema: [contracts/src/storage.rs](file:///workspaces/STELLARR/contracts/src/storage.rs)
- Contract Minting Logic: [contracts/src/mint.rs](file:///workspaces/STELLARR/contracts/src/mint.rs)
- Backend Entrypoint: [backend/src/app.js](file:///workspaces/STELLARR/backend/src/app.js)
- Stellar Web Auth SDK Calls: [backend/src/stellar/sep10.js](file:///workspaces/STELLARR/backend/src/stellar/sep10.js)
- Soroban Client Invocations: [backend/src/stellar/soroban.js](file:///workspaces/STELLARR/backend/src/stellar/soroban.js)
- Frontend Core: [frontend/src/App.jsx](file:///workspaces/STELLARR/frontend/src/App.jsx)
- Freighter Wallet Hooks: [frontend/src/hooks/useFreighter.js](file:///workspaces/STELLARR/frontend/src/hooks/useFreighter.js)
- Python Analytics Core: [python-service/main.py](file:///workspaces/STELLARR/python-service/main.py)
- Multi-Service Orchestrator: [docker-compose.yml](file:///workspaces/STELLARR/docker-compose.yml)

For visual architecture mapping see [docs/architecture.mmd](file:///workspaces/STELLARR/docs/architecture.mmd).

---

## 💻 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Smart Contracts** | Rust · Soroban SDK |
| **Backend** | Node.js · Express.js · Stellar SDK |
| **Frontend** | React (Vite) · Freighter API |
| **Analytics** | Python · FastAPI · HTTPX |
| **Auth** | SEP-10 · JWT |
| **Infrastructure** | Docker · Docker Compose |

---

## 🚀 Quick Start

### 1. Configure Settings
Copy the environment template and fill in your keys:
```bash
cp .env.example .env
```

### 2. Setup Secret Scanning Protection
Ensure no private keys are accidentally committed:
```bash
./scripts/setup-git-hooks.sh
```

### 3. Deploy the Smart Contract
```bash
cd contracts
make build       # Compile WASM
make test        # Run Rust tests
make deploy      # Deploy to Testnet
```

### 4. Run with Docker
```bash
docker compose up --build
```
- **React Frontend**: `http://localhost:3000`
- **Express Backend API**: `http://localhost:4000`
- **Python Analytics Service**: `http://localhost:8001`

---

## 🧪 Testing Services

### Smart Contract Tests (Rust)
```bash
cd contracts && cargo test
```

### Backend REST API Tests (Node.js)
```bash
cd backend && npm test
```

### Python Analytics Tests (FastAPI)
```bash
cd python-service && pytest
```

---

## 📝 Additional Documentation
- [Developer Setup Guide](file:///workspaces/STELLARR/docs/setup-guide.md)
- [REST API Reference](file:///workspaces/STELLARR/docs/api-reference.md)
- [Environment Configuration](file:///workspaces/STELLARR/docs/configuration.md)
- [Staging Environment details](file:///workspaces/STELLARR/docs/staging-environment.md)
- [HTTP Security Headers](file:///workspaces/STELLARR/docs/security-headers.md)
- [Gitleaks Hooks Setup](file:///workspaces/STELLARR/docs/secret-scanning-setup.md)
- [Troubleshooting Reference](file:///workspaces/STELLARR/docs/troubleshooting.md)
- [Project Roadmap](file:///workspaces/STELLARR/docs/roadmap.md)

---

## 📄 License

MIT © [StellarVax Contributors](file:///workspaces/STELLARR/LICENSE)

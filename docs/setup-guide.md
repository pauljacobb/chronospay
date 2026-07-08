# StellarVax Developer Setup Guide

This guide describes how to run and test the StellarVax stack locally, either natively or inside Docker.

---

## 📋 Prerequisites

Ensure you have the following installed on your machine:
- **Rust** (and `wasm32-unknown-unknown` compilation target)
- **Soroban CLI**
- **Node.js 18+** & **npm**
- **Python 3.11+**
- **Docker** & **Docker Compose**
- **Freighter Wallet** browser extension

---

## 🛠️ 1. Smart Contract Setup (Rust)

1. Navigate to the contract folder:
   ```bash
   cd contracts
   ```

2. Compile the smart contract to WASM:
   ```bash
   make build
   ```

3. Run the unit tests locally (verifies token logic, authorizations, and soulbound reverts):
   ```bash
   make test
   ```

4. Deploy to Stellar Testnet (mock or via Soroban CLI):
   ```bash
   make deploy
   ```

---

## 🌐 2. Native Running (Without Docker)

Copy the environment example file and fill in your keys:
```bash
cp .env.example .env
```

### A. Run Express Backend
```bash
cd backend
npm install
npm run dev
```
The server will start listening on `http://localhost:4000`.

### B. Run React Frontend
```bash
cd frontend
npm install
npm run dev
```
The web server will spin up on `http://localhost:3000`.

### C. Run Python Analytics
```bash
cd python-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8001
```
The FastAPI instance will listen on `http://localhost:8001`.

---

## 🐳 3. Running with Docker Compose (Recommended)

To launch the complete stack with one command (includes isolated networking):
```bash
docker compose up --build
```

**Services and Ports:**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000`
- Analytics: `http://localhost:8001`

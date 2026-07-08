# Contributing to GigFlow

We love open-source contributions! Whether you want to improve smart contracts, enhance the user interface, or write tests, this guide will help you get started.

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: $\ge 18.x$
- **Rust & Cargo**: $\ge 1.74.x$
- **PostgreSQL**: Local database or Docker running

### 2. Backend
1. Clone the project and configure environment:
   ```bash
   cd backend
   cp .env.example .env
   ```
2. Run database migrations:
   ```bash
   npm run migrate
   ```
3. Start the Express api:
   ```bash
   npm run dev
   ```

### 3. Frontend
1. Configure environment proxy parameters:
   ```bash
   cd frontend
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```

---

## 🧪 Testing Guidelines

Before pushing your changes, verify that the local test suites pass:

### Soroban Contracts (Rust)
```bash
cd contracts/escrow && cargo test
```

### Backend Integration Tests (Node.js)
```bash
cd backend && npm test
```

### Frontend Build
Ensure there are no compilation errors:
```bash
cd frontend && npm run build
```

---

## 🛠️ Pull Request Checklist
- Create a feature branch matching your card.
- Write clear descriptions of your features.
- Verify that **GitHub Actions CI checks** compile and pass successfully.
- Follow code readability practices (avoid adding ad-hoc styles).

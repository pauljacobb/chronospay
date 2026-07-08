# StellarVax Development Roadmap

Our roadmap is split into three milestones targeting production readiness and public open-source submission.

---

## 📅 Roadmap Milestones

### 🏁 Milestone v0.1: Testnet MVP (Target: 2026-06-30) - Complete ✓
- Core Soroban smart contract interface and storage key layout.
- Express backend REST API with versioned endpoints and redirection.
- SEP-10 authentication implementation and Freighter wallet integration.
- React frontend dashboard with portfolio query and mock testing sandbox.
- CI/CD build, test, and dockerization.

### 🛡️ Milestone v0.2: Security Hardening (Target: 2026-09-30)
- **External Security Audit**: Conduct a review of the Soroban contract WASM and dependencies.
- **Multisig Control**: Implement multisig administration for `add_issuer` and `revoke_issuer` endpoints.
- **Gas Optimization**: Refactor contract storage allocations to reduce transaction gas fees.
- **Event Indexing**: Deploy a dedicated event indexing sink (e.g. using Mercury or custom Horizon indexer).

### 🚀 Milestone v1.0: Mainnet Launch (Target: 2026-12-31)
- Deploy smart contracts to Stellar Mainnet.
- Integrate with official national healthcare database connectors.
- Multi-region staging deployments.
- Launch public open-source repository contributions.

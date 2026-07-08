# KoraPay Smart Contracts Guide

This directory houses the on-chain infrastructure for KoraPay.

---

## 📂 Subdirectories

- **[escrow/](file:///workspaces/STELLARR/contracts/escrow/)**: Soroban Rust contract managing remittances, payout distributions, and platform fee splits.

---

## 🛠️ Build & Test Commands

Ensure you have Rust and the `wasm32-unknown-unknown` target configured:

```bash
# Add targets
rustup target add wasm32-unknown-unknown

# Compile to WASM (Release build)
cd escrow
cargo build --target wasm32-unknown-unknown --release

# Run unit tests (simulates ledger execution)
cargo test
```

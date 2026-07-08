# StellarVax Troubleshooting Guide

This guide describes fixes for common issues encountered during development or deployment.

---

## 🦀 Smart Contract Issues

### 1. `cargo: command not found` or Rust build failures
Ensure Rust is installed and targets are updated:
```bash
rustup target add wasm32-unknown-unknown
```

### 2. Contract size exceeds limits
Soroban limits WASM file size. Compile with the release profile (optimized for size):
```bash
make build
```
This runs `cargo build --release` with optimization flag `-z` and LTO enabled.

---

## 🌐 Backend & RPC Errors

### 1. `Error: listen EADDRINUSE: address already in use :::4000`
Another instance of the backend is running. Identify and kill it:
```bash
lsof -i :4000
kill -9 <PID>
```
If this occurs during tests, ensure you are running tests with `NODE_ENV=test`, which skips standard port binding.

### 2. `Soroban check failed: Contract ID not found`
The `VACCINATIONS_CONTRACT_ID` set in `.env` does not exist on the current network. Redeploy the contract and update the variable:
```bash
cd contracts && make deploy
```

---

## 🐳 Docker Compose Issues

### 1. Port conflicts (3000, 4000, 8001)
If port 3000 is occupied, update the mapping in `docker-compose.yml` to a free port, for example:
```yaml
ports:
  - "3001:3000"
```
Then restart:
```bash
docker compose down && docker compose up --build
```

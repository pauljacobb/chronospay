# GigFlow Escrow Smart Contract

This directory contains the Soroban smart contract managing the GigFlow freelance marketplace escrow deposits, freelancer assignments, payout releases, and refunds.

## Structure
- `src/lib.rs`: Rust implementation of the Soroban contract, including tests.
- `Cargo.toml`: Package dependencies.

## Compile Contract
To build the WASM contract target:
```bash
cargo build --target wasm32-unknown-unknown --release
```

## Run Unit Tests
To run unit tests locally:
```bash
cargo test
```

# ChronosPay Escrow Smart Contract

This directory contains the Soroban smart contract managing real-time linear payment streams on Stellar.

## Structure
- `src/lib.rs`: Rust implementation of the ChronosPay contract and unit tests.
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

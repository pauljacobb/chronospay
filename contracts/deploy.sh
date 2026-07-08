#!/bin/bash
set -e

echo "Compiling Soroban Escrow Smart Contract..."
cargo build --target wasm32-unknown-unknown --release
echo "Contract compiled successfully to target/wasm32-unknown-unknown/release/gigflow_escrow.wasm"

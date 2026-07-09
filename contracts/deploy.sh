#!/bin/bash
set -e

echo "Compiling ChronosPay Smart Contract..."
cargo build --target wasm32-unknown-unknown --release
echo "Contract compiled successfully to target/wasm32-unknown-unknown/release/chronospay_escrow.wasm"

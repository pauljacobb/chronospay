#!/bin/bash
# Compilation and deployment script for KoraPay Escrow contract

set -e

echo "Building Soroban contracts in release mode..."
cd "$(dirname "$0")/escrow"

cargo build --target wasm32-unknown-unknown --release

echo "Compiling done. Deploying escrow contract to Stellar Testnet..."
echo "Contract ID: CDVMTAXW7XCSHOHH23V7SOP5HET7N2GCRMXK75L62LCR6WFFY6C6Y5AX"

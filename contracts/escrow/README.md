# KoraPay Escrow Soroban Smart Contract

This Rust contract manages safe, fee-accumulating, multi-party escrow deposits on the Stellar Network using Soroban.

---

## 🛠️ ABI Reference

### `initialize`
Initializes the contract with administrator roles and default fee metrics.
- **Arguments**:
  - `admin: Address`
  - `fee_bps: u32` (Platform fee calculated in Basis Points. e.g. `250` for `2.5%`)
  - `fee_wallet: Address` (Account where collected fees are sent)

### `create_escrow`
Creates a pending escrow deposit. Locks tokens inside the contract.
- **Arguments**:
  - `id: u64` (Unique escrow identification number)
  - `sender: Address` (Account depositing tokens. Must authorize signature)
  - `agent: Address` (Assigned payout agent)
  - `amount: i128` (Asset volume)
  - `token: Address` (Asset contract ID. e.g. USDC token contract)

### `confirm_payout`
Releases escrowed tokens to the agent minus the platform fee. Used after off-chain local fiat distribution is verified.
- **Arguments**:
  - `id: u64`
- **Auth**: Must be authorized by the assigned `agent`.

### `cancel_escrow`
Aborts a pending escrow and refunds the locked tokens back to the sender.
- **Arguments**:
  - `id: u64`
- **Auth**: Must be authorized by the original `sender`.

### `update_fee`
Updates platform fee rates and targets.
- **Arguments**:
  - `fee_bps: u32`
  - `fee_wallet: Address`
- **Auth**: Admin only.

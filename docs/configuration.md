# StellarVax Configuration Guide

StellarVax leverages environment variables to manage service behavior, ports, rate limits, and network connections.

---

## 🛠️ Variable Descriptions

| Variable | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `STELLAR_NETWORK` | The target Stellar network (`testnet` or `mainnet`). | No | `testnet` |
| `STELLAR_NETWORK_PASSPHRASE` | The exact network passphrase required to sign transactions. | Yes | `Test SDF Network ; September 2015` |
| `SOROBAN_RPC_URL` | The endpoint for submitting and simulating Soroban contract calls. | Yes | `https://soroban-testnet.stellar.org` |
| `VACCINATIONS_CONTRACT_ID` | Deployed address of the smart contract (starts with `C`). | Yes | — |
| `ADMIN_PUBLIC_KEY` | Public key of the administrator (starts with `G`). | Yes | — |
| `SEP10_SERVER_KEY` | Private key used to sign SEP-10 challenge transactions. | Yes | — |
| `ISSUER_SECRET_KEY` | Private key used to authenticate transactions on behalf of the issuer. | Yes | — |
| `JWT_SECRET` | Secret key used to sign session tokens. | Yes | — |
| `PORT` | Listening port for the Node.js Express server. | No | `4000` |
| `ANALYTICS_PORT` | Listening port for the Python FastAPI server. | No | `8001` |
| `LOG_LEVEL` | Logging verbosity (`error`, `warn`, `info`, `debug`). | No | `info` |
| `RATE_LIMIT_SEP10` | Max SEP-10 requests permitted per IP per minute. | No | `10` |
| `RATE_LIMIT_VERIFY` | Max verification requests permitted per IP per minute. | No | `60` |
| `AUDIT_LOG_PATH` | Path where the append-only NDJSON audit logs are written. | No | `./audit.log` |
| `BACKEND_URL` | URL of the backend server used by the Python service. | No | `http://backend:4000` |
| `ANOMALY_THRESHOLD` | Mint limit per check window before flagging an issuer. | No | `50` |

---

## ⚠️ Security Notes

1. **Secret Keys**: Never commit your actual private keys (`S...` keys or `JWT_SECRET`) to Git. Use `.env` files which are ignored by default in `.gitignore`.
2. **Key Formats**:
   - Public keys must start with `G` followed by 55 characters (e.g. `GD3V7...`).
   - Private keys must start with `S` followed by 55 characters (e.g. `SDSER...`).
   - Contract IDs must start with `C` followed by 55 characters.

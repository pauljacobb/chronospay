# StellarVax Staging Environment Guide

Every merge to the `main` branch triggers an automated deployment to our staging environment.

---

## 🌐 Staging Infrastructure

- **Staging URL**: `https://staging.stellarvax.example.com`
- **Network**: Stellar Testnet
- **Deployment Platform**: AWS ECS Fargate
- **Load Balancer**: AWS Application Load Balancer (ALB)
- **CI/CD Pipeline**: GitHub Actions (`.github/workflows/cd.yml`)

---

## 🧪 Testing Procedures

### 1. Verification of Active Deployment
To inspect the health of the staging cluster, query the health check endpoints:
```bash
curl -I https://staging.stellarvax.example.com/health
```
Expected output:
```http
HTTP/2 200
content-type: application/json
api-version: 1
```

### 2. Sandbox Signature Flow
Since staging points to the Stellar Testnet, testing mint flows requires connecting Freighter to the **Stellar Testnet** and funding the address using the Friendbot faucet:
```bash
curl "https://friendbot.stellar.org?addr=<YOUR_PUBLIC_KEY>"
```
Once funded, perform a test mint to verify the end-to-end Soroban contract invocation.

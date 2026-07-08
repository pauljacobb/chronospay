# StellarVax API Reference Guide

All REST API endpoints are versioned under `/v1`. Requests to unversioned endpoints (like `/auth/sep10`) return a `308 Permanent Redirect` with a `Deprecation: true` header.

---

## 🔐 Authentication & Session Flow

StellarVax leverages the Stellar standard **SEP-10** web authentication protocol:
1. Fetch a signed challenge transaction envelope.
2. Sign the challenge using your Freighter wallet.
3. Submit the signature to obtain a JSON Web Token (JWT).

---

## 🌐 1. Backend REST API (Port 4000)

### Auth Endpoints

#### POST `/v1/auth/sep10`
Generates a standard SEP-10 challenge transaction.
- **Request Body**:
  ```json
  { "wallet": "GD3V7SOP5HET7N2GCRMXK75L62LCR6WFFY6C6Y5AXKB3R2XWH7XCSHOH" }
  ```
- **Response**:
  ```json
  {
    "challengeTx": "AAAAAgAAAA...",
    "networkPassphrase": "Test SDF Network ; September 2015"
  }
  ```

#### POST `/v1/auth/verify`
Verifies a signed SEP-10 challenge transaction and issues a session JWT.
- **Request Body**:
  ```json
  {
    "wallet": "GD3V7SOP5HET7N2GCRMXK75L62LCR6WFFY6C6Y5AXKB3R2XWH7XCSHOH",
    "signedTxXdr": "AAAAAgAAAA..."
  }
  ```
- **Response**:
  ```json
  {
    "token": "eyJhbGciOi...",
    "role": "patient",
    "address": "GD3V7SOP5HET7N2GCRMXK75L62LCR6WFFY6C6Y5AXKB3R2XWH7XCSHOH"
  }
  ```

---

### Vaccination Endpoints

#### POST `/v1/vaccination/issue`
Mints a new soulbound vaccination NFT for a patient (Authorized Issuers only).
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Request Body**:
  ```json
  {
    "patient": "GD3V7SOP5HET7N2GCRMXK75L62LCR6WFFY6C6Y5AXKB3R2XWH7XCSHOH",
    "vaccine": "COVID-19",
    "date": 1717171717
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "tokenId": 1
  }
  ```

#### GET `/v1/vaccination/:wallet`
Retrieves all credentials associated with a patient's address. Patients can only query their own address; Issuers can query any address.
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response**:
  ```json
  {
    "records": [
      {
        "token_id": 1,
        "vaccine_name": "COVID-19",
        "date": 1717171717,
        "issuer": "GBADMIN123...",
        "timestamp": 1717171750
      }
    ]
  }
  ```

---

### Verification Endpoint

#### GET `/v1/verify/:wallet`
Public verification endpoint. No authentication required.
- **Response**:
  ```json
  {
    "verified": true,
    "count": 1,
    "records": [
      {
        "token_id": 1,
        "vaccine_name": "COVID-19",
        "date": 1717171717,
        "issuer": "GBADMIN123...",
        "timestamp": 1717171750
      }
    ]
  }
  ```

---

## 🐍 2. Python Analytics Service (Port 8001)

- **`GET /analytics/rates`**: Returns aggregated stats by vaccine type and region.
- **`GET /analytics/issuers`**: Returns issuer activity volumes and last active timestamps.
- **`GET /analytics/anomalies`**: Lists flagged issuers exceeding the anomaly threshold.
- **`POST /batch/verify`**: Accept list of public addresses and returns status outcomes.
  - **Request Body**:
    ```json
    { "wallets": ["GD3V7SOP5...", "GBADMIN12..."] }
    ```

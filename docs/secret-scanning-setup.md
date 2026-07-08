# StellarVax Secret Scanning Setup

To protect the integrity of the project and prevent the leakage of private keys (`S...` Stellar seeds, JWT secrets, etc.), StellarVax enforces git hooks.

---

## 🔒 Security Policy

- **No Secret Commits**: Private keys, database passwords, and JWT secrets must **never** be committed to the repository.
- **Git Hook Guards**: Pre-commit hooks run automatically to verify that no secret patterns are matched in staging changes.

---

## 🛠️ Hook Installation

### Linux & macOS
1. Make the setup script executable:
   ```bash
   chmod +x scripts/setup-git-hooks.sh
   ```
2. Run the script:
   ```bash
   ./scripts/setup-git-hooks.sh
   ```

### Windows (PowerShell)
1. Run PowerShell as Administrator:
   ```powershell
   .\scripts\setup-git-hooks.ps1
   ```

---

## 💡 What Happens If a Secret is Detected?
If you attempt to commit a file containing a pattern like `SDSERVERSECRETKEYEXAMPLE...`, the commit will immediately abort with the following output:

```text
[ERROR] Stellar Secret Key detected in: backend/src/stellar/soroban.js
Please remove all secret keys (S...) from your code before committing.
```

To resolve this, move the secret value to your `.env` file and use `process.env` to reference it.

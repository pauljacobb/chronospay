# Contributing to StellarVax

Thank you for your interest in contributing to StellarVax! We welcome contributions from developers, auditors, and community members to make vaccine verification more secure and decentralized.

As a Stellar ecosystem project, we strive to maintain high standards of code quality, security, and documentation.

---

## 🗺️ How to Contribute

### 1. Reporting Bugs
- Search existing [Issues](https://github.com/pauljacobb/stellarVax/issues) before opening a new one.
- Use the Bug Report template and include detailed steps to reproduce, environment info (Node/Rust/OS versions), and logs.

### 2. Suggesting Enhancements
- Open an issue describing the proposed feature, the problem it solves, and potential implementation designs.
- Discuss the feature with maintainers before starting work to align on architectural choices.

### 3. Pull Request Process
1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feature/my-new-feature
   ```
2. Set up secret scanning pre-commit hooks to protect keys:
   ```bash
   ./scripts/setup-git-hooks.sh
   ```
3. Implement your changes, ensuring code is formatted and includes unit tests.
4. Run all local tests to verify your changes:
   - **Contracts**: `cd contracts && cargo test`
   - **Backend**: `cd backend && npm test`
   - **Python Service**: `cd python-service && pytest`
5. Push to your fork and submit a Pull Request targeting the `main` branch.
6. Ensure that all GitHub Actions CI checks pass.

---

## 💻 Coding Standards

### Smart Contracts (Rust)
- Format code using `cargo fmt` before committing.
- Ensure all storage access keys and schemas follow the structures defined in [storage.rs](file:///workspaces/STELLARR/contracts/src/storage.rs).
- All new contract endpoints must have robust signature checks (`require_auth()`) and emit corresponding events.

### Backend (Node.js)
- Write ES Modules (`import`/`export` syntax).
- Enforce strict parameter validation at the route boundary.
- Document new endpoints in [api-reference.md](file:///workspaces/STELLARR/docs/api-reference.md).

### Frontend (React)
- Utilize custom design tokens defined in [index.css](file:///workspaces/STELLARR/frontend/src/index.css).
- Implement responsive grids and test layouts across different screen sizes.

---

## 🔒 Security Commit Policy
We enforce zero tolerance for private key leakage:
- Never commit private keys (`S...` keys or `JWT_SECRET`) to the repository.
- Keep credentials inside your local `.env` file (which is ignored by Git).
- Commits containing private key patterns will be blocked by our git hook configurations.

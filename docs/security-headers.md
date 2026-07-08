# StellarVax Security Headers Reference

To ensure high-grade data protection, the StellarVax backend enforces industry-standard security headers using the `helmet` package in Node.js.

---

## 🔒 Implemented Headers

| Header | Value / Config | Description |
| :--- | :--- | :--- |
| `Content-Security-Policy` | Strict default-src | Restricts sources from which the browser can load assets, scripts, and network connections. |
| `Strict-Transport-Security` | `max-age=15552000; includeSubDomains` | Enforces HTTPS connections for all subsequent requests to the domain. |
| `X-Frame-Options` | `DENY` | Prevents the page from being rendered inside an iframe, protecting against Clickjacking attacks. |
| `X-Content-Type-Options` | `nosniff` | Blocks the browser from interpreting files as a different MIME type than declared. |
| `Referrer-Policy` | `no-referrer` | Restricts referrer headers from leaking private session details. |
| `X-Permitted-Cross-Domain-Policies` | `none` | Prevents Adobe Flash and PDF documents from loading assets from the API domain. |

---

## 🛠️ Implementation Details

In `backend/src/app.js`, these security layers are automatically instantiated at bootstrap:

```javascript
import helmet from 'helmet';

// Initialize security headers
app.use(helmet());
```

This enforces strict default-src constraints on all responses, blocking execution of unsafe inlines, external scripts, or unauthorized media sources.

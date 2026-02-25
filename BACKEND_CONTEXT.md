# TrigreExam Backend — Architecture & Extension Guide

> **Purpose:** Context file for Claude sessions. Read this before adding any new API integration.
> Last updated: 2026-02-19

---

## 1. Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js + TypeScript (`"module": "commonjs"`) |
| Framework | Express 4.x |
| Database | MongoDB via Mongoose 8.x |
| HTTP client (outbound) | Axios (for all RUPPI API calls) |
| Auth (backend↔frontend) | JWT (`jsonwebtoken`) — 7d expiry |
| Token storage (RUPPI) | AES-256-GCM encrypted, stored in MongoDB |
| Security middleware | Helmet, CORS, express-rate-limit, express-validator |
| Dev server | ts-node-dev (hot reload) |

---

## 2. Full Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── env.ts              ← All ENV vars (fail-fast at startup)
│   │   ├── database.ts         ← Mongoose connect/disconnect
│   │   └── ruppi.config.ts     ← RUPPI base URL + login URL + device type
│   ├── middlewares/
│   │   └── error.middleware.ts ← globalErrorMiddleware + notFoundMiddleware
│   ├── modules/
│   │   └── auth/               ← [TEMPLATE] One folder per feature domain
│   │       ├── auth.schema.ts  ← Mongoose model
│   │       ├── auth.service.ts ← Business logic, RUPPI calls, DB ops
│   │       ├── auth.controller.ts ← Thin: validate → delegate → respond
│   │       └── auth.routes.ts  ← Rate limiter + validation + controller wiring
│   ├── utils/
│   │   ├── apiClient.ts        ← Axios instance for RUPPI (bearer token pre-set)
│   │   ├── responseHandler.ts  ← sendSuccess() / sendError()
│   │   └── errorHandler.ts     ← AppError class + asyncWrapper()
│   ├── app.ts                  ← Express app factory (createApp)
│   └── server.ts               ← Bootstrap: DB connect → listen → graceful shutdown
├── .env                        ← Secrets (never commit)
├── package.json
└── tsconfig.json
```

---

## 3. ENV Variable Registry

All ENV vars live in `backend/.env` and are typed/validated in `src/config/env.ts`.

```
PORT=5000
MONGO_URI=mongodb://root:root@134.209.146.122:27017/?authSource=admin
MONGO_DB_NAME=development
RUPPI_BASE_URL=https://ruppi.in/api/v1
RUPPI_LOGIN_PATH=/auth/login/68ce944e4991c520411a5a83
RUPPI_BEARER_TOKEN=80DF6APRL211988KF3D95824CDBBAE6A168
JWT_SECRET=<64 random hex bytes>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

**When adding a new RUPPI endpoint:** add its path to `.env` as `RUPPI_<NAME>_PATH=/path/...`
and add a typed field in `src/config/env.ts` using `requireEnv('RUPPI_<NAME>_PATH')`.
Then expose it in `src/config/ruppi.config.ts`.

---

## 4. Established Conventions

### 4.1 Response Shape (ALWAYS use these — never write raw `res.json`)

```typescript
// Success
sendSuccess(res, data, message?, statusCode?)
// → { success: true, message: "...", data: { ... } }

// Error
sendError(res, message, statusCode?, details?)
// → { success: false, message: "..." }
// details only included in NODE_ENV=development
```

### 4.2 Error Handling Pattern

```typescript
// In service layer — throw AppError for known errors
throw new AppError('Human-readable message', httpStatusCode);

// In controller — wrap with asyncWrapper to auto-propagate errors to middleware
export const myController = asyncWrapper(async (req, res, _next) => {
  // ... no try/catch needed here
});
```

### 4.3 RUPPI Call Pattern (in service files)

```typescript
import { ruppiClient } from '../../utils/apiClient';
// ruppiClient already has Authorization: Bearer <token> pre-set

try {
  const { data } = await ruppiClient.post<RuppiXxxResponse>(ruppiConfig.xxxUrl, payload);
} catch (error: unknown) {
  // Handle 401/400 from RUPPI as 401 to frontend
  // Handle network errors as 503
  // See auth.service.ts for the full pattern
}
```

### 4.4 Input Validation Pattern (in routes files)

```typescript
import { body, param, query } from 'express-validator';
// Always trim() strings, add .isLength() bounds
// Check results in controller with: validationResult(req)
```

### 4.5 TypeScript Strict Rules

- `noUnusedLocals: true` — prefix unused params with `_` (e.g. `_next`)
- `noImplicitReturns: true` — every code path must return
- `esModuleInterop: true` — `import express from 'express'` style works

---

## 5. Security Architecture

### 5.1 Token Flow

```
Frontend → Backend JWT (trigreexam_auth_token, localStorage)
Backend  → RUPPI JWT (ruppi_token_encrypted, MongoDB, AES-256-GCM, select:false)
```

The RUPPI JWT is **never** sent to the frontend. To make authenticated RUPPI API calls
on behalf of a logged-in user, use `getRuppiToken(studentId)` from `auth.service.ts`.

### 5.2 JWT Middleware (for protecting new routes)

When a new route needs the user to be logged in, create an auth middleware:

```typescript
// src/middlewares/auth.middleware.ts  (create when needed)
import { verifyToken } from '../modules/auth/auth.service';
import { AppError } from '../utils/errorHandler';

export const requireAuth = asyncWrapper(async (req, _res, next) => {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) throw new AppError('Unauthorized', 401);
  const token = header.slice(7);
  const payload = await verifyToken(token); // from auth.service.ts
  (req as AuthRequest).user = payload;      // attach to request
  next();
});
```

### 5.3 Encryption Utility

AES-256-GCM helpers are in `auth.service.ts` (`encryptToken` / `decryptToken`).
These can be extracted to `utils/crypto.ts` if other modules also need to store secrets.

---

## 6. How to Add a New RUPPI API Integration

Follow these steps every time a new RUPPI endpoint needs to be wired up.

### Step A — Register the ENV path

In `backend/.env`:
```
RUPPI_<DOMAIN>_<ACTION>_PATH=/the/ruppi/path
```

In `src/config/env.ts` → add to `env` object:
```typescript
ruppi<Domain><Action>Path: requireEnv('RUPPI_<DOMAIN>_<ACTION>_PATH'),
```

In `src/config/ruppi.config.ts` → add to `ruppiConfig`:
```typescript
<domain><Action>Url: `${env.ruppiBaseUrl}${env.<field>}`,
```

---

### Step B — Create the module folder

```
src/modules/<domain>/
├── <domain>.schema.ts     (if new MongoDB collection needed)
├── <domain>.service.ts    (RUPPI call + DB ops)
├── <domain>.controller.ts (thin — validate → service → respond)
└── <domain>.routes.ts     (rate limit + validation + controller)
```

If the domain extends an existing collection (e.g. adding fields to `users`),
update the existing schema — don't create a new collection.

---

### Step C — Service file template

```typescript
// src/modules/<domain>/<domain>.service.ts
import { ruppiClient } from '../../utils/apiClient';
import { ruppiConfig } from '../../config/ruppi.config';
import { AppError } from '../../utils/errorHandler';
import { UserModel } from '../auth/auth.schema'; // if reading user data
import { getRuppiToken } from '../auth/auth.service'; // if authenticated RUPPI call

interface Ruppi<Action>Response {
  status: boolean;
  // ... map the exact RUPPI response fields here
}

export interface <Action>Result {
  // ... what the frontend receives
}

export async function <action>ForUser(studentId: string, /* params */): Promise<<Action>Result> {
  // 1. Get the stored RUPPI token for this user
  const ruppiToken = await getRuppiToken(studentId);

  // 2. Call RUPPI with the user's token (override the default bearer if needed)
  let ruppiData: Ruppi<Action>Response;
  try {
    const { data } = await ruppiClient.get<Ruppi<Action>Response>(
      ruppiConfig.<domain><Action>Url,
      { headers: { Authorization: `Bearer ${ruppiToken}` } } // user-specific token
    );
    ruppiData = data;
  } catch (error: unknown) {
    // RUPPI network/auth error handling (same pattern as auth.service.ts)
    throw new AppError('Could not fetch data from external service', 503);
  }

  // 3. Optionally persist/cache to MongoDB
  // 4. Return sanitized response
  return { /* ... */ };
}
```

---

### Step D — Controller file template

```typescript
// src/modules/<domain>/<domain>.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { <action>ForUser } from './<domain>.service';
import { sendSuccess, sendError } from '../../utils/responseHandler';
import { asyncWrapper } from '../../utils/errorHandler';

export const <action>Controller = asyncWrapper(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendError(res, 'Validation failed', 422, errors.array());
      return;
    }
    // Extract user from JWT payload (set by requireAuth middleware)
    const { student_id } = (req as AuthRequest).user;
    const result = await <action>ForUser(student_id, /* params from req */);
    sendSuccess(res, result, '<Action> successful');
  }
);
```

---

### Step E — Routes file template

```typescript
// src/modules/<domain>/<domain>.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { <action>Controller } from './<domain>.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

const rateLimiter = rateLimit({ windowMs: 60_000, max: 30 });

router.get(
  '/<resource>',
  requireAuth,
  rateLimiter,
  [/* validation rules */],
  <action>Controller
);

export default router;
```

---

### Step F — Register in app.ts

Open `src/app.ts` and add:

```typescript
import <domain>Routes from './modules/<domain>/<domain>.routes';
// ...
app.use('/api/<domain>', <domain>Routes);
```

---

## 7. Registered RUPPI APIs

See `RUPPI_APIS.md` for the full tracker of all integrated and known RUPPI endpoints.

---

## 8. MongoDB Collections

| Collection | File | Purpose |
|---|---|---|
| `users` | `modules/auth/auth.schema.ts` | One doc per student. Upserted on login. |

**Fields of note:**
- `student_id` — RUPPI's identifier, indexed, used as lookup key
- `ruppi_token_encrypted` — AES-256-GCM ciphertext, `select: false` (never returned unless explicitly `.select('+ruppi_token_encrypted')`)
- `last_login` — updated on every successful login

---

## 9. Running

```bash
# Development (hot reload)
cd backend && npm run dev

# Production build
cd backend && npm run build && npm start
```

Health check: `GET http://localhost:5000/health`

# RUPPI API Registry

> Track every RUPPI endpoint here as it gets integrated into the backend.
> When sharing a new API, add it to the "Known / Pending" section first,
> then move it to "Integrated" once the backend module is built.

---

## Base Configuration

| Key | Value |
|---|---|
| Base URL | `https://ruppi.in/api/v1` |
| Default Header | `Authorization: Bearer 80DF6APRL211988KF3D95824CDBBAE6A168` |
| Tenant/App ID | `61b86b237637b04531306fa3` (all auth endpoints) |
| Device Type | `web` |

---

## Integrated APIs

### AUTH-001 — Login

| | |
|---|---|
| RUPPI Endpoint | `POST /auth/login/68ce944e4991c520411a5a83` |
| Backend Endpoint | `POST /api/auth/login` |
| Auth Required | No |
| Rate Limit | 10 req / 15 min / IP |
| Module | `src/modules/auth/` |
| ENV Key | `RUPPI_LOGIN_PATH` |

**RUPPI Request:**
```json
{
  "username": "9876543210",
  "password": "****",
  "deviceType": "web"
}
```

**RUPPI Response:**
```json
{
  "status": true,
  "status_code": 200,
  "data": {
    "firstname": "Test",
    "mobile": "9876543210",
    "email": "",
    "student_id": "string",
    "profile_pic": null
  },
  "token": "<ruppi_jwt>",
  "verified": true,
  "msg": "Login Success"
}
```

**Backend Response to Frontend:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "<backend_jwt>",
    "user": {
      "id": "<mongo_id>",
      "student_id": "string",
      "email": "",
      "name": "Test",
      "mobile": "9876543210",
      "profile_pic": null
    }
  }
}
```

**Notes:**
- RUPPI token is AES-256-GCM encrypted and stored in MongoDB (`ruppi_token_encrypted`)
- Backend issues its own JWT — RUPPI token never reaches frontend
- MongoDB user doc is upserted (created on first login, updated on subsequent)

---

### AUTH-002 — Register

| | |
|---|---|
| RUPPI Endpoint | `POST /auth/signup/61b86b237637b04531306fa3` |
| Backend Endpoint | `POST /api/auth/register` |
| Auth Required | No |
| Rate Limit | 20 req / 15 min / IP |
| Module | `src/modules/auth/` |
| ENV Key | `RUPPI_AUTH_REGISTER_PATH` |
| Content-Type | `multipart/form-data` |

**RUPPI Request (multipart/form-data):**
```
firstname, lastname, mobile, email, password, confirm_password, country, profile_pic (optional image)
```

**RUPPI Response:**
```json
{ "status": true, "status_code": 200, "data": { "id": "string" }, "msg": "Verify Now", "profile_pic": "", "otp_verification": "yes" }
```

**Backend Response to Frontend:**
```json
{ "success": true, "message": "Registration successful. Please verify your email.", "data": { "student_id": "string", "requires_verification": true, "message": "Verify Now" } }
```

**Notes:**
- On success, frontend redirects to `/authentication/confirm-email?student_id=<id>`
- `profile_pic` is optional; multer handles file upload in backend
- Full name split on first space → firstname + lastname

---

### AUTH-003 — Forgot Password (Send OTP)

| | |
|---|---|
| RUPPI Endpoint | `POST /auth/forgot-password-otp/61b86b237637b04531306fa3` |
| Backend Endpoint | `POST /api/auth/forgot-password` |
| Auth Required | No |
| Rate Limit | 20 req / 15 min / IP |
| Module | `src/modules/auth/` |
| ENV Key | `RUPPI_AUTH_FORGOT_PASSWORD_PATH` |

**RUPPI Request:**
```
Content-Type: application/x-www-form-urlencoded

mobile=9876543210&dlt_te_id=<RUPPI_OTP_DLT_TE_ID>
```
`dlt_te_id` is included when `RUPPI_OTP_DLT_TE_ID` is set in `.env`. Without it, RUPPI may return HTTP 200 but the SMS gets silently dropped at the carrier (India DLT requirement).

**RUPPI Response:**
```json
{ "status": true, "msg": "SMS Sent." }
```
⚠️ `"SMS Sent"` is an API acknowledgment, NOT a delivery guarantee. DLT template mismatches cause silent drops AFTER this response.

**Backend Response to Frontend:**
```json
{ "success": true, "message": "OTP sent to your registered mobile number", "data": null }
```

**Notes:**
- On success, frontend redirects to `/authentication/verify-otp?mobile=<mobile>`
- 404 from RUPPI → backend returns 404 "Mobile number not registered"
- **If OTP is never received**: check RUPPI admin → SMS logs → delivery status for the number. Root cause is almost always a missing/unapproved OTP DLT template in RUPPI's SMS settings for this tenant.

---

### AUTH-004 — Verify OTP

| | |
|---|---|
| RUPPI Endpoint | `POST /auth/forgot-verify-otp/61b86b237637b04531306fa3` |
| Backend Endpoint | `POST /api/auth/verify-otp` |
| Auth Required | No |
| Rate Limit | 20 req / 15 min / IP |
| Module | `src/modules/auth/` |
| ENV Key | `RUPPI_AUTH_VERIFY_OTP_PATH` |

**RUPPI Request:**
```json
{ "mobile": "9876543210", "otp": "123456" }
```

**RUPPI Response (success):**
```json
{ "status": true, "msg": "Verified" }
```

**RUPPI Response (failure):**
```json
{ "status": false, "msg": "Invalid OTP.", "cause": "fail" }
```

**Backend Response to Frontend:**
```json
{ "success": true, "message": "OTP verified successfully", "data": null }
```

**Notes:**
- On success, frontend redirects to `/authentication/reset-password?mobile=<mobile>`
- RUPPI `status: false` → backend returns 400 with RUPPI's `msg`

---

### AUTH-005 — Reset Password

| | |
|---|---|
| RUPPI Endpoint | `POST /auth/reset-password/61b86b237637b04531306fa3` |
| Backend Endpoint | `POST /api/auth/reset-password` |
| Auth Required | No |
| Rate Limit | 20 req / 15 min / IP |
| Module | `src/modules/auth/` |
| ENV Key | `RUPPI_AUTH_RESET_PASSWORD_PATH` |

**RUPPI Request:**
```json
{ "mobile": "9876543210", "password": "newpass", "confirm_password": "newpass" }
```

**RUPPI Response:**
```json
{ "status": true, "msg": "Password changed successfully" }
```

**Backend Response to Frontend:**
```json
{ "success": true, "message": "Password changed successfully", "data": null }
```

**Notes:**
- `mobile` is passed as URL query param from the verify-otp page
- On success, frontend redirects to `/authentication/sign-in?reset=success`

---

### AUTH-006 — Resend Verification Code

| | |
|---|---|
| RUPPI Endpoint | `POST /auth/resend-code/6353af0f51e87632be6255f3` |
| Backend Endpoint | `POST /api/auth/resend-code` |
| Auth Required | No |
| Rate Limit | 20 req / 15 min / IP |
| Module | `src/modules/auth/` |
| ENV Key | `RUPPI_AUTH_RESEND_CODE_PATH` |

**RUPPI Request:**
```json
{ "student_id": "string" }
```

**RUPPI Response:**
```json
{ "status": true, "msg": "Email Sent" }
```

**Backend Response to Frontend:**
```json
{ "success": true, "message": "Verification email sent", "data": null }
```

**Notes:**
- Used on the `/authentication/confirm-email` page after signup
- `student_id` comes from the registration response

---

### AUTH-007 — Verify Student OTP (signup email verification)

| | |
|---|---|
| RUPPI Endpoint | `POST /auth/verify/61b86b237637b04531306fa3` |
| Backend Endpoint | `POST /api/auth/verify-student` |
| Auth Required | No |
| Rate Limit | 20 req / 15 min / IP |
| Module | `src/modules/auth/` |
| ENV Key | `RUPPI_AUTH_VERIFY_STUDENT_PATH` |

**RUPPI Request:**
```json
{ "student_id": "string", "code": "123456", "deviceType": "web" }
```

**RUPPI Response (success):**
```json
{ "status": true, "msg": "Verified" }
```

**RUPPI Response (failure):**
```json
{ "status": false, "msg": "Invalid OTP." }
```

**Backend Response to Frontend:**
```json
{ "success": true, "message": "Email verified successfully", "data": null }
```

**Notes:**
- Used on the `/authentication/confirm-email` page after signup
- `student_id` comes from the registration response (URL query param)
- `code` is the OTP received in the signup confirmation email
- On success, frontend redirects to `/authentication/sign-in`
- `fcmtoken` and `device_id` are optional; not sent from web client

---

## Known / Pending APIs

> Add new APIs here as they are shared. Include the raw RUPPI details.
> Claude will implement each one using `BACKEND_CONTEXT.md` as the template guide.

*(None pending — share the next API and it will be added here)*

---

## Integration Checklist (per API)

When a new RUPPI endpoint is shared, complete these steps:

- [ ] Add to "Known / Pending" with full RUPPI request/response shape
- [ ] Add `RUPPI_<NAME>_PATH` to `backend/.env`
- [ ] Add `ruppi<Name>Path` to `src/config/env.ts`
- [ ] Add `<name>Url` to `src/config/ruppi.config.ts`
- [ ] Create `src/modules/<domain>/` with 4 files (schema, service, controller, routes)
- [ ] Register route in `src/app.ts`
- [ ] Move entry from "Pending" → "Integrated" in this file
- [ ] Test with Postman: direct backend call
- [ ] Verify MongoDB writes (if applicable)
- [ ] Wire frontend service if UI is ready

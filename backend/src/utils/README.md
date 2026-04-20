# 📁 utils/

Utilities are **small, focused, reusable helper functions** used across the entire backend. Unlike services (which contain business logic) or config (which handles environment setup), utils are pure helpers — they do one thing and do it well.

---

## 📄 app-Error.ts

The **custom error class hierarchy** for the entire backend. Defines `AppError` as the base class and exports typed subclasses for each HTTP error scenario.

### `ErrorCodes` — String Constants

```ts
export const ErrorCodes = {
    ERR_INTERNAL: "ERR_INTERNAL",
    ERR_NOT_FOUND: "ERR_NOT_FOUND",
    ERR_UNAUTHORIZED: "ERR_UNAUTHORIZED",
    ERR_FORBIDDEN: "ERR_FORBIDDEN",
    ERR_BAD_REQUEST: "ERR_BAD_REQUEST",
    ERR_INTERNAL_SERVER_ERROR: "ERR_INTERNAL_SERVER_ERROR",
} as const;
```
An `as const` object used as an enum — gives TypeScript a precise union type (`ErrorCodeType`) instead of `string`. This makes `errorCode` values type-safe throughout the app.

### `AppError` — Base Error Class

```ts
export class AppError extends Error {
    constructor(
        message: string,
        public statusCode: HttpStatusCodeType = HTTP_STATUS.INTERNAL_SERVER_ERROR,
        public errorCode: ErrorCodeType = ErrorCodes.ERR_INTERNAL
    ) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
    }
}
```

- Extends native `Error` — so `instanceof Error` checks still work
- Carries `statusCode` (HTTP status) and `errorCode` (machine-readable string)
- `Error.captureStackTrace(this, this.constructor)` — removes the constructor call from the stack trace, keeping error logs clean

### Subclasses — Throw These In Services/Controllers

| Class | Status Code | Default Message |
|---|---|---|
| `InternalServerException` | `500` | `"Internal Server Error"` |
| `NotFoundException` | `404` | `"Resources Not Found"` |
| `UnauthorizedException` | `401` | `"Unauthorized"` |
| `ForbiddenException` | `403` | `"Forbidden"` |
| `BadRequestException` | `400` | `"Bad Request"` |

### Usage
```ts
// In a service:
throw new NotFoundException("Chat not found");
throw new UnauthorizedException("You must be logged in");

// In errorHandler.middleware.ts — caught here:
if (error instanceof AppError) {
    return res.status(error.statusCode).json({ ... });
}
```

---

## 📄 bcrypt.ts

Thin wrapper around **`bcryptjs`** — abstracts password hashing and comparison into two clean utility functions.

### `hashValue(value, salt?)`
```ts
export const hashValue = async (value: string, salt: number = 10) => {
    return await bcrypt.hash(value, salt);
}
```
- Hashes a plain-text string (password) using bcrypt with a salt factor of `10` by default
- Higher salt = more rounds = slower hashing (secure but not too slow — `10` is the industry standard)
- Called in `registerService` and `changePasswordService`

### `compareValue(value, hashValue)`
```ts
export const compareValue = async (value: string, hashValue: string) => {
    return await bcrypt.compare(value, hashValue);
}
```
- Compares a plain-text password against a stored bcrypt hash
- Returns `boolean` — `true` if they match
- Called in `loginService` to verify credentials

> ⚠️ Never store plain-text passwords. `hashValue()` is the only place a raw password should be converted — all DB operations use the hash.

---

## 📄 cookie.ts

Handles **JWT generation and cookie management** for authentication. Abstracts the `jsonwebtoken` and `res.cookie` logic that would otherwise be repeated across auth controllers.

### `setJwtAuthCookie({ res, userId })`

```ts
export const setJwtAuthCookie = async ({ res, userId }: CookieParams) => {
    const token = jwt.sign({ userId }, Env.JWT_SECRET, {
        audience: ["user"],
        expiresIn: Env.JWT_EXPIRES_IN as Time,
    });

    return res.cookie("accessToken", token, {
        httpOnly: true,
        secure: Env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
        path: "/",
    });
};
```

- Signs a JWT with `{ userId }` as payload, using `JWT_SECRET` from env
- Sets it as an `httpOnly` cookie named `accessToken`
- `httpOnly: true` — the cookie is **never accessible via `document.cookie`** in the browser, preventing XSS theft
- `secure: true` in production — only sent over HTTPS
- `sameSite: "lax"` — allows cross-origin GET requests (for redirects) but blocks cross-site POST — CSRF protection

### `clearJwtAuthCookie(res)`

```ts
export const clearJwtAuthCookie = (res: Response) =>
  res.clearCookie("accessToken", {
    path: "/",
    httpOnly: true,
    secure: Env.NODE_ENV === "production",
    sameSite: Env.NODE_ENV === "production" ? "strict" : "lax",
  });
```
- Clears the `accessToken` cookie — used in `logoutController`
- Cookie options **must match** the ones used when setting the cookie, otherwise `clearCookie` silently fails

### `Time` Type
```ts
type Time = `${number}${"s" | "m" | "h" | "d" | "w" | "y"}`;
```
A TypeScript template literal type — enforces that `JWT_EXPIRES_IN` is a valid duration string like `"7d"` or `"24h"` rather than a plain `string`.

---

## 📄 get-env.ts

A safe environment variable accessor — **throws at startup if a required variable is missing** rather than silently using `undefined` at runtime.

```ts
export const getEnv = (key: string, defaultValue: string = "") => {
    const val = process.env[key] ?? defaultValue;
    if (!val) throw new Error("Missing env variable: " + key);
    return val;
}
```

- Falls back to `defaultValue` if the env var isn't set
- If neither is available, **throws immediately** with a clear error
- Used in `env.config.ts` to load all variables at startup with fast-fail behavior

### Why This Matters
Without this, an undefined env var would propagate silently and surface as a cryptic error deep in a DB call or JWT sign — much harder to debug.

---

## 🔑 Key Patterns (Interview-Ready)

| Pattern | What it does |
|---|---|
| `AppError` subclasses | Makes error throwing semantic — `throw new NotFoundException()` is more readable than `throw new Error("Not Found")` |
| `as const` ErrorCodes | TypeScript narrows the type to exact string literals — type safety without a real enum |
| `httpOnly` cookie | JWT stored in a cookie, never in `localStorage` — immune to XSS attacks |
| `bcrypt` salt rounds | `10` rounds = ~100ms per hash — slow enough to defeat brute force, fast enough for UX |
| `getEnv` fail-fast | Crash at startup > crash during a user request — much easier to diagnose |

---

## 🧠 Interview Q&A (for revision only)

**Q: Why store the JWT in a cookie instead of `localStorage`?**
> `localStorage` is accessible via JavaScript — any XSS attack could steal the token. `httpOnly` cookies are invisible to JavaScript, so even a successful XSS injection cannot read the JWT. The browser sends the cookie automatically on each request.

**Q: What does `httpOnly` mean on a cookie?**
> The cookie cannot be accessed or modified by JavaScript (`document.cookie` returns nothing for it). It's only sent by the browser in HTTP requests — protecting the token from XSS.

**Q: Why does `clearCookie` require the same options used to set it?**
> The cookie is identified by its name + path + domain. If the options differ, the browser treats them as different cookies and the original one remains.

**Q: Why extend `Error` for `AppError` instead of creating a plain object?**
> Extending `Error` preserves the stack trace, works with `instanceof` checks, and integrates with Node.js error handling conventions. Error middleware can check `error instanceof AppError` to distinguish expected errors from unexpected ones.

**Q: What is `Error.captureStackTrace` and why use it?**
> It's a V8-specific API that creates a `.stack` property on the error. Passing `this.constructor` as the second argument tells V8 to omit the constructor call from the stack trace — so the trace starts from where the error was *thrown*, not where `AppError` was constructed.

**Q: What's the difference between `bcrypt.hash` salt factor vs actual salt?**
> The `salt` number (e.g., `10`) is the **cost factor** — it determines how many rounds of processing are done (2^10 = 1024 rounds). `bcryptjs` internally generates a random salt, combines it with the cost factor, and embeds it in the hash output. You never need to store the salt separately.

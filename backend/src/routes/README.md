# 📁 routes/

Routes define the **URL structure of the API**. Each route file maps HTTP methods + paths to their controller functions. This folder also contains an `index.ts` that acts as the **central router**, combining all sub-routers under `/api`.

---

## 📄 index.ts — Central Router

The root router that aggregates all sub-routers and mounts them under their base paths.

```ts
router.use("/auth", authRoutes);
router.use("/chat", chatRoutes);
router.use("/user", userRoutes);
```

Registered in `index.ts` (app entry) as:
```ts
app.use("/api", router);
```

This means all routes are prefixed `/api/auth`, `/api/chat`, `/api/user`.

---

## 📄 auth.routes.ts

Handles all authentication-related endpoints. **Public routes** (no JWT required) and **protected routes** (guarded by `passportAuthenticateJwt`).

### Route Table

| Method | Path | Middleware | Controller |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | `registerController` |
| `POST` | `/api/auth/login` | — | `loginController` |
| `POST` | `/api/auth/logout` | — | `logoutController` |
| `GET` | `/api/auth/status` | `passportAuthenticateJwt` | `authStatusController` |
| `POST` | `/api/auth/change-password` | `passportAuthenticateJwt` | `changePasswordController` |

### Key Pattern — Selective Auth Guard
Unlike `chatRoutes`, auth routes apply `passportAuthenticateJwt` **per-route** (not globally via `.use()`), because `/register`, `/login`, and `/logout` must be publicly accessible.

```ts
const authRoutes = Router()
  .post("/register", registerController)
  .post("/login", loginController)
  .post("/logout", logoutController)
  .get("/status", passportAuthenticateJwt, authStatusController)
  .post("/change-password", passportAuthenticateJwt, changePasswordController);
```

---

## 📄 chat.routes.ts

Handles all chat and message endpoints. **All routes are protected** — `passportAuthenticateJwt` is applied globally via `.use()`.

### Route Table

| Method | Path | Controller |
|---|---|---|
| `POST` | `/api/chat/create` | `createChatController` |
| `POST` | `/api/chat/message/send` | `sendMessageController` |
| `GET` | `/api/chat/all` | `getUserChatController` |
| `GET` | `/api/chat/:id` | `getSingleChatController` |
| `POST` | `/api/chat/:id/reset-unread` | `resetUnreadCountController` |

### Key Pattern — Router-Level Auth Guard
```ts
const chatRoutes = Router()
  .use(passportAuthenticateJwt) // applies to ALL routes below
  .post("/create", createChatController)
  // ...
```
Applying `.use(passportAuthenticateJwt)` at the router level is cleaner than repeating it on every route — any unauthenticated request to `/api/chat/*` is rejected before it reaches the controller.

> ⚠️ Note: `sendMessageController` lives in `message.controller.ts` but is registered here under `/api/chat/message/send` — it's a chat-scoped action.

---

## 📄 user.route.ts

Handles user profile and account management. **All routes are protected**.

### Route Table

| Method | Path | Controller |
|---|---|---|
| `GET` | `/api/user/all` | `getUserController` |
| `PUT` | `/api/user/profile` | `updateProfileController` |
| `DELETE` | `/api/user/account` | `deleteAccountController` |

```ts
const userRoutes = Router()
  .use(passportAuthenticateJwt)
  .get("/all", getUserController)
  .put("/profile", updateProfileController)
  .delete("/account", deleteAccountController);
```

---

## 🔑 Key Patterns (Interview-Ready)

| Pattern | What it does |
|---|---|
| `Router()` | Creates a modular sub-router — keeps route definitions isolated by domain |
| `router.use(middleware)` | Applies middleware to every route defined after it in that router |
| Per-route middleware | `router.get("/path", middleware, controller)` — applies only to that specific route |
| Central `index.ts` router | Single mount point — `app.use("/api", router)` — keeps `index.ts` clean |
| Route chaining `.get().post()` | Express's fluent API — all routes on the same Router instance |

---

## 🧠 Interview Q&A (for revision only)

**Q: What's the difference between `app.use(middleware)` and adding middleware per-route?**
> `app.use()` applies the middleware globally to all subsequent routes. Per-route middleware applies only to that specific path + method. chatRoutes uses `.use(passportAuthenticateJwt)` because ALL chat routes need auth — authRoutes applies it selectively since `/register` and `/login` are public.

**Q: Why use `Router()` instead of defining routes directly on `app`?**
> `Router()` allows you to modularize routes by feature/domain. You can define, test, and maintain each router independently. The central `index.ts` then composes them — keeping the main `app` file clean.

**Q: Why is `sendMessageController` in `chat.routes.ts` even though it's defined in `message.controller.ts`?**
> Routes are organized by domain/resource, not by file location. Sending a message is a chat-scoped action (it requires a `chatId`), so it belongs to the `/api/chat/` namespace.

**Q: What does `passportAuthenticateJwt` actually do?**
> It's a Passport.js middleware that reads the `accessToken` cookie, verifies the JWT signature, fetches the user from MongoDB, and attaches them to `req.user`. If the token is missing or invalid, it returns a 401 before the controller runs.

**Q: In what order does Express execute middleware?**
> Top to bottom, in the order they're registered. That's why `app.use(errorHandler)` must be last — it should only catch errors from routes registered before it.

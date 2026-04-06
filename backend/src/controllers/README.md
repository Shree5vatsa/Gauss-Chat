# 🎮 Controllers

Controllers are the **request handlers** that sit between the routes and the service layer. Each controller:

- Receives an HTTP request
- Validates/parses the request body or params using **Zod schemas**
- Delegates business logic to the corresponding **service**
- Returns a structured JSON response

All controllers are wrapped with `asyncHandler` to automatically catch and forward async errors to the global error handler — no manual `try/catch` needed.

---

## 📁 Files Overview

| File | Domain | Exported Controllers |
|---|---|---|
| [`auth.controller.ts`](#-authcontrollerts) | Authentication | `registerController`, `loginController`, `logoutController`, `authStatusController` |
| [`chats.controller.ts`](#-chatscontrollerts) | Chats | `createChatController`, `getUserChatController`, `getSingleChatController` |
| [`message.controller.ts`](#-messagecontrollerts) | Messages | `sendMessageController` |
| [`user.controller.ts`](#-usercontrollerts) | Users | `getUserController` |

---

## 📄 `auth.controller.ts`

Handles authentication-related HTTP requests. Relies on `auth.service.ts` for business logic and `cookie.ts` utilities to set/clear the JWT access token as an HTTP-only cookie.

---

### `registerController`

Registers a new user and sets the JWT access cookie on success.

| Detail | Value |
|---|---|
| Method | `POST` |
| Validator | `registerSchema` |
| Service | `registerService` |
| Sets Cookie | ✅ `accessToken` |
| Success Status | `201 Created` |

**Response:**
```json
{
  "message": "User created and login successfully",
  "user": { ... }
}
```

---

### `loginController`

Authenticates an existing user and sets the JWT access cookie.

| Detail | Value |
|---|---|
| Method | `POST` |
| Validator | `loginSchema` |
| Service | `loginService` |
| Sets Cookie | ✅ `accessToken` |
| Success Status | `200 OK` |

**Response:**
```json
{
  "message": "User logged in successfully",
  "user": { ... }
}
```

---

### `logoutController`

Clears the JWT access cookie, effectively logging out the user.

| Detail | Value |
|---|---|
| Method | `POST` |
| Auth Required | ✅ |
| Clears Cookie | ✅ `accessToken` |
| Success Status | `200 OK` |

**Response:**
```json
{
  "message": "User logged out successfully"
}
```

---

### `authStatusController`

Returns the currently authenticated user's data. Used by the frontend to verify session validity on app load.

| Detail | Value |
|---|---|
| Method | `GET` |
| Auth Required | ✅ (via `passportAuthenticateJwt`) |
| Source | `req.user` (populated by Passport) |
| Success Status | `200 OK` |

**Response:**
```json
{
  "message": "User fetched successfully",
  "user": { ... }
}
```

---

## 📄 `chats.controller.ts`

Handles chat-related HTTP requests. Requires authentication on all routes — throws `UnauthorizedException` if `req.user` is missing.

---

### `createChatController`

Creates a new chat between the authenticated user and the specified participants.

| Detail | Value |
|---|---|
| Method | `POST` |
| Auth Required | ✅ |
| Validator | `createChatSchema` |
| Service | `createChatService` |
| Success Status | `201 Created` |

**Response:**
```json
{
  "message": "Chat created successfully",
  "chat": { ... }
}
```

---

### `getUserChatController`

Fetches all chats that the authenticated user is a participant in.

| Detail | Value |
|---|---|
| Method | `GET` |
| Auth Required | ✅ |
| Service | `getUserChatService` |
| Success Status | `200 OK` |

**Response:**
```json
{
  "message": "User Chats fetched successfully",
  "chats": [ ... ]
}
```

---

### `getSingleChatController`

Fetches a single chat by ID along with its messages. Validates the chat ID via `chatIdSchema`.

| Detail | Value |
|---|---|
| Method | `GET` |
| Auth Required | ✅ |
| Param | `:id` (chat ID, validated via `chatIdSchema`) |
| Service | `getSingleChatService` |
| Success Status | `200 OK` |

**Response:**
```json
{
  "message": "Chat fetched successfully",
  "chat": { ... },
  "messages": [ ... ]
}
```

---

## 📄 `message.controller.ts`

Handles sending messages within a chat.

---

### `sendMessageController`

Sends a message from the authenticated user to a specific chat. Delegates to `sendMessageService` which handles persistence and real-time socket emission.

| Detail | Value |
|---|---|
| Method | `POST` |
| Auth Required | ✅ |
| Validator | `sendMessageSchema` |
| Service | `sendMessageService` |
| Success Status | `200 OK` |

**Response:**
```json
{
  "message": "Message sent successfully",
  "...result": "/* spread of service return */"
}
```

---

## 📄 `user.controller.ts`

Handles user-related HTTP requests. Currently exposes a single endpoint for searching/fetching users.

---

### `getUserController`

Fetches a list of users, optionally filtered by the given user ID from route params (used for search/suggestion features).

| Detail | Value |
|---|---|
| Method | `GET` |
| Param | `:id` (authenticated user's ID, used to exclude self from results) |
| Service | `getUserService` |
| Success Status | `200 OK` |

**Response:**
```json
{
  "message": "Users fetched successfully",
  "users": [ ... ]
}
```

---

## 🔗 Controller → Service Map

```
auth.controller.ts
    ├── registerController   → registerService
    ├── loginController      → loginService
    ├── logoutController     → (cookie utility only)
    └── authStatusController → (req.user from Passport)

chats.controller.ts
    ├── createChatController    → createChatService
    ├── getUserChatController   → getUserChatService
    └── getSingleChatController → getSingleChatService

message.controller.ts
    └── sendMessageController → sendMessageService

user.controller.ts
    └── getUserController → getUserService
```

---

## 🛡️ Common Patterns

- **`asyncHandler`** — Wraps every controller to propagate async errors to the global error middleware automatically.
- **Zod Validation** — Input from `req.body` or `req.params` is always parsed with a Zod schema before use. Invalid input throws a parse error caught by `asyncHandler`.
- **Auth Guard** — Protected controllers check `req.user` (populated by `passportAuthenticateJwt`) and throw `UnauthorizedException` if the user is absent.

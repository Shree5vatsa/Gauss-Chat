# 📁 controllers/

Controllers are the **entry point for every HTTP request**. They sit between the routes and services — they don't contain business logic, they just:
1. Extract & validate input (from `req.body`, `req.params`, `req.user`)
2. Call the appropriate service
3. Send back a response

All controllers are wrapped in `asyncHandler` to avoid repetitive try/catch blocks.

---

## 📄 auth.controller.ts

Handles all authentication-related HTTP operations.

### `registerController` — `POST /auth/register`
- Parses and validates `req.body` using `registerSchema` (Zod)
- Calls `registerService()` to create the user in DB
- Sets a JWT cookie via `setJwtAuthCookie()`
- Returns `201 CREATED` with the new user object

### `loginController` — `POST /auth/login`
- Validates body with `loginSchema`
- Calls `loginService()` to verify credentials
- Sets JWT cookie on success
- Returns `200 OK` with user data

### `logoutController` — `POST /auth/logout`
- Calls `clearJwtAuthCookie()` to remove the auth cookie
- Returns `200 OK`

### `authStatusController` — `GET /auth/status`
- Reads `req.user` (populated by Passport middleware upstream)
- Returns the currently logged-in user
- Used for session persistence on page reload

### `changePasswordController` — `PATCH /auth/change-password`
- Validates `newPassword` from body using `changePasswordSchema`
- Reads `userId` from `req.user` (auth required)
- Throws `UnauthorizedException` if user is not authenticated
- Calls `changePasswordService(userId, newPassword)`
- Returns `200 OK`

---

## 📄 chats.controller.ts

Handles chat room creation, retrieval, and unread message tracking.

### `createChatController` — `POST /chats`
- Reads `userId` from `req.user`
- Validates body with `createChatSchema`
- Calls `createChatService(userId, body)` — handles both direct and AI chats
- Returns `201 CREATED` with the new chat object

### `getUserChatController` — `GET /chats`
- Fetches all chats belonging to the logged-in user
- Calls `getUserChatService(userId)`
- Returns `200 OK` with array of chats

### `getSingleChatController` — `GET /chats/:id`
- Validates `:id` param with `chatIdSchema`
- Calls `getSingleChatService(id, userId)`
- Returns both the **chat metadata** and its **messages** in one response
- Used when a user opens a chat window

### `resetUnreadCountController` — `PATCH /chats/:id/read`
- Triggered when a user opens a chat
- Calls `resetUnreadCountService(id, userId)` to zero out the unread badge
- Returns `200 OK`

### `ensureAIUserExists()` — utility (not a route)
- Called on server startup
- Checks if an AI user (`isAI: true`) exists in DB
- If not, creates one with email `ai@gauss-chat.com` and a random hashed password
- Ensures the AI assistant is always available without manual seeding

---

## 📄 message.controller.ts

Handles sending messages (both user-to-user and AI responses).

### `sendMessageController` — `POST /messages`
- Reads `userId` from `req.user`
- Validates body with `sendMessageSchema`
- Calls `sendMessageService(userId, body)` which handles:
  - Saving the user's message
  - Triggering AI reply if it's an AI chat (handled inside the service)
- Returns `200 OK` with the sent `userMessage`

> ⚠️ Note: AI response is handled inside `sendMessageService`, not here. The controller only gets back the user's own message.

---

## 📄 user.controller.ts

Handles user profile operations.

### `getUserController` — `GET /users/:id`
- Reads `userId` from `req.params.id`
- Calls `getUserService(userId)` — likely used for searching/viewing other profiles
- Returns `200 OK` with user data

### `updateProfileController` — `PATCH /users/profile`
- Reads `name` and `avatar` from `req.body`
- Calls `updateUserProfileService(userId, { name, avatar })`
- Returns `200 OK` with the updated user object
- `avatar` is likely a Cloudinary URL (handled in the service layer)

### `deleteAccountController` — `DELETE /users/account`
- Calls `deleteUserAccountService(userId)`
- Returns `200 OK` on success

---

## 🔑 Key Patterns (Interview-Ready)

| Pattern | What it does |
|---|---|
| `asyncHandler(fn)` | Wraps async controllers — catches errors and forwards to Express error middleware automatically |
| `req.user` | Populated by Passport.js JWT strategy before the controller runs |
| Zod `.parse()` | Throws a validation error automatically if body doesn't match schema — no manual `if` checks needed |
| `UnauthorizedException` | Custom error class — gets caught by `errorHandler.middleware` and returns a proper 401 response |
| Service layer calls | Controllers never touch the DB directly — all logic lives in `services/` |

---

## 🧠 Interview Q&A (for revision only)

**Q: Why separate controllers from services?**
> Controllers handle HTTP concerns (req/res). Services handle business logic. This makes services reusable and independently testable.

**Q: What does `asyncHandler` do?**
> It wraps an async function so any thrown error is automatically passed to `next(err)` — eliminating the need for try/catch in every controller.

**Q: How is the user available on `req.user`?**
> Passport.js JWT middleware runs before protected routes. It decodes the JWT from the cookie, fetches the user from DB, and attaches it to `req.user`.

**Q: How does Zod validation work here?**
> `schema.parse(req.body)` throws a `ZodError` if validation fails. `asyncHandler` catches it and the error middleware converts it to a `400` response.

**Q: Why does `sendMessageController` only return `userMessage` and not the AI reply?**
> The AI response is generated asynchronously inside the service and emitted via Socket.io — it doesn't block the HTTP response.
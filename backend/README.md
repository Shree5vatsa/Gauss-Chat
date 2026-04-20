# 📦 Gauss-Chat — Backend

The backend for **Gauss-Chat** — a full-stack real-time chat application with support for direct messaging, group chats, and an AI assistant powered by Groq. Built with **Node.js + Express + TypeScript**, backed by **MongoDB (Mongoose)**, and real-time communication handled via **Socket.io**.

---

## 🛠️ Tech Stack

| Technology | Role |
|---|---|
| **Express v5** | HTTP server framework |
| **TypeScript** | Type safety across the entire backend |
| **MongoDB + Mongoose** | Database and ODM |
| **Passport.js + JWT** | Authentication via `httpOnly` cookies |
| **Socket.io** | Real-time bidirectional communication |
| **Zod** | Runtime request validation |
| **Groq SDK** | AI responses (LLM inference) |
| **Cloudinary** | Image upload and storage |
| **bcryptjs** | Password hashing |
| **dotenv** | Environment variable management |
| **nodemon + ts-node** | Dev server with hot reload |

---

## 🗂️ Folder Structure

```
backend/
├── src/
│   ├── index.ts            ← App entry point — creates server, registers middleware & routes
│   ├── config/             ← Environment, DB, Passport, Cloudinary, HTTP status config
│   ├── controllers/        ← HTTP request handlers (extract input → call service → respond)
│   ├── services/           ← Business logic (DB queries, AI calls, data transformations)
│   ├── models/             ← Mongoose schemas & models (User, Chat, Message)
│   ├── routes/             ← Express routers — maps URLs to controllers
│   ├── middlewares/        ← asyncHandler (error catching) + errorHandler (global error response)
│   ├── validators/         ← Zod schemas for request body/param validation
│   ├── lib/                ← Socket.io server setup and event handlers
│   ├── utils/              ← Reusable helpers (AppError, bcrypt, cookie, getEnv)
│   └── @types/             ← Custom TypeScript type augmentations (e.g., extends Express `Request`)
├── nodemon.json            ← Dev server config (watches src/, runs ts-node)
├── tsconfig.json           ← TypeScript compiler config
└── package.json            ← Dependencies and npm scripts
```

Each `src/` subfolder has its own `README.md` with file-by-file documentation, key patterns, and interview Q&A.

---

## 🚀 Getting Started

### Install dependencies
```bash
npm install
```

### Set up environment variables
Create a `.env` file in `backend/` (see `src/config/env.config.ts` for required keys):
```env
PORT=5000
NODE_ENV=development
MONGO_URI=<your MongoDB connection string>
JWT_SECRET=<your secret>
JWT_EXPIRES_IN=7d
FRONTEND_ORIGIN=http://localhost:5173
CLOUDINARY_CLOUD_NAME=<your cloudinary name>
CLOUDINARY_API_KEY=<your cloudinary api key>
CLOUDINARY_API_SECRET=<your cloudinary api secret>
GROQ_API_KEY=<your groq api key>
```

### Run development server
```bash
npm run dev
```
Uses **nodemon** + **ts-node** — watches `src/` for `.ts` changes and restarts automatically. No build step needed during development.

### Health check
```
GET /health → { "message": "Server is running", "status": "OK" }
```

---

## ⚙️ `index.ts` — App Entry Point

This is where the entire application is assembled. Here's what happens on startup, in order:

```ts
const app = express();
const server = http.createServer(app);  // wrap Express in native http.Server for Socket.io
```

1. **Socket.io** is initialized on the `http.Server` (not directly on `app`) — required for WebSocket support
2. **Body parsing** — `express.json({ limit: "10mb" })`, `cookieParser()`, `express.urlencoded()`
3. **CORS** — configured with `credentials: true` and `FRONTEND_ORIGIN` whitelist
4. **Passport** — `passport.initialize()` registers the JWT strategy
5. **Health route** — `GET /health` for uptime checks
6. **API router** — all routes mounted under `/api`
7. **Error handler** — registered last (must be after all routes)
8. **Server start** — on listen: connects to MongoDB, then ensures the AI user exists

---

## 🔁 Request Lifecycle

Every HTTP request through this backend follows this exact path:

```
HTTP Request
     │
     ▼
[CORS + Body Parsing + Cookie Parser]   ← global Express middleware
     │
     ▼
[passport.initialize()]                 ← makes req.user available pipeline-wide
     │
     ▼
[router → /api/auth | /api/chat | /api/user]   ← routes/index.ts
     │
     ▼
[passportAuthenticateJwt]               ← per-route or router-level auth guard
     │                                    reads JWT cookie → fetches user → attaches req.user
     ▼
[asyncHandler(controller)]             ← wraps controller in try/catch
     │
     ▼
[Controller]                           ← validates body (Zod), calls service, sends response
     │
     ▼
[Service]                              ← business logic, DB queries, AI calls
     │
     ▼
[Response]                             ← res.status().json()
     │
  (on error)
     ▼
[errorHandler middleware]              ← catches AppError → proper status, catches others → 500
```

---

## 🔌 Real-Time with Socket.io

The HTTP server and Socket.io share the same port. Socket.io handles:
- **Live message delivery** — messages pushed to recipient instantly without polling
- **Online presence** — tracks connected users via a `userSocketMap`
- **Unread count updates** — real-time badge increments for offline users
- **AI thinking indicator** — server emits a "typing" event before the AI response arrives

See `src/lib/README.md` for full Socket.io event documentation.

---

## 🔐 Authentication Flow

1. User logs in → `loginService` verifies credentials
2. On success: `setJwtAuthCookie()` signs a JWT and sets it as an `httpOnly` cookie (`accessToken`)
3. On subsequent requests: `passportAuthenticateJwt` reads the cookie, verifies the JWT, fetches the user from DB, attaches to `req.user`
4. On logout: `clearJwtAuthCookie()` instructs the browser to delete the cookie

**Why `httpOnly` cookies instead of `localStorage`?**
> `httpOnly` cookies can't be read by JavaScript — immune to XSS attacks. The browser sends them automatically on every request to the server.

---

## 🤖 AI Integration

When a user creates an AI chat, a special AI user (`isAI: true`) is seeded into the DB by `ensureAIUserExists()` at server startup. When a message is sent to an AI chat:

1. The user's message is saved to DB
2. `sendMessageService` detects `isAiChat: true`
3. Calls `aiService` which sends the message + conversation history to **Groq SDK**
4. Groq returns a response — saved as a new Message from the AI user
5. The AI reply is emitted to the frontend via Socket.io (not returned in the HTTP response)

---

## 📋 npm Scripts

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `nodemon` | Dev server with hot reload (uses `nodemon.json`) |
| `npm start` | `node src/index.ts` | Production start (requires build) |

---

## 🔑 Key Architecture Decisions (Interview-Ready)

| Decision | Rationale |
|---|---|
| **`httpOnly` JWT cookie** | XSS-safe auth — JS can't steal the token |
| **Zod for validation** | Single source of truth — runtime safety + TypeScript types via `z.infer<>` |
| **`asyncHandler` wrapper** | Centralized error handling — no `try/catch` boilerplate in controllers |
| **`AppError` subclasses** | Semantic, typed errors — `errorHandler` maps them to correct HTTP status codes |
| **Service layer** | Controllers never touch the DB — services are reusable and independently testable |
| **Socket.io on same port** | Simplifies deployment — one server handles both HTTP and WebSocket |
| **AI user seeded on startup** | No manual DB seeding required — `ensureAIUserExists()` guarantees availability |
| **`getEnv` fail-fast** | Crashes immediately if a required env var is missing — much easier to debug than runtime failures |

---

## 🧠 Interview Q&A (for revision only)

**Q: Why use Express v5?**
> Express v5 natively handles async errors by passing rejected promises to `next(error)` automatically. However, this project still uses `asyncHandler` for explicit clarity and backward compatibility habits.

**Q: How does Passport JWT strategy work?**
> It reads the `accessToken` cookie using `cookie-extractor`, verifies the signature with `JWT_SECRET`, decodes the `userId` payload, fetches the user from MongoDB, and attaches the user object to `req.user`. If the token is invalid or expired, it returns a 401.

**Q: Why wrap Express in `http.createServer(app)`?**
> `socket.io` needs to attach to a raw Node.js `http.Server` — not the Express `app` directly. Wrapping the app gives us a reference to the underlying server that Socket.io can bind its WebSocket upgrade handler to.

**Q: What's the role of the service layer?**
> Controllers handle HTTP (parse input, send response). Services handle business logic (DB queries, AI calls, data transformations). This separation means services can be called from multiple places (controllers, Socket.io handlers) without duplicating logic.

**Q: How does the AI response avoid blocking the HTTP response?**
> The controller returns `userMessage` immediately (HTTP response ends). Inside `sendMessageService`, the AI call to Groq runs asynchronously after the response is sent. The AI reply is then emitted via Socket.io — which is a separate channel from the HTTP request/response cycle.

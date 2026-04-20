# 💬 Gauss-Chat

A full-stack **real-time chat application** built with a modern TypeScript stack. Supports direct messaging, group chats, and a built-in **AI assistant powered by Groq**, with live presence indicators, typing signals, unread tracking, image sharing, and reply threading — all in a responsive, dark-mode–ready UI.

---

## ✨ Features

- 🔐 **JWT Authentication** — cookie-based, `httpOnly` sessions (no localStorage token exposure)
- 💬 **Real-Time Messaging** — Socket.io for instant delivery without polling
- 🤖 **AI Chat** — built-in Groq-powered AI assistant, available in any chat
- 👥 **Group Chats** — create named groups with multiple participants
- 🟢 **Online Presence** — live indicators showing who's currently connected
- ✍️ **Typing Indicators** — per-user typing signals in both direct and group chats
- 🔔 **Unread Badges** — per-chat unread message counters, reset on open
- ↩️ **Reply Threading** — quote and reply to any message
- 🖼️ **Image Sharing** — attach images (stored via Cloudinary); click to open fullscreen
- 🔍 **Chat Filtering** — filter sidebar by All / Individuals / Groups / Unread
- 🌙 **Dark / Light Mode** — system-aware theme with manual toggle
- 🗑️ **Account Deletion** — cascade-cleans chats and notifies other participants in real-time
- 🔒 **Password Management** — authenticated change-password flow

---

## 🛠️ Tech Stack

### Backend
| | |
|---|---|
| **Runtime** | Node.js + TypeScript |
| **Framework** | Express v5 |
| **Database** | MongoDB via Mongoose |
| **Auth** | Passport.js JWT strategy + `httpOnly` cookies |
| **Real-Time** | Socket.io |
| **Validation** | Zod |
| **AI** | Groq SDK (LLM inference) |
| **Media** | Cloudinary (image uploads) |
| **Security** | bcryptjs password hashing, Helmet, CORS |

### Frontend
| | |
|---|---|
| **Framework** | React 19 + TypeScript |
| **Build Tool** | Vite 8 |
| **Styling** | Tailwind CSS v4 |
| **UI Components** | Shadcn/ui (Radix UI primitives) |
| **State Management** | Zustand |
| **Forms** | React Hook Form + Zod |
| **Routing** | React Router DOM v7 |
| **Real-Time** | Socket.io Client |
| **HTTP Client** | Axios |
| **Notifications** | Sonner |

---

## 📁 Project Structure

```
Gauss-Chat/
├── backend/          ← Express + TypeScript API server
│   ├── src/
│   │   ├── config/       ← env, DB, Passport, Cloudinary, HTTP config
│   │   ├── controllers/  ← HTTP request handlers
│   │   ├── services/     ← business logic, AI calls, DB queries
│   │   ├── models/       ← Mongoose schemas (User, Chat, Message)
│   │   ├── routes/       ← Express routers
│   │   ├── middlewares/  ← asyncHandler, errorHandler
│   │   ├── validators/   ← Zod schemas for request validation
│   │   ├── lib/          ← Socket.io server setup
│   │   └── utils/        ← AppError, bcrypt, cookie, getEnv helpers
│   └── package.json
│
└── client/           ← React + Vite frontend
    ├── src/
    │   ├── components/   ← UI components (chat/, ui/ shadcn, layout)
    │   ├── hooks/        ← Zustand stores (useAuth, useChat, useSocket, ...)
    │   ├── pages/        ← Route-level components
    │   ├── routes/       ← React Router config + RouteGuard
    │   ├── lib/          ← Axios client, helpers, cn utility
    │   └── types/        ← Shared TypeScript interfaces
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18 or higher
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Cloudinary** account (free tier works)
- **Groq** API key — get one free at [console.groq.com](https://console.groq.com)
- **Git**

---

### 1. Clone the Repository

```bash
git clone https://github.com/Shree5vatsa/Gauss-Chat.git
cd Gauss-Chat
```

---

### 2. Set Up the Backend

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/gauss-chat
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
FRONTEND_ORIGIN=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
GROQ_API_KEY=your_groq_api_key
```

Start the backend dev server:

```bash
npm run dev
```

> Runs on **http://localhost:5000** — uses `nodemon` + `ts-node` for hot reload. No build step needed in development.

Health check: `GET http://localhost:5000/health` → `{ "status": "OK" }`

---

### 3. Set Up the Frontend

Open a new terminal:

```bash
cd client
npm install
```

Create a `.env` file inside `client/`:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend dev server:

```bash
npm run dev
```

> Runs on **http://localhost:5173**

---

### 4. Open the App

Navigate to **http://localhost:5173** — register an account and start chatting.

---

## 📜 npm Scripts

### Backend (`/backend`)

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload (nodemon + ts-node) |
| `npm start` | Start with Node directly (production) |

### Frontend (`/client`)

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript check + production bundle |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

---

## 🌐 API Overview

All API routes are prefixed with `/api`.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/logout` | Logout (clears cookie) |
| `GET` | `/api/auth/status` | Check session |
| `POST` | `/api/auth/change-password` | Change password |
| `GET` | `/api/chat/all` | Get all user chats |
| `POST` | `/api/chat/create` | Create direct / group / AI chat |
| `GET` | `/api/chat/:id` | Get single chat + messages |
| `POST` | `/api/chat/:id/reset-unread` | Mark chat as read |
| `POST` | `/api/chat/message/send` | Send a message |
| `GET` | `/api/user/all` | Get all users |
| `PUT` | `/api/user/profile` | Update profile |
| `DELETE` | `/api/user/account` | Delete account |

---

## 🔌 Socket.io Events

| Event | Direction | Description |
|---|---|---|
| `chat:join` | Client → Server | Join a chat room for real-time messages |
| `chat:leave` | Client → Server | Leave a chat room |
| `chat:new` | Server → Client | New chat created |
| `chat:update` | Server → Client | Chat updated (new message preview) |
| `message:new` | Server → Client | New message in an open chat |
| `typing:start` | Client → Server | User started typing |
| `typing:stop` | Client → Server | User stopped typing |
| `online:users` | Server → Client | Broadcast list of online user IDs |
| `user:account-deleted` | Server → Client | A participant deleted their account |

---

## 🔐 Environment Variables Summary

### Backend
| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | `development` or `production` |
| `PORT` | Server port (default `5000`) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWTs |
| `JWT_EXPIRES_IN` | Token expiry e.g. `7d` |
| `FRONTEND_ORIGIN` | CORS allowed origin |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `GROQ_API_KEY` | Groq API key for AI responses |

### Frontend
| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Backend base URL (dev only) |

---

## 📄 License

MIT — see [LICENSE](./LICENSE)

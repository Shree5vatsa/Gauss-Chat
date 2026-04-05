# Gauss-Chat Backend

This is the backend service for the **Gauss-Chat** application. It provides a robust, real-time messaging API built with **Node.js, Express, TypeScript, Mongoose**, and **Socket.io**. It is designed with a layered architecture (Controllers, Services, Models, Routes) and uses modern practices such as JWT authentication with cookies, Zod for schema validation, and complete TypeScript typings.

---

## 🚀 Features

- **Real-time Communication:** Powered by `socket.io` for seamless, instant messaging. Notifications for online/offline status, new chat creation, and live message updates.
- **Authentication & Authorization:** Secure user authentication using `passport-jwt`. Includes registration, login, logout, and session status endpoints. Tokens are securely handled via HTTP-only cookies.
- **RESTful API:** Structured and predictable endpoints for Users, Chats, Auth, and Messages.
- **Database & Models:** Utilizes MongoDB (via Mongoose) to manage `User`, `Chat`, and `Message` entities, handling both one-on-one and group chats.
- **Media Management:** Pre-configured with Cloudinary for handling media uploads (like user avatars and message images).
- **Validation:** Type-safe payload validation using `zod`.
- **Security:** Standard protections using `helmet`, `cors`, and structured error handling.
- **TypeScript:** Fully typed codebase ensuring safety and easier developer experience.

---

## 🛠️ Technology Stack

- **Core:** Node.js, Express.js
- **Language:** TypeScript
- **Database:** MongoDB, Mongoose
- **WebSockets:** Socket.io
- **Authentication:** Passport.js, JSON Web Tokens (JWT), bcryptjs
- **Validation:** Zod
- **Cloud Storage:** Cloudinary
- **Security & Utils:** Cookie-Parser, CORS, Helmet, Dotenv

---

## 📂 Project Structure

```text
backend/
├── src/
│   ├── config/         # Environment, database, standard HTTP status, Passport, & Cloudinary configurations
│   ├── controllers/    # Request handlers bridging routes to services
│   ├── lib/            # External library instantiations (e.g., Socket.io `socket.ts`)
│   ├── middlewares/    # Custom Express middlewares (asyncHandler, errorHandler)
│   ├── models/         # Mongoose schemas (User, Chat, Message)
│   ├── routes/         # Express route definitions (auth, chat, user)
│   ├── services/       # Core business logic communicating with the database
│   ├── utils/          # Helper utilities (e.g., bcrypt.ts for hashing)
│   ├── validators/     # Zod schema definitions for request bodies
│   └── index.ts        # Application entry point & Server initialization
├── .env                # Environment variables (not committed)
├── package.json        # Dependencies and scripts
└── tsconfig.json       # TypeScript compiler configuration
```

---

## ⚙️ Environment Variables

To run this backend, you need an `.env` file in the root `backend` directory. Below is the required configuration format:

```env
# Application Setup
PORT=8000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:3000

# Database
MONGO_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_super_secret_jwt_key

# Cloudinary (for Media Uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
*(Make sure to match your frontend origin port and adjust paths as needed).*

---

## 🏃‍♀️ Getting Started

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB running locally or a MongoDB Atlas URI

### 2. Installation
Navigate to your `backend` directory and install the dependencies:
```bash
cd backend
npm install
```

### 3. Running the Server

**Development Mode** (uses `nodemon` & `ts-node` for live reload):
```bash
npm run dev
```

**Production Build** (running compiled index):
```bash
npm start
```

---

## 📡 API Endpoints Summary

### Authentication (`/api/auth`)
- `POST /register` - Register a new user
- `POST /login` - Login to account & set JWT cookie
- `POST /logout` - Clear session JWT cookie
- `GET /status` - Check current auth status of user (Protected)

### User (`/api/user`)
- `GET /all` - Fetch all users for starting chats (Protected)

### Chat (`/api/chat`)
- `GET /all` - Fetch all chats belonging to the logged-in user (Protected)
- `GET /:id` - Get details of a single chat (Protected)
- `POST /create` - Create a new 1-on-1 or group chat (Protected)
- `POST /message/send` - Send a message to a specific chat (Protected)
- `POST /message/get` - Get messages for a specific chat (Protected)

---

## 🔌 WebSockets (Socket.io)

Real-time interactions are heavily utilized. The socket server listens for a JWT token mapped in the User's handshake headers.

### Emitted Events (Backend to Client)
- `online:users` - Broadcasts an array of online user IDs.
- `chat:new` - Sent to specific users when they are added to a new chat.
- `chat:update` - Updates a specific chat (like pushing the latest message).
- `message:new` - Broadcasts into a chat-room when a new message is posted.

### Listened Events (Client to Backend)
- `chat:join` (chatId) - Subscribes the user to a specific chat room to listen for messages.
- `chat:leave` (chatId) - Unsubscribes the user from the chat room.

---

## 🔧 Postman / API Testing

If testing with Postman or Requestly:
1. Ensure your requests to protected routes pass cookies.
2. Hit the login endpoint (`/api/auth/login`) first. Your testing client will store the resulting HTTP-only cookie automatically if cookie management is enabled.
3. For WebSockets, configure your socket testing client to pass the cookie in headers or manually extract the session cookie to link.

---

## 🛡️ Best Practices Applied
- **Fat Models, Skinny Controllers:** DB logic is mostly kept in services and models.
- **Global Error Handling:** Wrapped inside `asyncHandler` logic preventing unhandled promise rejections.
- **Pre Save Hooks:** Mongoose hooks are used extensively (e.g., automatically hashing passwords on save).
- **Zod Pipelines:** Strictly enforcing DTO structures for robust runtime validation without crashing the server.

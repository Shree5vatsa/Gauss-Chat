# 📁 lib/socket.ts

This is the **real-time backbone** of Gauss-Chat. It initializes Socket.io, handles authentication, manages online presence, and exposes emit functions used by the service layer.

---

## Architecture Overview

```
HTTP Server
    └── Socket.io Server (io)
            ├── Middleware (JWT auth on every connection)
            ├── Connection Handler
            │       ├── Online user tracking (Map)
            │       ├── Auto-join all user's chat rooms
            │       └── Event listeners per socket
            └── Emit Helpers (called by services)
                    ├── emitNewChatToParticipants
                    ├── emitNewMessageTochatRoom
                    ├── emitLastMessageToParticipants
                    └── emitUserAccountDeleted
```

---

## Core State

```typescript
let io: SocketServer | null = null;
const onlineUsers = new Map<string, string>();
// key: userId, value: socketId
```

- `io` is module-level — initialized once, reused everywhere via `getIO()`
- `onlineUsers` tracks who is currently connected — used for online indicators and targeted emits

---

## `initializeSocket(httpServer)`

Called once at app startup. Sets up the entire socket layer.

### Step 1 — CORS config
```typescript
cors: {
  origin: Env.FRONTEND_ORIGIN,
  methods: ["GET", "POST"],
  credentials: true,  // required for cookie-based auth
}
```

### Step 2 — Auth Middleware
Runs before every socket connection is established:

```typescript
io.use(async (socket: AuthenticatedSocket, next) => {
  const rawCookie = socket.handshake.headers.cookie;
  const token = rawCookie?.split("=")?.[1]?.trim();
  const decodedToken = jwt.verify(token, Env.JWT_SECRET);
  socket.userId = decodedToken.userId;
  next();
});
```

- Reads JWT from the cookie sent in the socket handshake headers
- Verifies it with `JWT_SECRET`
- Attaches `userId` to the socket object via custom `AuthenticatedSocket` interface
- Calls `next(new Error(...))` to reject unauthorized connections before they're established

> ⚠️ `credentials: true` in CORS + reading from `socket.handshake.headers.cookie` is what makes cookie-based socket auth work.

### Step 3 — Connection Handler (`io.on("connection")`)

On every new authenticated connection:

1. **Register online user**
```typescript
   onlineUsers.set(userId, socket.id);
   io.emit("online:users", Array.from(onlineUsers.keys()));
```
   - Stores `userId → socketId` mapping
   - Broadcasts updated online user list to ALL connected clients

2. **Join personal room**
```typescript
   socket.join(`user:${userId}`);
```
   - Every user has a private room `user:<userId>`
   - Used to send targeted events (new chat, account deleted, etc.)

3. **Auto-join all chat rooms**
```typescript
   const userChats = await ChatModel.find({ participants: { $in: [userId] } });
   for (const chat of userChats) {
     socket.join(`chat:${chat._id}`);
   }
```
   - On connect, the user is automatically added to all their chat rooms
   - Means they receive messages for all chats immediately — no manual join needed

---

## Socket Event Listeners

### `chat:join` (client → server)
- Client requests to join a specific chat room
- Calls `validateChatParticipant()` to confirm user belongs to the chat
- Uses `callback` pattern for acknowledgement — confirms success or sends error back

### `chat:leave` (client → server)
- Client leaves a chat room socket subscription
- Calls `socket.leave(`chat:${chatId}`)`

### `disconnect`
```typescript
if (onlineUsers.get(userId) === newSocketId) {
  onlineUsers.delete(userId);
  io.emit("online:users", Array.from(onlineUsers.keys()));
}
```
- Guards against removing a user who reconnected with a new socket (tab refresh etc.)
- Only removes from `onlineUsers` if the disconnecting socket is the current registered one
- Broadcasts updated online list

### `typing:start` (client → server → other clients)
```typescript
socket.to(`chat:${data.chatId}`).emit("typing:start", { chatId, userName });
```
- Forwards typing event to everyone in the chat room **except the sender**
- Payload includes `userName` so the UI can show "X is typing..."

### `typing:stop` (client → server → other clients)
- Same pattern as `typing:start` — broadcasts stop signal to the chat room

---

## Emit Helper Functions

These are called by **services** (`message.service`, `chat.service`, `user.service`) to push real-time updates to clients.

### `emitNewChatToParticipants(participantIds, chat)`
- Emits `chat:new` to each participant's personal room (`user:<id>`)
- Used when a new chat is created — updates everyone's sidebar

### `emitNewMessageTochatRoom(senderId, chatId, message)`
```typescript
if (senderSocketId) {
  io.to(`chat:${chatId}`).except(senderSocketId).emit("message:new", message);
} else {
  io.to(`chat:${chatId}`).emit("message:new", message);
}
```
- Emits `message:new` to the entire chat room
- **Excludes the sender** using `.except(senderSocketId)` — sender already has the message from the HTTP response
- Falls back to emitting to everyone if sender isn't in `onlineUsers` (e.g. sent from another device)

### `emitLastMessageToParticipants(participantIds, chatId, lastMessage)`
- Emits `chat:update` to each participant's personal room
- Payload: `{ chatId, lastMessage }` — updates the chat preview/snippet in the sidebar
- Called for both user messages AND AI responses

### `emitUserAccountDeleted(recipientId, deletedUserId)`
- Emits `user:account-deleted` to a specific user's personal room
- Called for every affected participant after account deletion
- Frontend listens and removes the deleted user's chats from state

---

## Room Naming Convention

| Room | Format | Purpose |
|---|---|---|
| Personal room | `user:<userId>` | Targeted events for one user |
| Chat room | `chat:<chatId>` | Broadcast to all in a chat |

---

## 🔑 Key Patterns (Interview-Ready)

| Pattern | What it does |
|---|---|
| Module-level `io` | Single Socket.io instance, accessed via `getIO()` guard |
| `onlineUsers` Map | `userId → socketId` — enables presence tracking and targeted excludes |
| Socket auth middleware | JWT verified at handshake time — unauthorized sockets never connect |
| `AuthenticatedSocket` | Extends `Socket` interface to add `userId` — TypeScript type safety |
| Auto room join | User joins all their chat rooms on connect — no manual join from client needed |
| `.except(socketId)` | Excludes sender from room broadcast — avoids duplicate messages |
| Personal rooms | `user:<id>` rooms allow server-to-specific-user pushes without knowing socketId |
| Disconnect guard | Checks `onlineUsers.get(userId) === newSocketId` before removing — handles reconnects |

---

## 🧠 Interview Q&A

**Q: How does Socket.io authentication work here?**
> The `io.use()` middleware intercepts every connection before it's established. It reads the JWT from `socket.handshake.headers.cookie`, verifies it, and attaches `userId` to the socket. If verification fails, `next(new Error(...))` rejects the connection entirely.

**Q: Why use `socket.join(`user:${userId}`)` in addition to chat rooms?**
> Chat rooms handle messages within a conversation. The personal room handles cross-chat events — new chat created, account deleted, sidebar updates. Without it, you'd have no way to push targeted events to a specific user without knowing their socketId.

**Q: How do you handle the case where a user has multiple tabs open?**
> `onlineUsers` stores one socketId per userId — the latest connection wins. The disconnect guard checks `onlineUsers.get(userId) === newSocketId` before deleting, so closing one tab doesn't mark the user offline if they still have another tab open.

**Q: Why does `emitNewMessageTochatRoom` exclude the sender?**
> The sender already received their message in the HTTP response from `sendMessageController`. Sending it again via socket would cause a duplicate in the UI. `.except(senderSocketId)` prevents this.

**Q: What's the difference between `io.emit` and `socket.to(...).emit`?**
> `io.emit` broadcasts to ALL connected clients. `socket.to(room).emit` sends only to clients in that specific room, excluding the current socket. For presence updates (online users), you want everyone — so `io.emit`. For messages, you only want chat participants — so `io.to(`chat:${chatId}`)`.

**Q: Why auto-join chat rooms on connection instead of having the client join manually?**
> It's more reliable — the client doesn't need to know all their chatIds upfront. As soon as they connect, they're already subscribed to all their chats. It also reduces the number of socket events needed from the frontend.
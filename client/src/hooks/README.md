# 📁 hooks/

Custom hooks are the **brain of the frontend**. They centralize state, API calls, and side effects — keeping components clean and dumb. In this app, **Zustand is used as the hooks library** instead of React Context or Redux, meaning each "hook" is actually a Zustand store with a hook interface.

> This is the most interview-heavy folder in the frontend — every function here has a reason.

---

## 📄 useAuth.ts — Authentication Store

**What it manages**: The currently logged-in user, auth loading states, and all auth actions.

### State Shape
```ts
{
  user: UserType | null        // the logged-in user or null
  isLoggingIn: boolean         // true while login API is in-flight
  isSigningUp: boolean         // true while register API is in-flight
  isAuthStatusLoading: boolean // true while checking session on page load
}
```

### Actions

#### `register(data)`
1. Sets `isSigningUp: true` (shows spinner on button)
2. POSTs to `/auth/register`
3. Saves `user` in Zustand state
4. Calls `useSocket.getState().connectSocket()` — connects the WebSocket right after login
5. Shows a success toast via Sonner
6. Navigates to `/chat` using the `navigate` utility

#### `login(data)`
Same pattern as `register` — POSTs to `/auth/login`, sets user, connects socket, redirects.

#### `logout()`
1. POSTs to `/auth/logout` (clears the `httpOnly` cookie server-side)
2. Clears `user` from state
3. Disconnects the Socket.io connection
4. Navigates to `/` (sign-in page)

#### `isAuthStatus()`
- Called on **app startup** (in `AppWrapper`) to re-hydrate the session from the existing cookie
- GETs `/auth/status` — if the cookie is valid, the server returns the user
- On success, saves the user and connects the socket
- On failure, does **nothing** (no toast) — silently handles the "not logged in" case
- This is how session persistence works on page reload

### Why `useSocket.getState()` instead of calling `useSocket()` directly?
> You can't call React hooks outside of components/other hooks. Zustand's `getState()` is a workaround that lets you access another store's state or call its actions from inside a store action.

---

## 📄 useChat.ts — Chat & Message Store

**The largest store in the app.** Manages the full chat list, the currently open chat, messages, loading states, and all real-time update handlers.

### State Shape
```ts
{
  chats: ChatType[]              // all chats in the sidebar list
  users: UserType[]              // all users (for new chat popover)
  singleChat: {                  // the currently open chat
    chat: ChatType
    messages: MessageType[]
  } | null

  isChatsLoading: boolean
  isUsersLoading: boolean
  isCreatingChat: boolean
  isSingleChatLoading: boolean
  isSendingMsg: boolean          // also drives the AI thinking bubble
}
```

### API Actions

#### `fetchAllUsers()`
- GETs `/user/all` to populate the new-chat popover
- **Filters out**: the current user (can't chat with yourself) and AI users (they appear separately)
- Uses `useAuth.getState()` to read the current user's ID without a hook call

#### `fetchChats()`
- GETs `/chat/all` — loads the full sidebar chat list on mount

#### `fetchSingleChat(chatId)`
- GETs `/chat/:id` — returns `{ chat, messages }` together in one request
- Called whenever the user navigates to a specific chat

#### `createChat(payload)`
- POSTs to `/chat/create`
- After creating, calls `addNewChat()` to prepend the new chat to the list immediately (no refetch needed)
- Returns the created `ChatType` so the caller can navigate to it

#### `sendMessage(payload)` — Most Important Action

This implements **optimistic UI**:

```
1. Generate a temp UUID for the message
2. Create a fake "tempMessage" object with status: "sent"
3. Immediately add it to singleChat.messages → user sees the message instantly
4. Make the real API call to /chat/message/send
5. On success → replace the temp message with the real one (same temp UUID, real DB data)
6. On error → remove the temp message from the list
```

**Why optimistic UI?** — The message appears instantly without waiting for the server round-trip. If it fails, it's removed with an error toast. This is exactly how WhatsApp/iMessage work.

### Real-Time State Updaters (called by Socket.io events)

These are **not API calls** — they directly mutate Zustand state in response to incoming socket events:

| Method | What it does |
|---|---|
| `addNewChat(chat)` | Prepends a new chat to the list. Deduplicates if it already exists. |
| `updateChatLastMessage(chatId, msg)` | Moves the updated chat to the **top** of the list and updates its preview text |
| `addNewMessage(chatId, msg)` | Appends a new message to `singleChat.messages`. Checks `msg._id` to prevent duplicates. |
| `incrementUnreadCount(chatId)` | Increments the unread badge for a chat. Guarded by ChatList — only called if sender is other user AND you're not viewing that chat. |
| `resetUnreadInStore(chatId)` | Zeroes the unread badge immediately without waiting for the API call |
| `removeChatsWithParticipant(userId)` | Removes all chats that include a deleted user — triggered by `user:account-deleted` socket event |

---

## 📄 useSocket.ts — Socket.io Connection Store

**What it manages**: The Socket.io connection itself and the list of currently online users.

### State Shape
```ts
{
  socket: Socket | null   // the Socket.io client instance
  onlineUsers: string[]   // array of userId strings who are currently connected
}
```

### `connectSocket()`
1. Checks if a socket already exists and is connected → **skips** if so (prevents duplicate connections)
2. Creates a new `io()` connection to the backend server
3. Sets `withCredentials: true` — sends the auth cookie with the WebSocket upgrade request
4. Listens for:
   - `"connect"` — confirms the connection
   - `"online:users"` — server broadcasts the array of online user IDs → updates `onlineUsers` state
   - `"disconnect"` — clears `onlineUsers`
   - `"connect_error"` — logs the error

### `disconnectSocket()`
- Calls `socket.disconnect()` and clears both `socket` and `onlineUsers` from state
- Called on logout

### URL Selection
```ts
const BASE_URL =
  import.meta.env.MODE === "development"
    ? import.meta.env.VITE_API_URL
    : "/";
```
- **In development**: connects to the explicit backend URL (e.g., `http://localhost:5000`)
- **In production**: connects to `/` (same origin — no CORS issues)

### Why is the socket stored in Zustand instead of a React ref or Context?
> Storing it in Zustand makes it accessible from anywhere — other stores (useAuth calls `useSocket.getState().connectSocket()`), components, and hooks — without prop drilling or Context nesting.

---

## 📄 useChatId.ts — URL Param Helper

A tiny but important hook that **reads the `:chatId` URL parameter** and returns it (or `null` if not present).

```ts
const useChatId = () => {
  const params = useParams<{ chatId?: string }>();
  return params.chatId || null;
};
```

**Why abstract this into a hook?**
> `useParams()` returns `Record<string, string | undefined>`. Wrapping it gives you a typed, nullable string and avoids repeating the type annotation everywhere. It also makes the dependency array in `useEffect` cleaner: `[chatId]` instead of `[params.chatId]`.

Used in: `pages/chat/chatId/index.tsx` and anywhere that needs to know the active chat.

---

## 📄 useResizablePanel.ts — Drag-to-Resize Panel

Manages the **drag-to-resize behavior** of the chat sidebar. Fully custom — no library needed.

### What it returns
```ts
{ width, isResizing, startResizing }
```

### How it works — Step by Step

1. **Initial width**: reads from `localStorage` using `storageKey` (defaults to `"chat-list-width"`). Falls back to `defaultWidth = 360`.
2. **`startResizing(e)`**: records the mouse's starting X position and the panel's starting width in `useRef` values (not state — no re-render needed). Sets `isResizing: true` and changes the cursor to `ew-resize`.
3. **`handleMouseMove(e)`**: calculates `delta = e.clientX - startX`, adds to `startWidth`, clamps the result between `minWidth (280)` and `maxWidth (500)`, and updates `width` state.
4. **`handleMouseUp()`**: stops the resize, saves the final width to `localStorage`, resets cursor.
5. **Event listeners**: `mousemove` and `mouseup` are attached to `window` (not the element) so dragging works even if the cursor leaves the handle. They're added only when `isResizing: true` and cleaned up in the `useEffect` return.

### Why `useRef` for `startX` and `startWidth`?
> Refs don't cause re-renders. If they were state, every `mousemove` event would trigger a re-render cascade. Refs let us capture the "snapshot at drag start" values without performance cost.

### Why save to `localStorage`?
> The sidebar width persists across page reloads. Without this, it would snap back to `360px` every time the user refreshed.

---

## 🔑 Key Patterns (Interview-Ready)

| Pattern | What it does |
|---|---|
| **Zustand stores as hooks** | Global state without Context/Redux boilerplate — `create<State>()` returns a hook |
| **`getState()` escape hatch** | Access a Zustand store from outside a component (used to connect socket after login) |
| **Optimistic UI in `sendMessage`** | Fake temp message shown instantly → replaced with real data → removed on error |
| **`addNewMessage` dedup guard** | Checks `messageExists` before appending — prevents showing the same message twice (e.g., from both optimistic update and socket event) |
| **`isResizing` gate on event listeners** | Attach `mousemove`/`mouseup` only while dragging — prevents a global listener running on every mouse move |
| **`useRef` vs `useState` in resize** | Refs store snapshot values (no re-render); state tracks the live width (triggers DOM update) |
| **`isSendingMsg` dual use** | Drives both the send button loading spinner AND the AI thinking bubble in `ChatBody` |

---

## 🧠 Interview Q&A (for revision only)

**Q: What is Zustand and how is it different from Redux?**
> Zustand is a lightweight state management library. Unlike Redux, it has no boilerplate (no actions, reducers, or dispatchers) — you just write a store with state and functions. Unlike Context, it doesn't re-render components that don't subscribe to the changed state.

**Q: Why use Zustand instead of React Context here?**
> Context re-renders every consumer when ANY value in the context changes. Zustand components only re-render when the specific slice of state they subscribe to changes. For a chat app with frequent real-time updates, this is crucial for performance.

**Q: Explain optimistic UI in `sendMessage`.**
> We add a temporary message to the UI immediately (before the API call completes). The user sees their message instantly. When the server responds, we swap the temp message with the real one. If the server errors, we remove the temp message. This mimics how WhatsApp and iMessage work.

**Q: How does `isAuthStatus` enable session persistence?**
> On every page load, `AppWrapper` calls `isAuthStatus()`. It hits `/auth/status` with the browser's stored `httpOnly` cookie. If valid, the server returns the user and the socket connects. The user sees themselves as logged in without re-entering credentials.

**Q: Why does `handleMouseMove` use `useCallback` with `isResizing` as a dependency?**
> Without `useCallback`, a new function reference is created on every render, causing the `useEffect` that adds/removes event listeners to run repeatedly. The dependency array `[isResizing, minWidth, maxWidth]` ensures the callback is re-created only when those values actually change.

**Q: How does `incrementUnreadCount` avoid counting your own messages?**
> In `ChatList.tsx`, before calling `incrementUnreadCount`, there's a guard: `const isFromOtherUser = data.lastMessage?.sender?._id !== currentUserId` and `const isViewingThisChat = useChat.getState().singleChat?.chat._id === data.chatId`. Only if both conditions are met (message is from someone else AND you're not looking at that chat) does the unread count increment.

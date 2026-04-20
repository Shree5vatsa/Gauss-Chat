# 📁 lib/

Small, focused utility files used across the entire frontend. These are not components or hooks — they're **pure helper functions and configured instances** that multiple files share.

---

## 📄 axios-client.ts

Creates and exports **the single Axios instance** used for all API calls in the app.

```ts
export const API = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? `${import.meta.env.VITE_API_URL}/api`
      : "/api",
  withCredentials: true,
});
```

### `baseURL` — Environment-Aware
| Environment | Base URL |
|---|---|
| **Development** | `http://localhost:5000/api` (from `VITE_API_URL` env var) |
| **Production** | `/api` (same origin — no CORS needed) |

`import.meta.env.MODE` is Vite's build-time environment variable. In dev, you're running a separate dev server (`localhost:5173`) talking to a backend on `localhost:5000` — so you need the full URL. In production, both are served from the same origin.

### `withCredentials: true`
**This is critical.** Without it:
- The browser won't send `httpOnly` cookies with cross-origin requests
- Every API call would appear as "not logged in" to the backend
- The JWT cookie set by `setJwtAuthCookie()` would be silently ignored

Setting `withCredentials: true` tells the browser to include cookies and auth headers even on cross-origin requests. The backend must also respond with `Access-Control-Allow-Credentials: true` (which it does via the CORS config).

### Why a single instance?
> All API calls use `API.get()`, `API.post()`, etc. — no need to pass `baseURL` or `withCredentials` on every request. One place to add interceptors, auth headers, or retry logic if needed.

---

## 📄 helper.ts

Pure utility functions used across multiple components. Two of them are particularly important.

### `isUserOnline(userId?, isAI?)`
```ts
export const isUserOnline = (userId?: string, isAI?: boolean) => {
  if (!userId) return false;
  if (isAI) return false;              // AI is never "online"

  const { user } = useAuth.getState();
  const { onlineUsers } = useSocket.getState();

  if (user?._id === userId) return true; // you are always online to yourself

  return onlineUsers.includes(userId);
};
```
- AI users are always shown as offline (they don't have a persistent connection)
- The current user is always considered online
- For everyone else, checks if their `userId` is in `useSocket`'s `onlineUsers` array

> **Note**: Uses `useAuth.getState()` and `useSocket.getState()` — not `useAuth()` hooks. This is because `isUserOnline` is a plain function (not a component/hook), and React hooks can only be called inside components or hooks.

### `getOtherUserAndGroup(chat, currentUserId)`
```ts
export const getOtherUserAndGroup = (chat: ChatType, currentUserId: string | null) => {
  if (chat.isGroup) {
    return { name: chat.groupName, subheading: `${n} members`, avatar: "", isGroup: true, isOnline: false, isAI: false };
  }

  const other = chat.participants.find(p => p._id !== currentUserId);
  const isAI = chat.isAiChat === true || other?.isAI === true;

  return {
    name: isAI ? "Gauss AI Assistant" : other?.name,
    subheading: isAI ? "AI Assistant" : isOnline ? "Online" : "Offline",
    avatar: isAI ? "" : other?.avatar,
    isGroup: false,
    isOnline,
    isAI,
  };
};
```
**The most-used helper in the app.** Called in `ChatHeader`, `ChatListItem`, and `NewChatPopover/UserAvatar`.

Derives all display data for a chat from the current user's perspective:
- For **groups**: returns the group name and `"N members"` as subheading
- For **direct chats**: finds the *other* participant and returns their data
- For **AI chats**: overrides name to `"Gauss AI Assistant"` and sets `avatar: ""` (the avatar is resolved by `AvatarWithBadge` via the `isAI` prop)

### `formatChatTime(date)`
```ts
export const formatChatTime = (date: string | Date) => {
  if (isToday(newDate)) return format(newDate, "h:mm a");    // "3:45 PM"
  if (isYesterday(newDate)) return "Yesterday";
  if (isThisWeek(newDate)) return format(newDate, "EEEE");   // "Monday"
  return format(newDate, "M/d");                             // "4/13"
};
```
Smart date formatting — returns a human-readable string that scales with how old the message is. Used in both `ChatListItem` (last message time) and `ChatBodyMessage` (message timestamp).

### `generateUUID()`
```ts
export const generateUUID = () => uuidv4();
```
Thin wrapper around `uuid`'s `v4()`. Used in `useChat.sendMessage()` to generate a temporary ID for optimistic messages before the server responds with the real `_id`.

---

## 📄 navigation.ts

A minimal imperative navigation utility.

```ts
export const navigate = (to: string) => {
  window.location.href = to;
};
```

### Why not use React Router's `useNavigate()`?
> `useNavigate()` is a React hook — it can only be called inside components or other hooks. In Zustand store actions (like `useAuth.login()`), you can't call hooks. `window.location.href = to` is the escape hatch: a plain JavaScript navigation that works anywhere.

The downside is a **full page reload** (unlike React Router's client-side navigation). This is acceptable here because it only happens on login/logout — moments where a full reset of all React state is actually desirable.

---

## 📄 utils.ts

A tiny utility that powers **conditional className merging** throughout the app.

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### What `cn()` does
Combines two libraries:
1. **`clsx`** — takes any combination of strings, arrays, and objects and builds a single class string. Handles conditionals: `clsx("base", isActive && "active")` → `"base active"` or `"base"`.
2. **`tailwind-merge`** — intelligently merges Tailwind classes, resolving conflicts. For example: `twMerge("px-2 px-4")` → `"px-4"` (the last one wins, prevents style conflicts).

### Usage
```ts
className={cn(
  "base-style rounded-lg",
  isActive && "bg-primary text-primary-foreground",
  hasUnread && "bg-primary/5",
)}
```
This pattern is used **everywhere** — message bubbles, list items, filter chips, buttons. Without `cn()`, you'd need messy string concatenation or ternary chains.

---

## 🔑 Key Patterns (Interview-Ready)

| Pattern | What it does |
|---|---|
| Single Axios instance | Central config — `withCredentials`, `baseURL`, future interceptors — defined once |
| `withCredentials: true` | Enables cookie-based auth for cross-origin requests |
| `import.meta.env.MODE` | Vite's env mode check — `"development"` vs `"production"` at build time |
| `useAuth.getState()` in plain functions | Access Zustand outside of hooks — `.getState()` reads current state without subscribing |
| `window.location.href` navigation | Works outside React components — only used for login/logout where a full reset is acceptable |
| `clsx + tailwind-merge` via `cn()` | Safe, conflict-free conditional class name construction for Tailwind |
| Smart date formatting | Relative time display that scales — `"just now"` → time → `"Yesterday"` → day name → date |

---

## 🧠 Interview Q&A (for revision only)

**Q: What does `withCredentials: true` do in Axios?**
> It tells the browser to include cookies, authorization headers, and TLS certificates in cross-origin requests. Without it, the browser strips cookies for security (same-origin policy). Since the JWT is stored in an `httpOnly` cookie, every API call would fail auth without this setting. The server must also respond with `Access-Control-Allow-Credentials: true`.

**Q: Why does `navigate()` use `window.location.href` instead of React Router?**
> React Router's `useNavigate()` is a hook — it can only be called inside React component rendering. The `login()` and `logout()` functions in `useAuth` are Zustand store methods (plain async functions), not components. `window.location.href` is a plain JavaScript imperative navigation that works anywhere.

**Q: What's the difference between `clsx` and `tailwind-merge`?**
> `clsx` handles conditional merging of class strings (turns objects/arrays/conditionals into a single string). `tailwind-merge` resolves Tailwind class conflicts intelligently (e.g., `px-2 px-4` → `px-4`). Neither alone is sufficient — `clsx` doesn't understand Tailwind semantics, and `tailwind-merge` doesn't handle conditionals. Together they're perfect.

**Q: Why use `getOtherUserAndGroup` as a separate helper instead of putting the logic in each component?**
> The same logic (finding the other participant, determining AI status, deriving display name) is needed in at least three places: sidebar list items, chat header, and the new-chat popover. Centralizing it means fixing a bug (like AI detection logic) only needs one change.

**Q: Why does `isUserOnline` return `true` for the current user?**
> The server tracks online users — but only others. When you connect your own socket, it gets added to the server's map, but when you query "is user X online?" from your own perspective, you're always online to yourself. Returning `true` here prevents showing yourself as offline in any UI that checks your own status.

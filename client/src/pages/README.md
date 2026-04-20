# 📁 pages/

Pages are **route-level components** — they sit at the top of the React tree for a given URL. They orchestrate data fetching, side effects, and component composition. Pages don't contain much logic themselves — they wire up hooks and pass props to smaller components.

```
pages/
├── auth/
│   ├── sign-in.tsx   → GET /
│   └── sign-up.tsx   → GET /sign-up
└── chat/
    ├── index.tsx     → GET /chat      (the empty/welcome state)
    └── chatId/
        └── index.tsx → GET /chat/:chatId  (the active chat window)
```

---

## 📄 auth/sign-in.tsx — `GET /`

The login page. Renders a centered card with a logo, email/password form, and a link to register.

### Form Setup
Uses **React Hook Form** + **Zod** with `zodResolver`:
```ts
const formSchema = z.object({
  email: z.string().email("Invalid email").min(1),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
```
The form values are typed via `z.infer<typeof formSchema>` — no separate interface needed.

### Smart Submit Button
```ts
const isFormFilled = email && password;
```
The submit button is `disabled` unless both fields have content. When `isLoggingIn` is true:
- Button shows `<Spinner>` + `"Signing in..."`
- Button is disabled (prevents double submissions)
- A scale animation plays when the form is filled: `hover:scale-[1.02] hover:shadow-lg`

### Theme-Aware Background
```ts
useEffect(() => {
  setBgImage(theme === "dark" ? bgImageDark : bgImageLight);
}, [theme]);
```
The background image switches between light and dark versions based on the current theme. Both images are statically imported and preloaded.

### On Submit
```ts
const onSubmit = (values) => {
  if (isLoggingIn) return;
  login(values); // useAuth store action
};
```
`login()` handles the API call, cookie setting, socket connection, and navigation to `/chat`.

---

## 📄 auth/sign-up.tsx — `GET /sign-up`

The registration page. Similar to sign-in but with more fields and a live email uniqueness check.

### Form Schema
```ts
const formSchema = z.object({
  firstName: ...,
  lastName: ...,
  email: ...,
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```
The `.refine()` cross-field validator ensures passwords match. The error is attached to the `confirmPassword` field.

### Live Email Uniqueness Check
```ts
const checkEmailExists = async (email) => {
  const response = await API.get(`/user/check-email?email=${email}`);
  if (response.data.exists) {
    setEmailError("Email already registered. Please sign in instead.");
  }
};
// Called on <Input onBlur={...} />
```
When the email input loses focus (`onBlur`), a background API call checks if the email is already in use. This gives instant feedback before the user submits. A spinner shows inside the input while checking.

### Layout
- **Mobile**: single column (full width card)
- **Desktop (`lg:`)**: two-column split — form on the left, background image on the right (`hidden lg:flex`)

### On Submit
Concatenates `firstName + " " + lastName` into a single `name` field before calling `register()`:
```ts
register({ name: `${firstName} ${lastName}`, email, password });
```

---

## 📄 chat/index.tsx — `GET /chat`

A **minimal placeholder** page — shown when the user is at `/chat` but hasn't selected a specific chat yet.

```ts
import EmptyState from "@/components/empty-state";
export default function Chat() {
  return <EmptyState />;
}
```
The actual chat list sidebar is rendered by `AppLayout` (not this page). This page only controls the **right panel** of the split layout. When no chat is open, it shows an empty state prompt like "Select a chat to start messaging".

---

## 📄 chat/chatId/index.tsx — `GET /chat/:chatId`

The **main chat window page**. The most complex page in the app — coordinates the header, message area, footer, typing indicators, Socket.io room management, and unread count resets.

### State
```ts
const chatId = useChatId();                         // reads :chatId from URL
const [replyTo, setReplyTo] = useState(null);       // the message being replied to
const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
const [typingUserName, setTypingUserName] = useState("");
```

### `useEffect` Flows — 4 Separate Effects

#### 1. Fetch chat on navigation
```ts
useEffect(() => {
  if (chatId) fetchSingleChat(chatId);
}, [chatId]);
```
Every time the URL `chatId` changes (user clicks a different chat), fetches the chat + messages from the server.

#### 2. Reset unread count
```ts
useEffect(() => {
  if (chatId && user?._id) {
    resetUnreadInStore(chatId);     // immediate UI update (Zustand)
    API.post(`/chat/${chatId}/reset-unread`); // persist to MongoDB
  }
}, [chatId, user]);
```
**Two-step approach:**
1. `resetUnreadInStore(chatId)` → immediately zeros the badge in the sidebar (no waiting)
2. `API.post(...)` → persists the reset to the database (async, errors are swallowed)

This prevents the badge from "flashing" while the API call completes.

#### 3. Join / leave the Socket room
```ts
useEffect(() => {
  if (!socket || !chatId) return;

  socket.emit("chat:join", chatId, (err) => { ... });  // join the room

  return () => {
    socket.emit("chat:leave", chatId);   // cleanup on unmount or chatId change
  };
}, [socket, chatId]);
```
The server uses Socket.io rooms to scope `"message:new"` events. Without joining, you wouldn't get real-time messages for this chat. The cleanup function leaves the room when navigating away — preventing receiving messages for the old chat.

#### 4. Typing indicator listeners
```ts
socket.on("typing:start", (data) => {
  if (data.chatId === chatId) {
    setIsOtherUserTyping(true);
    setTypingUserName(data.userName);
  }
});
socket.on("typing:stop", (data) => {
  if (data.chatId === chatId) {
    setIsOtherUserTyping(false);
    setTypingUserName("");
  }
});
```
Guards by `chatId` — only shows typing for the currently open chat. Cleanup removes both listeners on unmount.

### Conditional Rendering
```ts
if (!chatId) return <EmptyState />;
if (isSingleChatLoading) return <div>Loading...</div>;
if (!singleChat?.chat) return <EmptyState title="Chat not found" />;
```
Three guard states before rendering the full chat window. This prevents crashes from null access.

### Component Composition
```tsx
<div className="h-full w-full flex flex-col">
  <ChatHeader chat={singleChat.chat} currentUserId={user?._id} />
  <ChatBody
    chatId={chatId}
    messages={singleChat.messages}
    onReply={setReplyTo}
    isOtherUserTyping={isOtherUserTyping}
    typingUserName={typingUserName}
    isGroupChat={singleChat.chat.isGroup}
    isAiChat={singleChat.chat.isAiChat}
  />
  <ChatFooter
    chatId={chatId}
    currentUserId={user?._id}
    replyTo={replyTo}
    onCancelReply={() => setReplyTo(null)}
  />
</div>
```
This page is the **glue** — it holds state that must be shared between `ChatBody` (displaying replies) and `ChatFooter` (cancelling replies). `replyTo` lives here so both components can access it.

---

## 🔑 Key Patterns (Interview-Ready)

| Pattern | What it does |
|---|---|
| `useEffect` cleanup for socket rooms | `chat:leave` on unmount prevents receiving messages for the wrong chat |
| Two-step unread reset | Zustand update (instant UI) + API call (persistence) — badge clears without waiting |
| `onBlur` email check | Async validation before form submission — better UX than waiting for submit error |
| `replyTo` state in the page | Shared state between `ChatBody` (show reply preview) and `ChatFooter` (send with replyTo) |
| Multiple guard conditions | Null-safe rendering — prevents crashes before data is ready |
| theme-aware backgrounds | `useEffect` on `theme` — background switches images without a page reload |

---

## 🧠 Interview Q&A (for revision only)

**Q: Why does the page emit `"chat:join"` and `"chat:leave"` instead of letting the server handle it?**
> Socket.io rooms are opt-in — the server can't know which chat room a client wants to be in without being told. `"chat:join"` subscribes the socket to a room so the server knows where to direct `"message:new"` events. Without joining, the client would miss real-time messages.

**Q: Why is the unread count reset done in two steps?**
> Waiting for the API call would cause a delay — the badge would stay visible for 100-300ms while the request is in-flight. By resetting the Zustand state immediately (step 1), the badge disappears instantly. The API call (step 2) persists it for when the page refreshes or the user logs in from another device.

**Q: Why is `replyTo` state in `SingleChat` (the page) instead of in `ChatFooter`?**
> `replyTo` must be accessible by two components: `ChatFooter` (to include in the send payload) and `ChatBody` (to clear it after sending). The only place both components can share state without prop drilling or a Zustand store is their shared parent — the page component.

**Q: How is the typing indicator guarded against showing for wrong chats?**
> Both `typing:start` and `typing:stop` handlers check `if (data.chatId === chatId)` before updating state. Since the same socket connection handles all chat events, this guard ensures only events from the currently open chat affect the UI.

**Q: What happens if `fetchSingleChat` fails (e.g., 404)?**
> The Zustand `isSingleChatLoading` becomes `false` and `singleChat` remains `null`. The guard `if (!singleChat?.chat)` catches this and renders `<EmptyState title="Chat not found" />` instead of crashing.

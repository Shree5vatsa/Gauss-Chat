# 📁 components/chat/

These are the **core UI building blocks** of the chat experience. Every component in this folder is purpose-built — the entire chat window is assembled from these pieces. Together they form two main areas: the **sidebar** (chat list) and the **chat window** (header + body + footer).

```
Chat Layout
├── Sidebar
│   ├── ChatListHeader    ← search bar + filter chips + new chat button
│   ├── ChatList          ← renders the list, listens to socket events
│   └── ChatListItem      ← a single row in the sidebar
└── Chat Window
    ├── ChatHeader        ← top bar with avatar, name, online status, info modal
    ├── ChatBody          ← scrollable message area + typing indicator
    │   ├── ChatBodyMessage ← a single message bubble (your own vs others vs AI)
    │   └── AIThinkingBubble ← animated dots while waiting for AI reply
    ├── ChatReplyBar      ← shown above footer when replying to a message
    └── ChatFooter        ← text input + image attach + send button + typing events
```

Also includes:
- **NewChatPopover** — the full UI flow for creating direct, group, and AI chats

---

## 📄 chat-list-header.tsx

The **sticky top section of the sidebar** — contains the title, new chat button, search bar, and filter chips.

### What it renders
1. `"Chats"` title + `<NewChatPopover />` button (top row)
2. A search `<InputGroup>` — calls `onSearch(value)` on every keystroke (controlled by `ChatList`)
3. Four filter chips: **All**, **Individuals**, **Groups**, **Unread**

### `FilterChip` (internal sub-component)
A styled `<button>` that:
- Highlights with `bg-primary` when `active`
- Shows a count badge (e.g., "3") next to the label if `count > 0`
- Has `hover:scale-105 active:scale-95` for a satisfying click feel

### Props
```ts
{
  onSearch: (val: string) => void
  filterType: "all" | "individuals" | "groups" | "unread"
  onFilterChange: (filter) => void
  totalCount, individualsCount, groupsCount, unreadCount: number
}
```
All filter counts are calculated in `ChatList` and passed down as props — this component is **purely presentational**.

---

## 📄 chat-list.tsx

The **main sidebar component**. Fetches the chat list, manages search/filter state, and listens to multiple Socket.io events.

### On Mount
```ts
useEffect(() => { fetchChats(); }, [fetchChats]);
```
Calls `useChat().fetchChats()` once to load all chats from `/chat/all`.

### Socket Event Listeners

This component has **4 separate `useEffect` blocks** — one per socket event:

| Socket Event | What happens |
|---|---|
| `"chat:new"` | Someone created a chat with you → `addNewChat()` adds it to the sidebar |
| `"chat:update"` | A new message was sent in any of your chats → `updateChatLastMessage()` moves that chat to the top |
| `"message:new"` | Updates the last-message preview text in the sidebar row |
| `"user:account-deleted"` | A participant deleted their account → `removeChatsWithParticipant()` cleans up their chats |

### Unread Count Logic
Inside the `chat:update` handler:
```ts
const isFromOtherUser = data.lastMessage?.sender?._id !== currentUserId;
const isViewingThisChat = useChat.getState().singleChat?.chat._id === data.chatId;

if (isFromOtherUser && !isViewingThisChat) {
  incrementUnreadCount(data.chatId);
}
```
This prevents incrementing the badge when:
- You sent the message yourself
- You're currently viewing that chat

### Filtering Logic
```ts
const filteredChats = chats?.filter((chat) => {
  const matchesSearch = /* name matches search query */;
  if (filterType === "individuals") return !chat.isGroup;
  if (filterType === "groups") return chat.isGroup;
  if (filterType === "unread") return (chat.unreadCount || 0) > 0;
  return true;
});
```
Filtering is done **client-side** on already-fetched data — no extra API calls.

### Empty State
Shows a contextual empty message based on the active filter:
- `"No unread messages"` / `"No group chats"` / `"No chats yet"` / `"No chats found"` (search)

---

## 📄 chat-list-item.tsx

**A single row in the sidebar list** — shows avatar, name, last message preview, timestamp, and unread badge.

### Key Behaviors

#### Active State
```ts
const isActive = pathname.includes(chat._id);
```
Uses `useLocation()` to check if the current URL contains this chat's ID — highlights the active chat row with a darker background.

#### Last Message Text
```ts
const getLastMessageText = () => {
  if (!lastMessage) return isGroup ? "Group created" : "Send a message";
  if (lastMessage.image) return "📷 Photo";
  if (isGroup && lastMessage.sender) return `${senderName}: ${content}`;
  return lastMessage.content;
};
```
Handles all edge cases: no messages yet, image-only messages, group attribution.

#### Unread Badge
```ts
{hasUnread && (
  <span>{unreadCount > 9 ? "9+" : unreadCount}</span>
)}
```
Caps at `"9+"` — standard chat app convention. The entire row also gets `bg-primary/5` when there are unread messages.

#### AI Chat Icon
If `isAIChat`, renders a small purple lightbulb SVG icon next to the chat name — visual indicator that this is an AI conversation.

### Key Props
```ts
{ chat: ChatType, currentUserId: string | null, onClick: () => void }
```
Calls `getOtherUserAndGroup(chat, currentUserId)` from `lib/helper.ts` to derive the display name, avatar, and online status.

---

## 📄 chat-header.tsx

The **sticky top bar** of the chat window. Shows the other person's info and a chat info modal.

### What it displays
- **Back button** (mobile only, `lg:hidden`) → navigates back to `/chat`
- **`<AvatarWithBadge>`** with name, avatar, online status, and AI flag
- **Name** (h5) + **Subheading** (`"Online"` / `"Offline"` / `"AI Assistant"` / member count)
- **Info button** (ℹ️) → opens a `<Dialog>` modal

### Chat Info Modal
Opens a `<Dialog>` with:
- Chat name / group name
- Participants (shows `"You & AI Assistant"` for AI chats)
- Type: `"AI Chat"` / `"Group Chat"` / `"Single Chat"`
- Created date (formatted with `date-fns` `format(date, "PPP")`)

### `getOtherUserAndGroup(chat, currentUserId)`
All display data comes from this helper — it reads `chat.participants` and determines the other person's name, avatar, AI status, and online status.

---

## 📄 chat-body.tsx

The **scrollable message area** — renders all messages, the AI thinking animation, and the typing indicator.

### Auto-Scroll Strategy
Three separate `useEffect` blocks handle scrolling:

| Trigger | Behavior |
|---|---|
| `messages` array changes | Smooth scroll to bottom (new messages) |
| `isOtherUserTyping` changes | Scrolls typing indicator into view |
| `isSendingMsg` becomes `true` | Scrolls so AI thinking bubble is visible |
| On initial mount | `"auto"` (instant) scroll to bottom after 100ms delay |

### Socket Listener
```ts
socket.on("message:new", (msg) => {
  if (msg.chatId === chatId) {
    addNewMessage(chatId, msg);
  }
});
```
**Guards by `chatId`** — only adds the message if it belongs to the currently open chat. Cleanup on unmount via `socket.off()`.

### AI Thinking Bubble (`AIThinkingBubble`)
An internal sub-component shown when `isAiChat && isSendingMsg`:
- Renders the AI avatar (`<AvatarWithBadge isAI />`)
- Three purple bouncing dots with staggered `animationDelay` (0ms → 150ms → 300ms)
- Smooth entrance animation (`animate-in fade-in slide-in-from-bottom`)

### Typing Indicator
```ts
const getTypingText = () => {
  if (isGroupChat && typingUserName) return `${typingUserName} is typing...`;
  return "Typing...";
};
```
For group chats, shows which specific person is typing. For direct chats, just "Typing...".

---

## 📄 chat-body-message.tsx

**A single message bubble.** Wrapped in `React.memo` for performance.

### Message Ownership
```ts
const isCurrentUser = message.sender?._id === userId;
const isAIMessage = message.sender?.isAI === true;
```
- **Current user's messages**: right-aligned, `flex-row-reverse`, `bg-primary` bubble
- **AI messages**: left-aligned, purple gradient border `bg-gradient-to-r from-purple-500/10 to-blue-500/10`
- **Other user's messages**: left-aligned, `bg-muted` bubble

### Optimistic "Sending" Visual
```ts
const isSending = message.status === "sending...";
// Sends messages appear slightly faded: bg-primary/60
```
While the temp message is in the `"sending..."` state, the bubble is semi-transparent — feedback that it hasn't landed on the server yet.

### Reply Preview
If `message.replyTo` exists, renders a quoted preview above the main message:
```
┌─────────────────────────┐
│ You                     │  ← replySenderName
│ original message text   │  ← truncated
├─────────────────────────┤
│ The actual reply text   │
└─────────────────────────┘
```

### Image Support
- Renders `<img>` with `loading="lazy"` for performance
- `hover:scale-105` zoom on hover
- `ZoomIn` button → clicks open a fullscreen image `<Dialog>` lightbox

### AI Streaming Indicator
```ts
{isAIMessage && message.streaming && message.content && (
  <div className="w-3 h-3 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
)}
```
A spinning indicator shown while the AI message is still streaming in (partial content already received).

### Reply Button
Appears on hover (`opacity-0 group-hover:opacity-100`) — clicking calls `onReply(message)` which sets the `replyTo` state in the parent page, triggering `ChatReplyBar` to appear.

---

## 📄 chat-reply-bar.tsx

A **thin animated bar** that slides in above `ChatFooter` when the user clicks the reply button on a message.

### What it shows
```
┌── Replying to [You / UserName] ──────────── ✕ ──┐
│ The message they're replying to (truncated)       │
└───────────────────────────────────────────────────┘
```

### Behavior
- Slides in from the bottom with `animate-in slide-in-from-bottom-2 duration-200`
- The ✕ button calls `onCancel()` → clears `replyTo` state in the parent → bar disappears
- For image-only messages, previews as `"📷 Photo"` instead of text

---

## 📄 chat-footer.tsx

The **message compose bar** at the bottom of the chat window. Manages text input, image upload, typing events, and form submission.

### Libraries Used
- `react-hook-form` + `zodResolver` — form state and validation
- `useSocket` — to emit `typing:start` / `typing:stop` events
- `useChat` — to call `sendMessage()` and read `isSendingMsg`

### Typing Indicator Emission
```ts
const handleTyping = () => {
  socket.emit("typing:start", { chatId, userName });

  // Debounce: if no keystroke in 1500ms → emit stop
  typingTimeoutRef.current = setTimeout(() => {
    socket.emit("typing:stop", { chatId });
  }, 1500);
};
```
Every keystroke emits `"typing:start"`. A 1500ms debounce timer emits `"typing:stop"` if the user stops typing. If they type again, the previous timeout is cleared (`clearTimeout`) and a new one starts.

### Image Handling
1. Hidden `<input type="file" accept="image/*">` triggered by the paperclip button
2. `FileReader.readAsDataURL()` converts the image to a base64 string stored in `image` state
3. A thumbnail preview appears above the input with a ✕ remove button
4. The base64 string is sent as `payload.image` to the API (backend uploads to Cloudinary)

### Form Submission (`onSubmit`)
1. Guards: returns early if `isSendingMsg`, or if both `message` and `image` are empty
2. Emits `"typing:stop"` (immediately hides typing indicator on recipient's screen)
3. Clears the timeout ref
4. Calls `sendMessage(payload)` from `useChat`
5. Resets: cancels reply, removes image preview, resets the form
6. Refocuses the input field after 50ms

### Send Button State
```tsx
{isSendingMsg
  ? <div className="animate-spin rounded-full border-2 border-t-transparent" />
  : <Send className="h-3.5 w-3.5" />
}
```
The button shows a spinner while the message is in-flight, preventing double submissions.

---

## 📄 newchat-popover.tsx

The **"New Chat" flow** — a Popover that lets users start a direct chat, an AI chat, or a group chat.

### State Machine (internal)
```
isGroupMode = false → Direct Chat Mode
  ├── Shows "New Group" button
  ├── Shows "Chat with AI" button
  └── Lists all users (filtered by search)

isGroupMode = true → Group Creation Mode
  ├── Input → group name (same field as search, but for group name)
  ├── User list with checkboxes (multi-select)
  └── Footer → "Create Group (N members)" button
```

### Sub-components (all `memo`-wrapped)
- **`UserAvatar`** — renders avatar + name + email (or "AI Assistant" label) for a user
- **`ChatUserItem`** — a clickable row for starting a direct chat; shows loading spinner while creating
- **`GroupUserItem`** — a selectable row with a checkbox for group creation

### `handleCreateChat(userIdOrAIChat)`
```ts
const isAIChat = userIdOrAIChat === "ai";
const response = await createChat({
  isGroup: false,
  participantId: isAIChat ? undefined : userIdOrAIChat,
  isAiChat: isAIChat,
});
```
The string `"ai"` is the sentinel value that triggers AI chat creation.

### Reset on Close
`handleOpenChange(false)` → `resetState()` — clears group mode, group name, selected users, and search term. Prevents stale state if the user closes and reopens the popover.

### `memo` Usage
`NewChatPopover`, `UserAvatar`, `ChatUserItem`, and `GroupUserItem` are all wrapped in `React.memo`. Since this popover is inside the sidebar which re-renders on every socket event (chat list updates), memoization prevents unnecessary re-renders of the entire popover tree.

---

## 🔑 Key Patterns (Interview-Ready)

| Pattern | What it does |
|---|---|
| `React.memo` on message components | Prevents entire message list from re-rendering when a new message arrives |
| `useEffect` cleanup with `socket.off()` | Prevents stale closures and duplicate listeners when component unmounts or `chatId` changes |
| Debounced typing events | 1500ms timeout ensures `typing:stop` is only sent after the user pauses |
| `useRef` for timeout | Timeout ID stored in a ref — doesn't trigger re-renders, survives across renders |
| `cn()` for conditional classes | `clsx` + `tailwind-merge` — merges conditional class strings without conflicts |
| `getOtherUserAndGroup` helper | Single function that derives all display data for a chat — reused in header, list item |
| Sentinel value `"ai"` | A magic string that tells `createChat` to create an AI chat instead of a user chat |
| `FileReader.readAsDataURL` | Converts a local file to base64 — the only way to preview an image before uploading |

---

## 🧠 Interview Q&A (for revision only)

**Q: Why is `ChatBodyMessage` wrapped in `React.memo`?**
> The chat body re-renders whenever the `messages` array changes (e.g., when a new message arrives). Without `memo`, all existing message bubbles would re-render — even ones that didn't change. `memo` does a shallow prop comparison and skips the re-render if `message` and `onReply` haven't changed.

**Q: How does the typing indicator avoid spamming the server with socket events?**
> Each keystroke resets a 1500ms timeout. Only if the user stops typing for 1500ms does `"typing:stop"` fire. The previous timeout is always cleared (`clearTimeout`) before setting a new one — so only the final timeout after the last keystroke actually fires.

**Q: Why does `ChatBody` need `chatId` as a dependency for the socket listener?**
> Without it, the handler created by the first `useEffect` would "close over" the original `chatId` value. If the user navigates to a different chat, the old handler would still add messages to the wrong chat. Adding `chatId` to the dependency array ensures the listener is torn down and recreated for the new chat.

**Q: How does the image lightbox work?**
> `ChatBodyMessage` keeps `isImageOpen` and `selectedImage` in local state. Clicking an image sets both, opening a `<Dialog>` that renders the image at `max-w-[90vw] max-h-[90vh]`. The close button calls `setIsImageOpen(false)`.

**Q: Why does `filteredChats` use client-side filtering instead of API calls?**
> All chats are already fetched once on mount. Filtering by type (individuals/groups/unread) or search is fast enough client-side — no need for extra requests. This also gives instant feedback as the user types.

**Q: What does `getOtherUserAndGroup` return and when is it used?**
> It returns `{ name, subheading, avatar, isOnline, isGroup, isAI }` — all the display data for a given chat from the perspective of the current user. Used in both `ChatHeader` and `ChatListItem` to avoid duplicating the "find other participant" logic.

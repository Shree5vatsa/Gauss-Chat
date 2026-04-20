# 📁 services/

Services contain all **business logic**. Controllers call services — services talk to the database, third-party APIs, and socket layer.

> Rule: If it's more than "get input → return output", it belongs in a service.

---

## 📄 ai.service.ts

Handles communication with the **Groq AI API** (LLM backend).

### `getAIResponse(userMessage, conversationHistory)`

| Param | Type | Description |
|---|---|---|
| `userMessage` | `string` | The latest message from the user |
| `conversationHistory` | `{role, content}[]` | Last N messages for context |

**What it does:**
- Initializes Groq client with `GROQ_API_KEY` from env
- Builds a message array: system prompt → conversation history → new user message
- Calls `groq.chat.completions.create()` with model `llama-3.3-70b-versatile`
- Returns the AI's text response, or a fallback string on error

**Config used:**
- `temperature: 0.7` — balanced creativity vs. consistency
- `max_tokens: 500` — keeps responses concise
- Model: `llama-3.3-70b-versatile` (hosted on Groq for fast inference)

**System prompt:** `"You are a helpful AI assistant named Gauss AI. Keep responses concise and friendly."`

> ⚠️ This service is called lazily inside `message.service.ts` using dynamic `import()` to avoid circular dependency issues.

---

## 📄 auth.service.ts

Handles user registration, login, and password changes.

### `registerService(body: RegisterSchemaType)`
- Checks if email already exists → throws `UnauthorizedException` if it does
- Creates a new `userModel` instance with name, email, password, avatar
- Calls `newUser.save()` (triggers the pre-save hook in the model that hashes the password)
- Returns the saved user

> ⚠️ Password hashing happens in the **model's pre-save hook**, NOT here directly.

### `loginService(body: LoginSchemaType)`
- Finds user by email → throws `UnauthorizedException` if not found
- Calls `user.comparePassword(password)` — a method defined on the Mongoose model
- Throws `UnauthorizedException` on wrong password
- Returns the user object on success

### `changePasswordService(userId, newPassword)`
- Finds user by ID → throws `BadRequestException` if not found
- Sets `user.password = newPassword` and calls `user.save()`
- The model's pre-save hook re-hashes the new password automatically
- Returns the updated user

---

## 📄 chat.service.ts

Core chat logic — creation, retrieval, unread tracking. Handles 3 chat types: **1-on-1**, **Group**, and **AI chat**.

### `createChatService(userId, body)`

Three branches based on body:

**1. AI Chat (`isAiChat: true`)**
- Finds or creates the AI user (`isAI: true`) in the DB
- Checks if an AI chat already exists between the user and AI → returns it if so (no duplicates)
- Creates a new chat with `isAiChat: true` if none exists

**2. Group Chat (`isGroup: true`, `participants[]`, `groupName`)**
- Combines `userId` + `participants` array into `allParticipantIds`
- Creates chat with `isGroup: true`, `admin: userId`, optional `groupAvatar`

**3. Direct (1-on-1) Chat (`participantId`)**
- Verifies the other user exists
- Checks for existing chat with `$all` + `$size: 2` to prevent duplicate DMs
- Creates new chat if none exists

After creation → populates participants → calls `emitNewChatToParticipants()` via Socket.io

### `getUserChatService(userId)`
- Finds all chats where user is a participant (`$in`)
- Populates `participants` (name, avatar, isAI) and `lastMessage` (with sender info)
- Sorts by `updatedAt` descending (most recent first)
- **Filters out invalid chats** (deleted participants, DMs with < 2 people)
- Maps each chat to include `unreadCount` for the requesting user (from a Map field)
- Returns clean array of chats with per-user unread counts

### `getSingleChatService(chatId, userId)`
- Verifies user is a participant in the chat
- Fetches all messages for the chat sorted `createdAt: 1` (oldest first)
- Populates `sender` and nested `replyTo.sender` for each message
- Returns `{ chat, messages }` together in one call

### `validateChatParticipant(chatId, userId)`
- Utility used by other services (e.g., message service)
- Confirms user belongs to the chat — throws `BadRequestException` if not
- Returns the chat document

### `resetUnreadCountService(chatId, userId)`
- Finds the chat and sets `unreadCount` for `userId` to `0`
- Saves and returns the updated chat
- Called when user opens a chat window

---

## 📄 message.service.ts

Handles sending messages and triggering AI responses.

### `sendMessageService(userId, body)`

**body shape:** `{ chatId, content?, image?, replyToId? }`

**Step-by-step flow:**

1. **Auth check** — verifies user is a participant in the chat
2. **Reply validation** — if `replyToId` provided, confirms that message exists in the same chat
3. **Image upload** — if `image` (base64) provided, uploads to Cloudinary and stores `secure_url`
4. **Create message** — saves to `MessageModel` with sender, content, image, replyTo
5. **Populate message** — populates sender and nested replyTo.sender
6. **Update chat** — sets `chat.lastMessage` to the new message ID
7. **Increment unread** — loops all participants except sender, increments their `unreadCount` in the Map
8. **Socket emit** — `emitNewMessageTochatRoom()` sends message to the chat room; `emitLastMessageToParticipants()` updates the sidebar for all users
9. **AI response (if `isAiChat`):**
   - Finds the AI user in DB
   - Confirms sender is NOT the AI (prevents infinite loop)
   - Fetches last 5 messages and builds `conversationHistory`
   - Calls `getAIResponse()` from `ai.service.ts`
   - Creates a new AI message with `replyTo` pointing to the user's message
   - Updates `chat.lastMessage` again to the AI's message
   - Emits AI message via Socket.io to the chat room and sidebar

**Returns:** `{ userMessage, chat }` — only the user's message is returned in the HTTP response; the AI reply is emitted via socket.

---

## 📄 user.service.ts

Handles user lookup, profile updates, and account deletion.

### `findByIdUserService(userId)`
- Simple `findById` wrapper
- Used internally by auth/passport middleware

### `getUserService(userId)`
- Returns all users **except** the requesting user and AI users
- Excludes `password` field
- Used for the "New Chat" search/list feature

### `updateUserProfileService(userId, { name?, avatar? })`
- If `avatar` is a base64 data URL (`data:image...`), uploads to Cloudinary under `avatars/` folder
- Builds `updateData` object only with provided fields (partial update)
- Uses `findByIdAndUpdate` with `{ new: true }` to return updated doc
- Excludes `password` from response
- Throws `NotFoundException` if user doesn't exist

### `deleteUserAccountService(userId)`

**Full cascade delete — step by step:**

1. Finds all chats the user was in, collects all other participant IDs
2. Deletes the user from `userModel`
3. Pulls user from all chat `participants` arrays (`$pull`)
4. Deletes any chats that now have 0 participants (`$size: 0`)
5. Deletes all messages where `sender === userId`
6. Emits `emitUserAccountDeleted` to all affected participants so their UI updates in real-time

---

## 🔑 Key Patterns (Interview-Ready)

| Pattern | What it does |
|---|---|
| Pre-save hook | Password hashing in `userModel` runs on every `.save()` automatically |
| `$all + $size` | MongoDB query to find exact match of participants array — prevents duplicate DMs |
| Map field for unread | `unreadCount` is a `Map<string, number>` in Mongoose — per-user unread tracking |
| Dynamic `import()` | `ai.service` is imported inside `message.service` at call time to avoid circular deps |
| Cascade delete | Account deletion cleans up chats, messages, and notifies online users via socket |
| Lazy AI user creation | AI user is created on demand, not just at startup — resilient to DB resets |

---

## 🧠 Interview Q&A

**Q: How do you prevent duplicate direct message chats?**
> `ChatModel.findOne({ participants: { $all: [userId, participantId], $size: 2 } })` — `$all` ensures both users are present, `$size: 2` ensures no extra participants. If found, the existing chat is returned instead of creating a new one.

**Q: How does unread count work?**
> The `Chat` model has a `unreadCount` field typed as `Map<string, number>`. On every new message, all participants except the sender get their count incremented. When they open the chat, `resetUnreadCountService` sets their count back to 0.

**Q: How is the AI response triggered without blocking the HTTP response?**
> The HTTP response returns the user's message immediately. The AI logic runs after that in the same async function — it creates the AI message and emits it via Socket.io. The frontend receives it as a socket event, not as part of the HTTP response.

**Q: Why use Groq instead of OpenAI?**
> Groq provides much faster inference (uses LPU hardware) and is cost-effective for real-time chat use cases where low latency matters.

**Q: How does password hashing work on change?**
> `user.password = newPassword` then `user.save()` — the model's pre-save hook detects that `password` is modified (`isModified('password')`) and re-hashes it automatically using bcrypt.

**Q: How does account deletion notify other users?**
> After deleting the user and cleaning up DB records, the service loops through all affected participant IDs and calls `emitUserAccountDeleted(participantId, userId)` — each online user receives a socket event and their chat list refreshes.
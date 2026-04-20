# 📁 models/

Models define the **MongoDB schema + data shape** using Mongoose. They are the single source of truth for what gets stored in the DB. Each model also defines indexes and instance methods used across services.

---

## 📄 user.model.ts

Represents a user account (human or AI bot).

### Interface: `UserDocument`
```typescript
name: string
email: string
password: string
avatar?: string | null
isAI?: boolean
createdAt: Date
updatedAt: Date
comparePassword(password: string): Promise<boolean>  // instance method
```

### Schema Fields

| Field | Type | Notes |
|---|---|---|
| `name` | String | required, trimmed |
| `email` | String | required, unique, trimmed |
| `password` | String | required, hashed before save |
| `avatar` | String | default `null` |
| `isAI` | Boolean | default `false` — flags the Gauss AI bot user |

### Key Behaviors

**Pre-save hook — password hashing:**
```typescript
userSchema.pre("save", async function (next) {
  if (this.password && this.isModified("password")) {
    this.password = await hashValue(this.password);
  }
});
```
- Runs automatically before every `.save()`
- `isModified("password")` ensures it only re-hashes when password actually changes
- This is why `changePasswordService` just does `user.password = newPassword; user.save()` — hashing is handled here

**`toJSON` transform — password stripping:**
```typescript
toJSON: {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  }
}
```
- Removes `password` from any object returned via `.toJSON()` or `res.json()`
- Means you never accidentally leak the password hash to the client

**Instance method — `comparePassword`:**
- Calls `compareValue(plainText, hashedPassword)` from bcrypt utils
- Used in `loginService` to verify credentials

---

## 📄 chat.model.ts

Represents a chat room — supports 3 types: **direct (1-on-1)**, **group**, and **AI chat**.

### Interface: `ChatDocument`
```typescript
participants: ObjectId[]       // refs to User
isGroup: boolean
isAiChat: boolean
groupName?: string
admin?: ObjectId               // ref to User
lastMessage?: ObjectId | null  // ref to Message
unreadCount: Map<string, number>
createdAt: Date
updatedAt: Date
```

### Schema Fields

| Field | Type | Notes |
|---|---|---|
| `participants` | ObjectId[] | ref: User — min 2, validated |
| `isGroup` | Boolean | default `false` |
| `isAiChat` | Boolean | default `false` |
| `groupName` | String | required only if `isGroup: true` |
| `admin` | ObjectId | ref: User — required only if `isGroup: true` |
| `lastMessage` | ObjectId | ref: Message — default `null` |
| `unreadCount` | Map\<string, number\> | per-user unread tracking |

### Key Behaviors

**Conditional required fields:**
```typescript
required: function(this: ChatDocument) {
  return this.isGroup;
}
```
- `groupName` and `admin` are only required when `isGroup: true`
- Mongoose supports function-based `required` validators for this

**Participant validation:**
```typescript
validate: {
  validator: (value) => value.length >= 2,
  message: "Chat must have at least two participants"
}
```
- Enforces minimum 2 participants at the DB level

**`unreadCount` as a Map:**
- Stored as `Map<string, number>` where key = `userId`, value = unread count
- Accessed via `chat.unreadCount.get(userId)` and `chat.unreadCount.set(userId, n)`
- Allows per-user unread tracking in a single field

**Index:**
```typescript
chatSchema.index({ participants: 1, updatedAt: -1 });
```
- Optimizes the most common query: "get all chats for a user, sorted by most recent"

---

## 📄 message.model.ts

Represents a single message inside a chat room.

### Interface: `MessageDocument`
```typescript
chatId: ObjectId       // ref to Chat
sender: ObjectId       // ref to User
content?: string
image?: string
replyTo?: ObjectId | null  // ref to Message (self-referential)
createdAt: Date
updatedAt: Date
```

### Schema Fields

| Field | Type | Notes |
|---|---|---|
| `chatId` | ObjectId | ref: Chat — required |
| `sender` | ObjectId | ref: User — required |
| `content` | String | optional, trimmed |
| `image` | String | optional (Cloudinary URL) |
| `replyTo` | ObjectId | self-ref to Message — default `null` |

### Key Behaviors

**Pre-validate hook — content or image required:**
```typescript
messageSchema.pre("validate", function (next) {
  if (!this.content && !this.image) {
    next(new Error("Message must have at least text or image"));
  }
  next();
});
```
- Ensures a message can't be empty — must have either text or an image
- Uses `pre("validate")` (not `pre("save")`) so it runs before Mongoose validation

**Self-referential `replyTo`:**
- `replyTo` refs the `Message` model itself
- Enables threaded replies — when populated, gives you `replyTo.content`, `replyTo.sender.name`, etc.

**Index:**
```typescript
messageSchema.index({ chatId: 1, createdAt: 1 });
```
- Optimizes fetching all messages for a chat in chronological order
- Most frequent query pattern in the app

---

## 🔑 Key Patterns (Interview-Ready)

| Pattern | What it does |
|---|---|
| Pre-save hook | Auto-hashes password on every save where password is modified |
| `isModified()` | Mongoose method — prevents re-hashing an already hashed password |
| `toJSON` transform | Strips sensitive fields (password) before any JSON serialization |
| Instance methods | `comparePassword` lives on the model — keeps auth logic close to the data |
| Conditional `required` | Function-based validators make fields required only in certain states |
| Map field | `unreadCount` as `Map<string, number>` — efficient per-user tracking in one field |
| Self-referential ref | `replyTo` in Message refs itself — enables reply chains |
| Compound indexes | Match query patterns exactly for best performance |

---

## 🧠 Interview Q&A

**Q: Why use a pre-save hook for password hashing instead of doing it in the service?**
> It centralizes the security concern at the data layer. No matter where `.save()` is called — register, change password, seeding — the password is always hashed. You can't forget to hash it.

**Q: What's the difference between `pre("save")` and `pre("validate")`?**
> `pre("validate")` runs before Mongoose checks required fields and types. `pre("save")` runs after validation, just before writing to DB. For the "must have content or image" check, `pre("validate")` is correct because we want it to fail like a validation error.

**Q: How does `unreadCount` as a Map work in Mongoose?**
> Declared as `type: Map, of: Number`. Mongoose stores it as a BSON object in MongoDB. You access it with `.get(key)` and `.set(key, value)` — just like a JS Map. Each user's unread count is tracked independently without needing a separate collection.

**Q: Why does `toJSON` strip the password but the field is still `required` in the schema?**
> `required` is a write-time concern — the password must exist when saving. `toJSON` transform is a read-time concern — it removes the field from serialized output. They operate at different stages and don't conflict.

**Q: What does `{ new: true }` do in `findByIdAndUpdate`?**
> By default, Mongoose returns the document *before* the update. `{ new: true }` returns the updated document instead — needed when you want to send the updated user back to the client.

**Q: How are compound indexes chosen?**
> Indexes match the most frequent query patterns. For chats: find by `participants` then sort by `updatedAt` → `{ participants: 1, updatedAt: -1 }`. For messages: find by `chatId` then sort by `createdAt` → `{ chatId: 1, createdAt: 1 }`. This avoids full collection scans.
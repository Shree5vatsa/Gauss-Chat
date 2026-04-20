# 📁 validators/

Validators define **Zod schemas** — the runtime type-checking layer that sits between the raw HTTP request body and the business logic. Every piece of user input is validated here before it touches a service or database.

> Zod is a **runtime validation library** — it validates actual data at runtime (unlike TypeScript, which only checks types at compile time). Zod schemas **exist at runtime**, **can validate real values**, and **can throw errors**.

---

## 📄 auth.validator.ts

Defines schemas for all authentication-related inputs.

### `emailSchema`
```ts
export const emailSchema = z.string().trim().email("Invalid email address").min(1);
```
- `trim()` — removes leading/trailing whitespace before validation
- `.email()` — validates proper email format (e.g., rejects `"notanemail"`)
- `.min(1)` — ensures the string isn't empty after trimming
- Used as a **reusable building block** inside `registerSchema` and `loginSchema`

### `passwordSchema`
```ts
export const passwordSchema = z.string().trim().min(1);
```
- Minimal validation — just ensures a non-empty string
- No complexity rules (letters, numbers, symbols) enforced at the schema level

### `registerSchema`
```ts
export const registerSchema = z.object({
  name: z.string().trim().min(1),
  email: emailSchema,
  password: passwordSchema,
  avatar: z.string().optional(),
});
```
- Validates all fields for the `/auth/register` endpoint
- `avatar` is optional — users can register without uploading an avatar

### `loginSchema`
```ts
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
```
- Simpler than `registerSchema` — only email + password needed for login

### `changePasswordSchema`
```ts
export const changePasswordSchema = z.object({
  newPassword: passwordSchema,
});
```
- Used in the change-password endpoint — only new password required

### Inferred Types
```ts
export type RegisterSchemaType = z.infer<typeof registerSchema>;
export type LoginSchemaType = z.infer<typeof loginSchema>;
export type ChangePasswordSchemaType = z.infer<typeof changePasswordSchema>;
```
`z.infer<>` extracts the TypeScript type from a Zod schema — so you get both runtime validation (Zod) and compile-time type safety (TypeScript) from a **single source of truth**.

---

## 📄 chat.validator.ts

Defines schemas for chat creation and chat ID validation.

### `createChatSchema`
```ts
export const createChatSchema = z.object({
  participantId: z.string().trim().min(1).optional(),
  isGroup: z.boolean().optional(),
  participants: z.array(z.string().trim().min(1)).optional(),
  groupName: z.string().trim().min(1).optional(),
  isAiChat: z.boolean().optional(),
});
```
All fields are optional because the shape of the request body varies by chat type:

| Chat Type | Required Fields |
|---|---|
| Direct chat | `participantId` |
| Group chat | `isGroup: true`, `participants[]`, `groupName` |
| AI chat | `isAiChat: true` |

The service layer handles which fields are actually required for each case.

### `chatIdSchema`
```ts
export const chatIdSchema = z.object({
  id: z.string().trim().min(1),
});
```
- Validates the `:id` URL parameter before it's passed to a service
- Ensures the ID is a non-empty string (MongoDB ObjectId format)

---

## 📄 message.validator.ts

Defines the schema for sending messages.

### `sendMessageSchema`
```ts
export const sendMessageSchema = z.object({
    chatId: z.string().trim().min(1),
    content: z.string().trim().optional(),
    image: z.string().trim().optional(),
    replyToId: z.string().trim().optional(),
}).refine(
    (data) => data.content || data.image,
    {
        message: "Message must have at least text or image",
        path: ["content", "image"],
    }
);
```

- `chatId` — required: which chat to send to
- `content` — optional: text message body
- `image` — optional: image URL (likely a Cloudinary URL)
- `replyToId` — optional: ID of the message being replied to (threading)

### `.refine()` — Custom Cross-Field Validation
`.refine()` adds a **custom validation rule** that runs after the field-level checks:
- The rule: `data.content || data.image` — at least ONE must be present
- If both are absent, Zod throws a validation error on the `["content", "image"]` path
- This can't be expressed with simple field-level validators (`optional()` + `min()`) because it's a relationship between two fields

---

## 🔑 Key Patterns (Interview-Ready)

| Pattern | What it does |
|---|---|
| `z.infer<typeof schema>` | Derives a TypeScript type from a Zod schema — one source of truth for both runtime and compile-time safety |
| `schema.parse(data)` | Validates and returns the typed data — **throws** `ZodError` if invalid |
| `schema.safeParse(data)` | Alternative — returns `{ success, data, error }` — does not throw |
| `.trim()` on strings | Strips whitespace before validation — prevents ` ` (space) from passing a `.min(1)` check |
| `.optional()` | Field can be `undefined` or absent from the object |
| `.refine(fn, message)` | Custom cross-field validation logic — runs after field-level checks pass |
| `z.array(z.string())` | Validates that a field is an array of strings — used for group chat `participants` |

---

## 🧠 Interview Q&A (for revision only)

**Q: What is Zod and why use it instead of manual validation?**
> Zod is a TypeScript-first runtime validation library. Instead of writing `if (!body.email || typeof body.email !== "string")` for every field, you define a schema once. It validates the data, throws a structured error if invalid, and infers TypeScript types — eliminating a whole class of bugs.

**Q: What's the difference between `z.parse()` and `z.safeParse()`?**
> `parse()` throws a `ZodError` on failure — used here because `asyncHandler` catches it. `safeParse()` returns `{ success: boolean, data?, error? }` — useful when you want to handle the error yourself without throwing.

**Q: What does `z.infer<typeof schema>` do?**
> It extracts the TypeScript type that the schema represents. For example, `z.infer<typeof loginSchema>` gives you `{ email: string; password: string }`. This means your schema is the **single source of truth** — change the schema, and TypeScript types update automatically.

**Q: Why are most fields in `createChatSchema` optional?**
> Because the endpoint handles multiple chat types (direct, group, AI). Required fields differ per type. Rather than creating separate endpoints, the schema stays flexible and the service layer validates the specific combination.

**Q: How does `.refine()` differ from regular field validators?**
> Regular validators (`.min()`, `.email()`, etc.) validate a single field in isolation. `.refine()` runs a custom function on the entire parsed object — perfect for cross-field rules like "either `content` or `image` must be present, but not necessarily both."

**Q: Where do Zod validation errors ultimately get sent as HTTP responses?**
> `schema.parse()` throws a `ZodError`. `asyncHandler` wraps the controller, so the error bubbles to `next(error)`. `errorHandler.middleware.ts` receives it — since `ZodError` is not an `AppError`, it falls through to the generic `500` handler. For proper 400 responses, services can catch `ZodError` and re-throw as `BadRequestException`.

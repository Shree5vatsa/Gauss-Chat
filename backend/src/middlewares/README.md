# 📁 middlewares/

Middlewares are **functions that sit in the Express request-response pipeline**. They run between the incoming request and the final route handler. This folder contains two critical middlewares that power the entire app's error handling and async safety.

---

## 📄 asyncHandler.middleware.ts

Wraps every async route handler to **automatically catch thrown errors** and forward them to Express's error middleware — without needing a `try/catch` in every controller.

### The Problem It Solves
Express does **not** catch errors thrown from `async` functions by default. Without this wrapper, any unhandled promise rejection would silently hang the request or crash the server.

### How It Works

```ts
export const asyncHandler = (controller: AsyncController) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            return await controller(req, res, next);
        } catch (error) {
            next(error); // forwards to errorHandler
        }
    }
```

1. Takes an `AsyncController` function (your real route handler) as input
2. Returns a **new async function** with the same `(req, res, next)` signature that Express expects
3. Wraps execution in `try/catch` — any error, whether a thrown `AppError` or a Zod validation error, gets passed to `next(error)`
4. `next(error)` triggers Express to skip all remaining route handlers and jump to the **error handler middleware**

### Usage
```ts
// In a controller file:
export const loginController = asyncHandler(async (req, res) => {
    // no try/catch needed — errors bubble up automatically
    const body = loginSchema.parse(req.body);
    const user = await loginService(body);
    res.status(200).json(user);
});
```

---

## 📄 errorHandler.middleware.ts

The **global error handler** — a special Express middleware with 4 parameters `(error, req, res, next)` that catches all errors forwarded by `asyncHandler` and returns a structured JSON response.

### How It Works

```ts
export const errorHandler: ErrorRequestHandler = (error, req, res, next): any => {
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message,
            errorCode: error.errorCode,
        });
    }

    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error?.message || "Sorry, something went wrong",
        errorCode: error.errorCode,
    });
};
```

### Two Error Paths

| Error Type | What Happens |
|---|---|
| `instanceof AppError` | Uses the custom `statusCode` and `errorCode` — returns a clean, predictable response |
| Any other error | Falls through to the generic `500 Internal Server Error` block |

### Registration in `index.ts`
```ts
app.use(errorHandler); // Must be LAST — after all routes
```
> ⚠️ Error middleware **must** be registered after all routes. Express identifies it by its 4-parameter signature.

---

## 🔑 Key Patterns (Interview-Ready)

| Concept | Detail |
|---|---|
| `asyncHandler` wrapping | Eliminates boilerplate `try/catch` — all errors centrally handled |
| `next(error)` | Express's signal to skip normal middleware and jump to the error handler |
| 4-parameter signature | `(err, req, res, next)` — Express only treats a middleware as an error handler if it has exactly 4 params |
| `instanceof AppError` check | Distinguishes known/expected errors (auth failures, not found) from unexpected crashes |
| `errorHandler` position | Must be the **last** `app.use()` call — otherwise it won't catch errors from routes defined after it |

---

## 🧠 Interview Q&A (for revision only)

**Q: Why does Express need 4 parameters for an error handler?**
> It's how Express distinguishes a regular middleware from an error-handling middleware. If you only have 3 params, Express treats it as a normal middleware and won't pass errors to it.

**Q: What happens if you don't use `asyncHandler`?**
> An `async` route handler that throws will produce an unhandled promise rejection. In older Node versions this crashes the process. In newer ones it's suppressed — but the request hangs indefinitely with no response.

**Q: What's the difference between `AppError` and a generic `Error`?**
> `AppError` carries a specific `statusCode` and `errorCode`, allowing the error handler to return a proper HTTP status. A generic `Error` always results in a 500.

**Q: Can `asyncHandler` catch synchronous errors too?**
> No. `try/catch` inside an `async` function only catches errors thrown with `throw` or rejected promises (`await`). Synchronous errors thrown *before* the first `await` are caught, but truly synchronous middleware errors need separate handling.

**Q: Where do Zod validation errors get caught?**
> `schema.parse(req.body)` throws a `ZodError` (which is not an `AppError`). `asyncHandler` catches it via `next(error)`, and `errorHandler` returns a `500`. For cleaner 400 responses, Zod errors can be intercepted and wrapped in a `BadRequestException` inside the controller.

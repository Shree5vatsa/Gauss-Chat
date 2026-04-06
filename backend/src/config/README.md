# ⚙️ Config

This folder contains all the centralized configuration modules for the Gauss-Chat backend. Each file is responsible for initializing or exporting a specific piece of infrastructure or application-level configuration.

---

## 📁 Files Overview

| File | Purpose |
|---|---|
| [`env.config.ts`](#-envconfigts) | Centralized environment variable access |
| [`database.config.ts`](#-databaseconfigts) | MongoDB connection setup |
| [`cloudinary.config.ts`](#-cloudinaryconfigts) | Cloudinary SDK initialization |
| [`http.config.ts`](#-httpconfigts) | HTTP status code constants |
| [`passport.config.ts`](#-passportconfigts) | Passport.js JWT authentication strategy |

---

## 📄 `env.config.ts`

Exports a typed, readonly `Env` object containing all environment variables used throughout the application. Values are loaded via the `getEnv` utility (from `../utils/get-env`), which throws an error at startup if a required variable is missing.

### Variables

| Variable | Default | Required | Description |
|---|---|---|---|
| `NODE_ENV` | `"development"` | No | Current runtime environment |
| `PORT` | `"4000"` | No | Port the server listens on |
| `MONGO_URI` | — | **Yes** | MongoDB connection string |
| `JWT_SECRET` | `"my_secret_jwt"` | No | Secret key for signing JWTs |
| `JWT_EXPIRES_IN` | `"15m"` | No | JWT token expiry duration |
| `FRONTEND_ORIGIN` | `"http://localhost:5173"` | No | Allowed CORS origin |
| `CLOUDINARY_CLOUD_NAME` | — | **Yes** | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | — | **Yes** | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | — | **Yes** | Cloudinary API secret |

> **Note:** Variables without a default are required and will cause a startup error if not set in `.env`.

---

## 📄 `database.config.ts`

Exports an async `connectDB` function that connects to MongoDB using Mongoose and the `MONGO_URI` from `Env`. If the connection fails, it logs the error and exits the process with code `1`.

### Usage

```ts
import connectDB from "./config/database.config";

await connectDB();
```

---

## 📄 `cloudinary.config.ts`

Configures the Cloudinary v2 SDK with credentials sourced from `Env` and exports the configured `cloudinary` instance for use in services that handle media uploads (e.g., profile pictures, message attachments).

### Usage

```ts
import cloudinary from "./config/cloudinary.config";

await cloudinary.uploader.upload(filePath, { folder: "avatars" });
```

---

## 📄 `http.config.ts`

Exports a readonly `HTTP_STATUS` constant object and a derived `HttpStatusCodeType` type for consistent, type-safe HTTP status codes across controllers and middlewares.

### Available Status Codes

| Constant | Code |
|---|---|
| `HTTP_STATUS.OK` | `200` |
| `HTTP_STATUS.CREATED` | `201` |
| `HTTP_STATUS.BAD_REQUEST` | `400` |
| `HTTP_STATUS.UNAUTHORIZED` | `401` |
| `HTTP_STATUS.FORBIDDEN` | `403` |
| `HTTP_STATUS.NOT_FOUND` | `404` |
| `HTTP_STATUS.INTERNAL_SERVER_ERROR` | `500` |

### Usage

```ts
import { HTTP_STATUS } from "./config/http.config";

res.status(HTTP_STATUS.OK).json({ message: "Success" });
```

---

## 📄 `passport.config.ts`

Configures and registers a **JWT strategy** with Passport.js. The token is extracted from the `accessToken` HTTP-only cookie. On successful validation, it looks up the user by `userId` from the JWT payload using `findByIdUserService`.

Exports `passportAuthenticateJwt` — a pre-configured middleware for protecting routes that require authentication.

### Strategy Details

| Option | Value |
|---|---|
| Token Source | `req.cookies.accessToken` (HTTP-only cookie) |
| Secret | `Env.JWT_SECRET` |
| Audience | `"user"` |
| Session | `false` (stateless) |

### Usage

```ts
import { passportAuthenticateJwt } from "./config/passport.config";

router.get("/profile", passportAuthenticateJwt, profileController);
```

---

## 🔗 Dependencies Between Config Files

```
env.config.ts
    ├── database.config.ts
    ├── cloudinary.config.ts
    └── passport.config.ts
```

All config modules that need environment variables import directly from `env.config.ts`. This ensures a single source of truth and fail-fast behavior at startup.

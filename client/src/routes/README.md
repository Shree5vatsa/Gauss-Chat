# 📁 routes/

Defines the **entire routing structure** of the frontend. Handles which pages are accessible without logging in (public), which require authentication (protected), and how unauthorized users are redirected.

Uses **React Router v6** with nested routes and layout components.

---

## 📄 routes.tsx — Route Definitions

The **single source of truth** for all routes. Exports:

### Route Path Constants
```ts
export const AUTH_ROUTES = {
    SIGN_IN: "/",
    SIGN_UP: "/sign-up",
}

export const PROTECTED_ROUTES = {
    CHAT: "/chat",
    SINGLE_CHAT: "/chat/:chatId",
}
```
Using constants instead of raw strings means renaming a route only requires one change here — every component that uses `PROTECTED_ROUTES.CHAT` (like the back button in `ChatHeader`) updates automatically.

### Route Arrays
```ts
export const authRoutesPaths = [
  { path: "/",        element: <SignIn /> },
  { path: "/sign-up", element: <SignUp /> },
]

export const protectedRoutesPaths = [
  { path: "/chat",          element: <Chat /> },
  { path: "/chat/:chatId",  element: <SingleChat /> },
]
```
Arrays of `{ path, element }` objects — iterated over in `index.tsx` with `.map()` to register routes. Adding a new route only requires adding an entry here.

### `isAuthRoute(pathname)` — Utility
```ts
export const isAuthRoute = (pathname: string) => {
  return Object.values(AUTH_ROUTES).includes(pathname);
}
```
Checks whether a pathname is an auth route — can be used to control layout visibility or active link styles.

---

## 📄 route-guard.tsx — Auth Guard

A **wrapper component** that protects routes based on authentication status. Any route wrapped by `<RouteGuard>` checks the auth state before rendering.

```ts
const RouteGuard = ({ requireAuth }: Props) => {
  const { user } = useAuth();

  if (requireAuth && !user) return <Navigate to="/" replace />;    // → send to login
  if (!requireAuth && user) return <Navigate to="/chat" replace />; // → send to chat

  return <Outlet />;  // → render the page
};
```

### Two Guard Modes

| `requireAuth` | Logged in? | Result |
|---|---|---|
| `true` | No | `<Navigate to="/" />` — must log in first |
| `true` | Yes | `<Outlet />` — render the protected page |
| `false` | No | `<Outlet />` — render the public page normally |
| `false` | Yes | `<Navigate to="/chat" />` — already logged in, skip auth pages |

The `replace` prop on `<Navigate>` **replaces** the current history entry instead of adding a new one — so the user can't press the browser back button to go back to the login page after logging in.

### `<Outlet />`
In React Router v6, `<Outlet>` renders whatever child route matched. Think of `RouteGuard` as a "gate" — it either renders the child (`<Outlet>`) or redirects.

---

## 📄 index.tsx — Route Assembly (`AppRoutes`)

The **central router** — assembles all routes into a nested tree using `<Routes>` and passes them through the right guards and layouts.

```tsx
<Routes>
  {/* Public routes — guarded against already-logged-in users */}
  <Route path="/" element={<RouteGuard requireAuth={false} />}>
    <Route element={<BaseLayout />}>
      {authRoutesPaths.map(route => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
    </Route>
  </Route>

  {/* Protected routes — guarded against logged-out users */}
  <Route path="/" element={<RouteGuard requireAuth={true} />}>
    <Route element={<AppLayout />}>
      {protectedRoutesPaths.map(route => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
    </Route>
  </Route>
</Routes>
```

### Nesting Structure (inside-out)
Each actual page is wrapped in **3 layers**:

```
<Routes>
  └── <Route path="/"> ← matches all paths
        └── <RouteGuard requireAuth={...}> ← redirect if not authed
              └── <AppLayout> or <BaseLayout> ← shared UI wrapper
                    └── <Route path="/chat"> ← the actual page component
```

### Layout Components
- **`<BaseLayout>`** — wraps auth pages (`/`, `/sign-up`) — likely just centers the card on screen
- **`<AppLayout>`** — wraps the main chat app — contains the sidebar, resizable panel, etc.

---

## 🔑 Key Patterns (Interview-Ready)

| Pattern | What it does |
|---|---|
| `<RouteGuard>` with `<Outlet>` | Conditional rendering gate — either renders children or redirects |
| `replace` on `<Navigate>` | Replaces history entry — prevents using back button to access auth pages when logged in |
| Route constants (`AUTH_ROUTES`, `PROTECTED_ROUTES`) | Single source of truth — change a path in one place, not scattered across the app |
| Route arrays + `.map()` | Data-driven routing — scalable, easy to add new routes without touching the assembly |
| Nested `<Route>` elements | React Router v6 nesting — each level can inject wrappers (guards, layouts) without duplicating route logic |

---

## 🧠 Interview Q&A (for revision only)

**Q: What is `<Outlet>` in React Router v6?**
> `<Outlet>` is a placeholder rendered by a parent route component that shows whichever child route currently matches. It's the v6 replacement for rendering `{children}`. In this app, `RouteGuard` either renders `<Outlet>` (allowing the child page to show) or redirects.

**Q: What's the difference between `<Navigate replace>` and `<Navigate>` (without replace)?**
> Without `replace`, navigating to `/chat` after login adds `/chat` to the browser history stack — pressing Back would go to `/` (login). With `replace`, the login entry is replaced with `/chat`, so the user can't navigate back to the login page with the Back button.

**Q: Why are there two `<Route path="/">` elements at the root?**
> React Router v6 matches the first path that fits, then evaluates the children. Both start at `/` but diverge at the `<RouteGuard>` level — one guards auth routes (`requireAuth={false}`), the other guards protected routes (`requireAuth={true}`). They don't conflict because the child paths (e.g., `/chat`) are unique.

**Q: Why use route arrays instead of hardcoding `<Route>` elements?**
> Arrays make routing data-driven. Adding a new route only requires adding `{ path, element }` to the array in `routes.tsx` — the assembly in `index.tsx` doesn't need to change. This also makes it easy to generate route lists (e.g., for a nav menu or sitemap).

**Q: How does the auth guard know if the user is logged in?**
> `RouteGuard` reads `user` from `useAuth()` — the Zustand store. If `user` is non-null, the user is authenticated. The app initializes `user` via `isAuthStatus()` on startup (called in `AppWrapper`), which hits `/auth/status` with the stored cookie.

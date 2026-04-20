# 📦 Gauss-Chat — Frontend (Client)

React 19 + Vite 8 frontend for **Gauss-Chat**. Built with TypeScript, Tailwind CSS v4, Shadcn/ui, Zustand for state management, and Socket.io for real-time messaging.

---

## 🚀 Getting Started

### Install all dependencies
```bash
npm install
```

### Set up environment variables
Create a `.env` file in `client/`:
```env
VITE_API_URL=http://localhost:5000
```

### Run development server
```bash
npm run dev
```
Runs on **http://localhost:5173** with Vite's fast HMR (Hot Module Replacement).

### Other commands
```bash
npm run build    # TypeScript check + production bundle → dist/
npm run preview  # Serve the production build locally
npm run lint     # Run ESLint across all files
```

---

## 🛠️ Tech Stack

| Tool | Version | Role |
|---|---|---|
| **React** | ^19.2.4 | UI library |
| **TypeScript** | ~5.9.3 | Static typing |
| **Vite** | ^8.0.1 | Build tool + dev server |
| **Tailwind CSS** | ^4.2.2 | Utility-first styling |
| **Zustand** | ^5.0.12 | Global state management |
| **React Router DOM** | ^7.13.2 | Client-side routing |
| **Socket.io Client** | ^4.8.3 | Real-time WebSocket communication |
| **Axios** | ^1.14.0 | HTTP client |
| **React Hook Form** | ^7.72.1 | Form state management |
| **Zod** | ^4.3.6 | Form validation schemas |
| **Sonner** | ^2.0.7 | Toast notifications |
| **next-themes** | ^0.4.6 | Dark/light theme management |
| **date-fns** | ^4.1.0 | Date formatting (`isToday`, `isYesterday`, `format`) |
| **lucide-react** | ^1.7.0 | Icon library |
| **uuid** | ^13.0.0 | Unique ID generation (optimistic messages) |

---

## 📦 Full Dependency List

### Production Dependencies

| Package | Purpose |
|---|---|
| `react` `react-dom` | Core React library |
| `typescript` | TypeScript language |
| `vite` | Build tool and dev server |
| `@vitejs/plugin-react` | React Fast Refresh plugin for Vite |
| `tailwindcss` | Utility-first CSS framework |
| `@tailwindcss/vite` | Tailwind v4 Vite plugin |
| `tw-animate-css` | Pre-built Tailwind CSS animations |
| `tailwind-merge` | Merge conflicting Tailwind classes (used in `cn()`) |
| `clsx` | Conditional class name construction |
| `class-variance-authority` | Variant-based component styling (CVA, used by Shadcn) |
| `radix-ui` | Headless accessible UI primitives (Shadcn's foundation) |
| `shadcn` | Shadcn/ui CLI and component registry |
| `react-router-dom` | Client-side routing with `<Routes>`, `<Navigate>`, `useParams` |
| `zustand` | Lightweight global state management |
| `axios` | HTTP client with `withCredentials` cookie support |
| `socket.io-client` | WebSocket client for real-time communication |
| `react-hook-form` | Performant form state management |
| `@hookform/resolvers` | Zod + React Hook Form integration via `zodResolver` |
| `zod` | Runtime validation schemas |
| `sonner` | Toast notification system |
| `next-themes` | System-aware light/dark theme |
| `date-fns` | Smart date formatting (`isToday`, `isYesterday`, etc.) |
| `lucide-react` | Open-source icon set as React components |
| `uuid` | Generates `v4` UUIDs for optimistic temp messages |
| `@fontsource-variable/geist` | Geist variable font (Vercel's system font) |

### Dev Dependencies

| Package | Purpose |
|---|---|
| `typescript` | TypeScript compiler |
| `@types/react` `@types/react-dom` | TypeScript types for React |
| `@types/node` | TypeScript types for Node.js APIs (used in vite.config.ts) |
| `eslint` | Code linter |
| `@eslint/js` | ESLint core rules |
| `typescript-eslint` | TypeScript-aware ESLint rules |
| `eslint-plugin-react-hooks` | Linting rules for React hooks |
| `eslint-plugin-react-refresh` | Ensures Vite HMR works correctly |
| `globals` | Global variable definitions for ESLint environments |

---

## 🎨 Shadcn/ui Components

All Shadcn components live in `src/components/ui/`. They are **copy-pasted** (not imported from npm) — fully customizable and owned by the project.

| Component | File | Used For |
|---|---|---|
| **Avatar** | `avatar.tsx` | User profile pictures with fallback initials |
| **Badge** | `badge.tsx` | Unread count indicators, status labels |
| **Button** | `button.tsx` | All interactive buttons (send, submit, ghost, icon variants) |
| **Card** | `card.tsx` | Auth page form containers (sign-in, sign-up) |
| **Checkbox** | `checkbox.tsx` | Group member selection in NewChatPopover |
| **Dialog** | `dialog.tsx` | Chat info modal, image lightbox, delete account confirm |
| **Dropdown Menu** | `drop-down-menu.tsx` | Context menus (sidebar actions, account settings) |
| **Form** | `form.tsx` | `react-hook-form` integration wrapper with labels and error messages |
| **Input** | `input.tsx` | All text input fields |
| **Input Group** | `input-group.tsx` | Search bar with icon addon |
| **Label** | `label.tsx` | Form field labels |
| **Popover** | `popover.tsx` | New Chat popover panel |
| **Sonner** | `sonner.tsx` | Toast notification wrapper (wraps Sonner with theme support) |
| **Spinner** | `spinner.tsx` | Loading indicator for buttons and full-page loading states |
| **Textarea** | `textarea.tsx` | Multi-line text input |

> Additionally: `hamburger-button.tsx` (custom mobile sidebar toggle) and `empty.tsx` (custom empty state component) in the same `ui/` folder.

---

## 🗂️ Folder Structure

```
client/
├── public/
└── src/
    ├── App.tsx              ← Root component: session check, socket connect, route render
    ├── main.tsx             ← React entry point: renders App inside BrowserRouter + ThemeProvider
    ├── assets/              ← Background images, AI assistant avatar
    ├── components/
    │   ├── chat/            ← Core chat UI (header, body, footer, list, messages, popover)
    │   ├── ui/              ← Shadcn/ui component library
    │   ├── sideBar.tsx      ← Vertical icon sidebar (navigation rail)
    │   ├── avatarWithBadge.tsx ← Avatar + online badge + AI/group icon
    │   ├── empty-state.tsx  ← "No chat selected" placeholder
    │   ├── app-wrapper.tsx  ← Layout wrapper: sidebar + main content
    │   ├── theme-provider.tsx ← next-themes provider
    │   └── theme-toggle.tsx ← Dark/light toggle button
    ├── hooks/               ← Zustand stores (useAuth, useChat, useSocket, useChatId, useResizablePanel)
    ├── layouts/             ← AppLayout (resizable panel) + BaseLayout (auth wrapper)
    ├── lib/
    │   ├── axios-client.ts  ← Configured Axios instance (baseURL + credentials)
    │   ├── helper.ts        ← isUserOnline, getOtherUserAndGroup, formatChatTime, generateUUID
    │   ├── navigation.ts    ← Imperative navigate() for use outside React components
    │   └── utils.ts         ← cn() = clsx + tailwind-merge
    ├── pages/
    │   ├── auth/            ← SignIn, SignUp
    │   └── chat/            ← Chat list + SingleChat window
    ├── routes/              ← AppRoutes, RouteGuard, route constants
    └── types/               ← Shared TypeScript interfaces (UserType, ChatType, MessageType)
```

---

## ⚙️ Vite Configuration

```ts
// vite.config.ts
export default defineConfig({
  plugins: [react(), tailwindcss()],  // React Fast Refresh + Tailwind v4 plugin
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") }, // @ → src/
  },
});
```

The `@` path alias means all imports use `@/hooks/useAuth` instead of `../../hooks/useAuth`.

---

## 🔑 Key Architecture Decisions

| Decision | Rationale |
|---|---|
| **Zustand over Context** | Context re-renders all consumers on any state change. Zustand components only re-render when their subscribed slice changes — critical for a real-time app. |
| **Optimistic UI in `sendMessage`** | Messages appear instantly in the UI before the API confirms. Swapped with real data on success, removed on failure. |
| **`httpOnly` cookie auth** | JWT stored server-side in a cookie — immune to XSS theft. `withCredentials: true` on Axios ensures it's sent with every request. |
| **Socket stored in Zustand** | Socket instance accessible from any store action (e.g., `useAuth` connects socket after login) without prop drilling. |
| **Shadcn/ui copy-paste model** | Components live in `src/components/ui/` — fully owned, no version lock, no upstream breaking changes. |
| **React Hook Form + Zod** | Single schema → runtime validation + TypeScript types from `z.infer<>`. No duplicate validation logic. |

# Project Memory: Life OS / Delulu Journal App

## Stack
- Frontend: React 19 + Vite + Tailwind CSS 4, Framer Motion, Lucide React
- Backend: FastAPI + SQLAlchemy + PostgreSQL
- Auth: Google OAuth 2.0 → JWT (stored in localStorage as 'token')
- AI: SentenceTransformer `all-MiniLM-L6-v2` (server-side), @xenova/transformers (client-side)

## Key Architecture
- **3-layer context**: UIContext (navigation/panels) → ThemeContext (accent color) → JournalContext (editor state/CRUD)
- **Autosave**: 2-second debounce in JournalContext; only calls onRefresh() on new entry creation (not on every autosave to avoid flickering)
- **Axios interceptor** in App.jsx adds `Authorization: Bearer <token>` to ALL requests
- **Mobile sidebar**: slide-over with `.mobile-open` class + backdrop overlay; hamburger in `.mobile-header`

## File Structure Notes
- `frontend/src/App.jsx` — root auth, data fetching, delete/folder handlers, mobile sidebar state
- `frontend/src/components/UnifiedSidebar.jsx` — left nav sidebar (280px expanded, 60px collapsed)
- `frontend/src/features/journal/JournalView.jsx` — journal layout wrapper (grid: editor + right panel)
- `frontend/src/features/journal/components/EditorPanel.jsx` — core writing area, mood selector, tags
- `frontend/src/features/journal/context/JournalContext.jsx` — all journal state (editor, habits, tasks, autosave)
- `backend/main.py` — all FastAPI routes
- `backend/models.py` — SQLAlchemy ORM (User, Entry, Habit, Reminder, Task)

## Mobile Breakpoints (added in cleanup session)
- `>1024px`: desktop — sidebar (280px) + editor + right panel (320px)
- `≤1024px`: tablet — sidebar + editor only (right panel hidden)
- `≤768px`: mobile — hamburger + slide-over sidebar + editor only
- `≤480px`: small phone — reduced padding, icon-only right panel tabs

## Common Pitfalls
- Do NOT use `x-token` header (legacy, removed). Auth is via `Authorization: Bearer` only.
- `user_id` on all models is NOT NULL — never create records without current_user
- JournalContext has two separate `isFullscreen` states — one in UIContext (global) and one in JournalContext (editor-local). The editor uses its own.
- Do NOT add `className="editor-main"` to the wrapper in JournalView — EditorPanel applies it itself

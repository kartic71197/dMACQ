# dMACQ Activity Feed

Activity feed app built with MongoDB, Express, React, and Node.js.

## Features

- Create and view activities
- Filter by type with debounce (400ms delay before API call)
- Infinite scroll using cursor-based pagination
- Optimistic UI on create (instant feedback, rollback on failure)
- Tenant isolation via `X-Tenant-Id` header
- Proper loading, empty, and error states

## Project Structure

```
dMACQ/
├── backend/
│   └── src/
│       ├── server.js
│       ├── config/database.js
│       ├── models/Activity.js
│       ├── middleware/tenantIsolation.js
│       └── routes/activities.js
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── services/activityService.js
│       └── components/
│           ├── ActivityFeed.jsx   ← all state lives here
│           ├── ActivityItem.jsx
│           ├── ActivityFilter.jsx
│           └── ActivityForm.jsx
└── package.json
```

## Setup

### 1. Install dependencies

**Backend** (open a terminal in the `backend` folder)
```bash
cd backend
npm install
```

**Frontend** (open a terminal in the `frontend` folder)
```bash
cd frontend
npm install
```

### 2. Environment

Create a `.env` file inside the `backend` folder and add:

```env
PORT=5000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dmacq-activity
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### 3. Run

**Backend**
```bash
cd backend
npm run dev
```

**Frontend** (in a separate terminal)
```bash
cd frontend
npm run dev
```

- Backend → http://localhost:5000
- Frontend → http://localhost:5173

## API

**Headers required on every request**
```
X-Tenant-Id: your-tenant-id
```

**POST /api/activities**
```json
{
  "actorId": "user-1",
  "actorName": "John Doe",
  "type": "CREATE",
  "entityId": "doc-123"
}
```

**GET /api/activities**
```
?limit=20&cursor=<ISO_DATE>&type=CREATE
```

Returns:
```json
{
  "activities": [],
  "nextCursor": "2026-04-25T10:00:00.000Z",
  "count": 20
}
```

## Frontend State

All state is managed directly in `ActivityFeed.jsx` using `useState`, `useEffect`, and `useCallback`. No Redux, no custom hooks.

| State | Purpose |
|-------|---------|
| `activities` | list of activity items |
| `cursor` | ISO date of last fetched item for pagination |
| `hasMore` | whether more pages exist |
| `loading` | shows spinner during fetch |
| `error` | shows error banner on failed fetch |
| `filter` | selected activity type filter |

## Deployment

| Part | Host |
|------|------|
| Frontend | Vercel — root directory: `frontend` |
| Backend | Render — root directory: `backend` |
| Database | MongoDB Atlas |

**Vercel env vars**
```
VITE_API_URL=https://your-backend.onrender.com/api
```

**Render env vars**
```
MONGODB_URI=your atlas uri
CORS_ORIGIN=https://your-app.vercel.app
NODE_ENV=production
```

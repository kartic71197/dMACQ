# dMACQ Activity Feed

A scalable Activity Feed system built using the MERN stack (MongoDB, Express, React, Node.js), designed with performance, multi-tenancy, and real-world UX patterns in mind.

---

## Overview

This application allows users to create and view activity logs with:

High-performance data fetching
Tenant-based data isolation
Smooth user experience using optimistic updates
Scalable pagination using cursors

---

## Key Features

### Smart UX

Optimistic UI updates (instant feedback, rollback on failure)
Debounced filtering (400ms delay to reduce API calls)
Proper handling of loading, error, and empty states

### Performance & Scalability

Cursor-based pagination (better than offset for large datasets)
Infinite scrolling
Efficient MongoDB querying

### Multi-Tenancy

Strict tenant isolation using `X-Tenant-Id`
Prevents cross-tenant data leakage at middleware level

---

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
│
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── services/activityService.js
│       └── components/
│           ├── ActivityFeed.jsx
│           ├── ActivityItem.jsx
│           ├── ActivityFilter.jsx
│           └── ActivityForm.jsx
│
└── package.json
```

---

## Setup Instructions

### 1. Install Dependencies

**Backend**

```bash
cd backend
npm install
```

**Frontend**

```bash
cd frontend
npm install
```

---

### 2. Environment Variables

Create a `.env` file inside `/backend`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dmacq-activity
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

---

### 3. Run the Application

**Start Backend**

```bash
cd backend
npm run dev
```

**Start Frontend**

```bash
cd frontend
npm run dev
```

---

## Local URLs

Frontend: [http://localhost:5173](http://localhost:5173)
Backend: [http://localhost:5000](http://localhost:5000)

---

## API Documentation

### Headers (Required)

```
X-Tenant-Id: <tenant-id>
```

---

### Create Activity

**POST /api/activities**

```json
{
  "actorId": "user-1",
  "actorName": "John Doe",
  "type": "CREATE",
  "entityId": "doc-123"
}
```

---

### Fetch Activities

**GET /api/activities**

Query Params:

```
limit=20
cursor=<ISO_DATE>
type=CREATE
```

Response:

```json
{
  "activities": [],
  "nextCursor": "2026-04-25T10:00:00.000Z",
  "count": 20
}
```

---

## Frontend State Management

All state is handled locally in `ActivityFeed.jsx` using React hooks (`useState`, `useEffect`, `useCallback`).

| State      | Description                         |
| ---------- | ----------------------------------- |
| activities | List of activity items              |
| cursor     | Pagination cursor (ISO timestamp)   |
| hasMore    | Indicates if more data is available |
| loading    | Controls loading spinner            |
| error      | Handles API errors                  |
| filter     | Selected activity type              |

No Redux or external state libraries are used to keep the architecture simple and efficient.

---

## Deployment

| Component | Platform      |
| --------- | ------------- |
| Frontend  | Vercel        |
| Backend   | Render        |
| Database  | MongoDB Atlas |

---

### Vercel Environment Variables

```
VITE_API_URL=https://your-backend.onrender.com/api
```

### Render Environment Variables

```
MONGODB_URI=your_mongodb_uri
CORS_ORIGIN=https://your-frontend.vercel.app
NODE_ENV=production
```

---

## Design Decisions

Cursor pagination over offset to avoid performance issues at scale
Tenant ID via headers to prevent tampering via URL or request body
Optimistic UI to improve perceived performance
Centralized state in ActivityFeed for simpler debugging and flow

---

## Author

Kartic Malhotra
Full-Stack Developer (MERN + Laravel)

---

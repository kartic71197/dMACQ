const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const activityRoutes = require('./routes/activities');

// Load .env before anything else reads process.env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB — exits the process on failure (process manager will restart)
connectDB();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------

// CORS: allow only the configured frontend origin (not *)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  })
);

// Parse JSON request bodies (built-in since Express 4.16)
app.use(express.json());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.use('/api/activities', activityRoutes);

// Health check — used by load balancer or process monitor
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// 404 catch-all
app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }));

// Global error handler — Express calls this when next(err) is invoked
app.use((err, _req, res, _next) => {
  console.error('[Unhandled error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
});

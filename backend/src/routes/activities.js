const express = require('express');
const Activity = require('../models/Activity');
const tenantIsolation = require('../middleware/tenantIsolation');

const router = express.Router();

// Apply tenant isolation to every route in this file.
// Any request without a valid X-Tenant-Id header is rejected before reaching handlers.
router.use(tenantIsolation);

// ---------------------------------------------------------------------------
// POST /api/activities
// Creates a new activity for the authenticated tenant.
//
// High write throughput notes:
//   - We use save() over insertOne() to run Mongoose validators
//   - .lean() is used on reads (below), not writes, so no overhead here
//   - The compound index does not block writes; MongoDB updates indexes async
//   - For extreme throughput: consider bulk inserts via Model.insertMany()
//     with { ordered: false } so a single invalid doc doesn't halt the batch
// ---------------------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { actorId, actorName, type, entityId, metadata } = req.body;

    if (!actorId || !actorName || !type || !entityId) {
      return res.status(400).json({
        error: 'actorId, actorName, type, and entityId are required.',
      });
    }

    const activity = new Activity({
      tenantId: req.tenantId, 
      actorId,
      actorName,
      type,
      entityId,
      metadata: metadata || {},
      createdAt: new Date(),
    });

    const saved = await activity.save();

    // 201 Created with the persisted document including server-generated _id
    res.status(201).json(saved.toObject());
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    console.error('[POST /activities]', err);
    res.status(500).json({ error: 'Failed to create activity.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/activities?cursor=<ISO_DATE>&limit=20&type=<TYPE>
//
// Cursor-based pagination (Task 2 — why NOT skip/offset):
//
//   skip(n) forces MongoDB to scan and discard n documents before returning
//   results. On page 100 with limit 20, that's a scan of 2 000 documents —
//   O(n) cost. Even with an index the node visits each skipped entry to count.
//
//   Cursor pagination instead uses the compound index to jump directly to the
//   document after the cursor: { createdAt: { $lt: cursor } }. The index
//   locates that position in O(log n) then streams forward — cost is constant
//   regardless of page depth. Cursors are also stable under concurrent inserts
//   (a new document never shifts positions), whereas offset pagination drifts.
//
// Index used: { tenantId: 1, createdAt: -1 } (defined on the Activity model)
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const { cursor, limit = 10, type } = req.query;
    console.log("Current Cursor: ",cursor);

    // Cap page size to prevent runaway queries
    const parsedLimit = Math.min(parseInt(limit, 10) || 10, 100);

    // tenantId is always the leading equality filter — this uses the index prefix
    const query = { tenantId: req.tenantId };

    // Cursor: return only documents strictly older than the cursor timestamp.
    // The client sends the createdAt of the last item it received.
    if (cursor) {
      const cursorDate = new Date(cursor);
      if (Number.isNaN(cursorDate.getTime())) {
        return res.status(400).json({ error: 'Invalid cursor. Expected ISO date string.' });
      }
      query.createdAt = { $lt: cursorDate };
    }

    // Optional type filter — uses secondary index { tenantId, type, createdAt }
    if (type) {
      query.type = type;
    }

    // Projection: fetch only fields the UI needs — reduces wire size and memory
    const projection = '_id tenantId actorId actorName type entityId metadata createdAt';

    const activities = await Activity.find(query)
      .sort({ createdAt: -1 }) // newest first
      .limit(parsedLimit)
      .select(projection)
      .lean(); // lean() returns plain JS objects — ~2× faster than Mongoose docs

    // Next cursor: createdAt of the last returned item.
    // null signals the client that there are no more pages.
    const nextCursor =
      activities.length === parsedLimit
        ? activities[activities.length - 1].createdAt.toISOString()
        : null;

    res.json({ activities, nextCursor, count: activities.length });
  } catch (err) {
    console.error('[GET /activities]', err);
    res.status(500).json({ error: 'Failed to fetch activities.' });
  }
});

// ---------------------------------------------------------------------------
// Performance metrics to monitor (Task 2):
//   - explain().executionStats.totalDocsExamined should equal nReturned (1:1 ratio)
//   - mongostat: query/s, insert/s, conn count
//   - Atlas Performance Advisor: flags missing indexes and slow queries (> 100ms)
//   - Application-level: P95/P99 response time, error rate per tenant
// ---------------------------------------------------------------------------

module.exports = router;

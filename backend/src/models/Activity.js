const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    // tenantId is always the first filter — placed first in all compound indexes
    tenantId: { type: String, required: true },

    actorId: { type: String, required: true },
    actorName: { type: String, required: true },

    // Enum enforces a known set of event types at the DB layer
    type: {
      type: String,
      required: true,
      enum: ['CREATE', 'UPDATE', 'DELETE', 'COMMENT', 'SHARE', 'LOGIN', 'LOGOUT'],
    },

    // entityId references the object this activity happened on (doc, task, etc.)
    entityId: { type: String, required: true },

    // Mixed allows any shape of extra data without schema migration
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Explicit timestamp — not auto-generated, so we control precision
    // and can set it server-side for idempotent replays
    createdAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false, // suppress __v field in documents
    timestamps: false, // we manage createdAt manually above
  }
);

// PRIMARY index — supports both tenant isolation and cursor-based pagination.
// Query pattern: { tenantId: X, createdAt: { $lt: <cursor> } } ORDER BY createdAt DESC
// Rule of thumb: equality fields (tenantId) come before range fields (createdAt).
activitySchema.index({ tenantId: 1, createdAt: -1 });

// SECONDARY index — supports type filtering within a tenant.
// Used when the GET /activities?type=<TYPE> query parameter is provided.
activitySchema.index({ tenantId: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);

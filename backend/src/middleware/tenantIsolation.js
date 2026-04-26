// Tenant isolation middleware.
// Every route that uses this middleware is automatically scoped to a single tenant.
// tenantId comes from a request header — never from the URL or request body —
// so clients cannot access another tenant's data by guessing an ID.

function tenantIsolation(req, res, next) {
  const tenantId = req.headers['x-tenant-id'];

  if (!tenantId) {
    return res.status(401).json({
      error: 'Missing X-Tenant-Id header. Tenant isolation is mandatory.',
    });
  }

  // Allow only alphanumeric, hyphens, and underscores to prevent NoSQL injection
  if (!/^[a-zA-Z0-9_-]+$/.test(tenantId)) {
    return res.status(400).json({ error: 'Invalid tenant ID format.' });
  }

  // Attach to request — downstream handlers read req.tenantId and never trust the body
  req.tenantId = tenantId;
  next();
}

module.exports = tenantIsolation;

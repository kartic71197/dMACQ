// In dev: Vite proxy forwards /api to localhost:5000
// In production: VITE_API_URL points to the deployed backend (e.g. Render)
const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Fetch a page of activities for a tenant.
 *
 * @param {string} tenantId - Sent as a header, never in the URL, to avoid logging
 * @param {string|null} cursor - ISO date of the last item from the previous page
 * @param {number} limit - Page size (backend caps at 100)
 * @param {string} type - Optional activity type filter
 * @param {AbortSignal} [signal] - AbortController signal for request cancellation
 */
export async function fetchActivitiesAPI(
  tenantId,
  cursor = null,
  limit = 20,
  type = '',
  signal = undefined
) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.append('cursor', cursor);
  if (type) params.append('type', type);

  const response = await fetch(`${API_BASE}/activities?${params}`, {
    headers: { 'X-Tenant-Id': tenantId },
    signal, // allows the caller to cancel the request (e.g. on filter change)
  });

  if (!response.ok) {
    // Try to parse the error body; fall back to a generic message
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${response.status}`);
  }

  // { activities: Activity[], nextCursor: string | null, count: number }
  return response.json();
}

/**
 * Create a new activity.
 * The optimistic UI layer in useActivityFeed calls this after prepending a
 * temporary item, then swaps it with the real document on success.
 *
 * @param {Object} data - Activity payload including tenantId
 */
export async function createActivityAPI(data) {
  const { tenantId, ...body } = data;

  const response = await fetch(`${API_BASE}/activities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': tenantId,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  return response.json(); // the persisted Activity document
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchActivitiesAPI, createActivityAPI } from '../services/activityService';
import ActivityItem from './ActivityItem';
import ActivityForm from './ActivityForm';
import ActivityFilter from './ActivityFilter';

const ACTIVITY_TYPES = ['CREATE', 'UPDATE', 'DELETE', 'COMMENT', 'SHARE', 'LOGIN', 'LOGOUT'];

export default function ActivityFeed({ tenantId }) {
  const [activities, setActivities] = useState([]);
  const [cursor, setCursor]         = useState(null);
  const [hasMore, setHasMore]       = useState(true);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [filter, setFilter]         = useState('');

  const loadingRef  = useRef(false);
  const sentinelRef = useRef(null);

  // Fetch a page — all dynamic values passed as args to avoid stale closures
  const fetchPage = useCallback(
    async (cursorValue, filterValue, append) => {
      if (loadingRef.current && append) return;
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const data = await fetchActivitiesAPI(tenantId, cursorValue, 20, filterValue);
        setActivities(prev => append ? [...prev, ...data.activities] : data.activities);
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      } catch (err) {
        setError(err.message || 'Failed to load activities.');
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [tenantId]
  );

  // Re-fetch from scratch on filter or tenant change
  useEffect(() => {
    fetchPage(null, filter, false);
  }, [filter, tenantId, fetchPage]);

  // Load next page — triggered by IntersectionObserver
  const loadMore = useCallback(() => {
    if (!hasMore || loadingRef.current) return;
    fetchPage(cursor, filter, true);
  }, [cursor, filter, hasMore, fetchPage]);

  // Infinite scroll — watches the sentinel div at the bottom of the list
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1, rootMargin: '120px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // Optimistic create — prepend temp item, swap with real doc on success, rollback on failure
  const addActivity = useCallback(
    async (formData) => {
      const tempId = `opt-${Date.now()}`;
      setActivities(prev => [
        { _id: tempId, ...formData, tenantId, createdAt: new Date().toISOString(), isOptimistic: true },
        ...prev,
      ]);
      try {
        const created = await createActivityAPI({ ...formData, tenantId });
        setActivities(prev =>
          prev.map(a => a._id === tempId ? { ...created, isOptimistic: false } : a)
        );
      } catch (err) {
        setActivities(prev => prev.filter(a => a._id !== tempId));
        throw err;
      }
    },
    [tenantId]
  );

  return (
    <div className="activity-feed">
      <h2>Activity Feed</h2>

      <ActivityForm onSubmit={addActivity} />

      <ActivityFilter types={ACTIVITY_TYPES} selected={filter} onSelect={setFilter} />

      {error && <div className="error" role="alert">Error: {error}</div>}

      <div className="activity-list">
        {activities.map(activity => (
          <ActivityItem key={activity._id} activity={activity} />
        ))}

        {loading && <div className="loading">Loading activities</div>}

        {!loading && activities.length === 0 && (
          <div className="empty">
            <p>No activities found.</p>
            <p>Try a different filter or create one above.</p>
          </div>
        )}

        <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />

        {!hasMore && activities.length > 0 && (
          <div className="end">You&apos;ve reached the end of the feed.</div>
        )}
      </div>
    </div>
  );
}

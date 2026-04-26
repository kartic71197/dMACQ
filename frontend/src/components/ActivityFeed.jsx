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
        // On filter change errors, don't wipe existing activities — just show the banner
        if (!append) setActivities([]);
        setError(err.message || 'Failed to load activities.');
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [tenantId]
  );

  // Debounce filter changes by 400ms — shows spinner immediately, fires API after delay
  useEffect(() => {
    setLoading(true);  // spinner shows right away on filter click
    setError(null);

    const timer = setTimeout(() => {
      fetchPage(null, filter, false);
    }, 400);

    return () => clearTimeout(timer); // cancel if filter changes again within 400ms
  }, [filter, tenantId, fetchPage]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingRef.current) return;
    fetchPage(cursor, filter, true);
  }, [cursor, filter, hasMore, fetchPage]);

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

      {/* Only show error banner when not loading — avoids flash of error during fetch */}
      {error && !loading && (
        <div className="error" role="alert">
          Failed to load activities. Please try again.
        </div>
      )}

      <div className="activity-list">
        {activities.map(activity => (
          <ActivityItem key={activity._id} activity={activity} />
        ))}

        {loading && <div className="loading">Loading activities</div>}

        {/* Empty state: only when done loading, no error, and no results */}
        {!loading && !error && activities.length === 0 && (
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

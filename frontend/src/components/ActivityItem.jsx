export default function ActivityItem({ activity }) {
  return (
    <div className={`activity-item${activity.isOptimistic ? ' optimistic' : ''}`}>
      <div className="activity-header">
        <span className="actor">{activity.actorName}</span>
        <span className={`type type-${activity.type?.toLowerCase()}`}>{activity.type}</span>
        <span className="date">{new Date(activity.createdAt).toLocaleString()}</span>
      </div>

      <div className="activity-entity">Entity: {activity.entityId}</div>

      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
        <div className="activity-meta">{JSON.stringify(activity.metadata)}</div>
      )}

      {activity.isOptimistic && <span className="optimistic-badge">Sending…</span>}
    </div>
  );
}

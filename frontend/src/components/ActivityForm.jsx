import { useState, useCallback } from 'react';

const ACTIVITY_TYPES = ['CREATE', 'UPDATE', 'DELETE', 'COMMENT', 'SHARE', 'LOGIN', 'LOGOUT'];

export default function ActivityForm({ onSubmit }) {
  const [actorId, setActorId]     = useState('');
  const [actorName, setActorName] = useState('');
  const [type, setType]           = useState('CREATE');
  const [entityId, setEntityId]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setSubmitting(true);
      setSubmitError(null);

      try {
        // onSubmit applies optimistic update then calls API.
        // It throws on failure — we catch to show error; rollback already done in parent.
        await onSubmit({ actorId, actorName, type, entityId });
        setActorId('');
        setActorName('');
        setEntityId('');
      } catch {
        setSubmitError('Failed to create activity. Changes have been reverted.');
      } finally {
        setSubmitting(false);
      }
    },
    [actorId, actorName, type, entityId, onSubmit]
  );

  return (
    <form className="activity-form" onSubmit={handleSubmit}>
      <input
        placeholder="Actor ID"
        value={actorId}
        onChange={e => setActorId(e.target.value)}
        required
        disabled={submitting}
      />
      <input
        placeholder="Actor Name"
        value={actorName}
        onChange={e => setActorName(e.target.value)}
        required
        disabled={submitting}
      />
      <select value={type} onChange={e => setType(e.target.value)} disabled={submitting}>
        {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <input
        placeholder="Entity ID"
        value={entityId}
        onChange={e => setEntityId(e.target.value)}
        required
        disabled={submitting}
      />

      {submitError && <div className="form-error" role="alert">{submitError}</div>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Creating…' : 'Create Activity'}
      </button>
    </form>
  );
}

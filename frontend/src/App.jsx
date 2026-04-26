import ActivityFeed from './components/ActivityFeed';
import './index.css';

// In production this would come from an auth context / JWT claim.
// Hardcoded here for demo purposes.
const TENANT_ID = 'tenant-demo-001';

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>dMACQ Activity Feed</h1>
        <span className="tenant-badge">Tenant: {TENANT_ID}</span>
      </header>
      <main>
        <ActivityFeed tenantId={TENANT_ID} />
      </main>
    </div>
  );
}

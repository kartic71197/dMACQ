export default function ActivityFilter({ types, selected, onSelect }) {
  return (
    <div className="activity-filter" role="group" aria-label="Filter by type">
      <button
        className={`filter-btn ${!selected ? 'active' : ''}`}
        onClick={() => onSelect('')}
      >
        All
      </button>

      {types.map(type => (
        <button
          key={type}
          className={`filter-btn ${selected === type ? 'active' : ''}`}
          onClick={() => onSelect(selected === type ? '' : type)}
        >
          {type}
        </button>
      ))}
    </div>
  );
}

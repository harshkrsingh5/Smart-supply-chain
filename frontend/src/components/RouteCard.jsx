import RiskBadge from './RiskBadge';
import './RouteCard.css';

export default function RouteCard({ route, selected, onSelect }) {
  return (
    <div className={`route-card ${selected ? 'route-card--selected' : ''}`} onClick={() => onSelect?.(route.id)}>
      <div className="route-card-header">
        <div className="route-card-name">
          <span className="route-type-dot" style={{ background: route.type === 'primary' ? '#3b82f6' : route.type === 'alternate' ? '#f59e0b' : '#8b5cf6' }}></span>
          {route.name}
        </div>
        <RiskBadge level={route.riskLevel} score={route.riskScore} />
      </div>

      <p className="route-card-summary">{route.summary}</p>

      <div className="route-card-stats">
        <div className="route-stat">
          <span className="route-stat-icon">📏</span>
          <span className="route-stat-value">{route.distance}</span>
          <span className="route-stat-label">Distance</span>
        </div>
        <div className="route-stat">
          <span className="route-stat-icon">⏱️</span>
          <span className="route-stat-value">{route.duration}</span>
          <span className="route-stat-label">ETA</span>
        </div>
        <div className="route-stat">
          <span className="route-stat-icon">💰</span>
          <span className="route-stat-value">{route.totalCost}</span>
          <span className="route-stat-label">Total Cost</span>
        </div>
      </div>

      <div className="route-card-highlights">
        {route.highlights?.map((h, i) => (
          <span key={i} className="route-highlight">{h}</span>
        ))}
      </div>

      {selected && (
        <div className="route-card-selected-badge">✓ Selected</div>
      )}
    </div>
  );
}

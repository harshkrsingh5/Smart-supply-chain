import './StatsCard.css';

export default function StatsCard({ icon, label, value, subValue, color = 'blue', trend }) {
  return (
    <div className={`stats-card stats-card--${color}`}>
      <div className="stats-card-icon">{icon}</div>
      <div className="stats-card-content">
        <span className="stats-card-value">{value}</span>
        <span className="stats-card-label">{label}</span>
        {subValue && <span className="stats-card-sub">{subValue}</span>}
      </div>
      {trend && (
        <div className={`stats-card-trend ${trend > 0 ? 'up' : 'down'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}

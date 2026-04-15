import './RiskBadge.css';

export default function RiskBadge({ level, score, showScore = true }) {
  const config = {
    LOW:    { label: 'Low Risk',    className: 'risk-low',    emoji: '🟢' },
    MEDIUM: { label: 'Medium Risk', className: 'risk-medium', emoji: '🟡' },
    HIGH:   { label: 'High Risk',   className: 'risk-high',   emoji: '🔴' },
  };

  const { label, className, emoji } = config[level] || config.MEDIUM;

  return (
    <span className={`risk-badge ${className}`}>
      <span className="risk-dot">{emoji}</span>
      {showScore && score !== undefined && <span className="risk-score">{score}</span>}
      <span className="risk-label">{label}</span>
    </span>
  );
}

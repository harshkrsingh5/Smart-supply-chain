import { useEffect, useState } from 'react';
import './AlertBanner.css';

export default function AlertBanner({ alerts = [], onAcknowledge }) {
  const [visible, setVisible] = useState(true);
  const unacked = alerts.filter(a => !a.acknowledged);
  const highPriority = unacked.filter(a => a.severity === 'HIGH');

  if (!visible || unacked.length === 0) return null;

  const topAlert = highPriority[0] || unacked[0];

  return (
    <div className={`alert-banner alert-banner--${topAlert.severity?.toLowerCase()}`}>
      <div className="alert-banner-content">
        <span className="alert-banner-icon">
          {topAlert.severity === 'HIGH' ? '🚨' : topAlert.severity === 'MEDIUM' ? '⚠️' : 'ℹ️'}
        </span>
        <div className="alert-banner-text">
          <strong>{topAlert.type}</strong> — {topAlert.message}
        </div>
        {unacked.length > 1 && (
          <span className="alert-banner-count">+{unacked.length - 1} more</span>
        )}
      </div>
      <div className="alert-banner-actions">
        {onAcknowledge && (
          <button className="btn btn-sm btn-secondary" onClick={() => onAcknowledge(topAlert.id)}>
            Acknowledge
          </button>
        )}
        <button className="alert-banner-close" onClick={() => setVisible(false)}>✕</button>
      </div>
    </div>
  );
}

import { createPortal } from 'react-dom';
import './TransportModal.css';

export default function TransportModal({ data, onClose }) {
  if (!data) return null;

  const { options, recommendation } = data;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🚛 Multi-Modal Transport Options</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="transport-grid">
          {options.map(opt => (
            <div key={opt.mode} className={`transport-option ${recommendation?.cheapest === opt.mode ? 'transport--recommended' : ''}`}>
              <div className="transport-header">
                <span className="transport-icon">{opt.icon}</span>
                <div>
                  <h3 className="transport-name">{opt.name}</h3>
                  <span className="transport-freq">{opt.frequency}</span>
                </div>
                {recommendation?.cheapest === opt.mode && (
                  <span className="transport-tag tag-cheapest">💰 Cheapest</span>
                )}
                {recommendation?.fastest === opt.mode && (
                  <span className="transport-tag tag-fastest">⚡ Fastest</span>
                )}
              </div>

              <div className="transport-stats">
                <div className="transport-stat">
                  <span className="ts-label">Est. Time</span>
                  <span className="ts-value">{opt.estimatedTime}</span>
                </div>
                <div className="transport-stat">
                  <span className="ts-label">Est. Cost</span>
                  <span className="ts-value">{opt.estimatedCost}</span>
                </div>
                <div className="transport-stat">
                  <span className="ts-label">CO₂</span>
                  <span className="ts-value">{opt.co2}</span>
                </div>
              </div>

              <p className="transport-details">{opt.details}</p>

              <div className="transport-pros-cons">
                <div className="transport-pros">
                  {opt.advantages?.map((a, i) => (
                    <span key={i} className="pro-item">✅ {a}</span>
                  ))}
                </div>
                <div className="transport-cons">
                  {opt.disadvantages?.map((d, i) => (
                    <span key={i} className="con-item">⚠️ {d}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

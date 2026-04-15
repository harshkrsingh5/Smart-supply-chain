import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getShipments, getAlerts, acknowledgeAlert, getMonitorData, getTrucks, addTruck, deleteTruck } from '../services/api';
import StatsCard from '../components/StatsCard';
import RiskBadge from '../components/RiskBadge';
import AlertBanner from '../components/AlertBanner';
import RiskGauge from '../components/RiskGauge';
import MapView from '../components/MapView';
import './ManagerDashboard.css';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [stats, setStats] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [alertStats, setAlertStats] = useState({});
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [monitorData, setMonitorData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Truck fleet state
  const [trucks, setTrucks] = useState([]);
  const [truckStats, setTruckStats] = useState({});
  const [showAddTruck, setShowAddTruck] = useState(false);
  const [truckForm, setTruckForm] = useState({ truckNumber: '', driverName: '', truckType: 'Medium', capacity: '' });
  const [truckFormError, setTruckFormError] = useState('');
  const [truckFormSuccess, setTruckFormSuccess] = useState('');
  const [addingTruck, setAddingTruck] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [shipData, alertData, truckData] = await Promise.all([getShipments(), getAlerts(), getTrucks()]);
      setShipments(shipData.shipments);
      setStats(shipData.stats);
      setAlerts(alertData.alerts);
      setAlertStats(alertData.stats);
      setTrucks(truckData.trucks);
      setTruckStats(truckData.stats);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Poll for live data
  useEffect(() => {
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Monitor selected shipment
  useEffect(() => {
    if (!selectedShipment) return;
    const fetchMonitor = async () => {
      try {
        const data = await getMonitorData(selectedShipment);
        setMonitorData(data);
      } catch (err) { console.error('Monitor error:', err); }
    };
    fetchMonitor();
    const interval = setInterval(fetchMonitor, 5000);
    return () => clearInterval(interval);
  }, [selectedShipment]);

  const handleAcknowledge = async (alertId) => {
    try {
      await acknowledgeAlert(alertId);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleAddTruck = async (e) => {
    e.preventDefault();
    setTruckFormError('');
    setTruckFormSuccess('');

    if (!truckForm.truckNumber.trim() || !truckForm.driverName.trim()) {
      setTruckFormError('Truck number and driver name are required.');
      return;
    }

    setAddingTruck(true);
    try {
      const result = await addTruck({
        truckNumber: truckForm.truckNumber.trim(),
        driverName: truckForm.driverName.trim(),
        truckType: truckForm.truckType,
        capacity: truckForm.capacity.trim() || '5,000 kg'
      });
      setTruckFormSuccess(`🚛 ${result.truck.truckNumber} added successfully!`);
      setTruckForm({ truckNumber: '', driverName: '', truckType: 'Medium', capacity: '' });
      fetchData();
      setTimeout(() => {
        setShowAddTruck(false);
        setTruckFormSuccess('');
      }, 1500);
    } catch (err) {
      setTruckFormError(err.response?.data?.error || 'Failed to add truck.');
    } finally {
      setAddingTruck(false);
    }
  };

  const handleDeleteTruck = async (truckId, truckNumber) => {
    if (!window.confirm(`Remove truck ${truckNumber} from fleet?`)) return;
    try {
      await deleteTruck(truckId);
      fetchData();
    } catch (err) {
      console.error('Delete truck error:', err);
    }
  };

  if (loading) {
    return <div className="loader-wrapper"><div className="loader"></div><span>Loading dashboard...</span></div>;
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Manager Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back, {user?.name} • Real-time logistics overview</p>
        </div>
        <div className="dashboard-live">
          <span className="live-dot"></span> Live Monitoring
        </div>
      </div>

      <AlertBanner alerts={alerts} onAcknowledge={handleAcknowledge} />

      {/* Stats cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatsCard icon="📦" label="Total Shipments" value={stats.total || 0} color="blue" subValue={`${stats.inTransit || 0} in transit`} />
        <StatsCard icon="🔴" label="High Risk" value={stats.highRisk || 0} color="red" subValue="Needs attention" />
        <StatsCard icon="🟡" label="Medium Risk" value={stats.mediumRisk || 0} color="yellow" subValue="Monitoring" />
        <StatsCard icon="🟢" label="Low Risk" value={stats.lowRisk || 0} color="green" subValue="On track" />
      </div>

      {/* Fleet Management Section */}
      <div className="card fleet-section" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="fleet-header-left">
            <h3>🚛 Fleet Management</h3>
            <div className="fleet-stats-inline">
              <span className="fleet-stat-chip fleet-stat-total">{truckStats.total || 0} total</span>
              <span className="fleet-stat-chip fleet-stat-available">{truckStats.available || 0} available</span>
              <span className="fleet-stat-chip fleet-stat-transit">{truckStats.inTransit || 0} in transit</span>
              {(truckStats.maintenance || 0) > 0 && (
                <span className="fleet-stat-chip fleet-stat-maint">{truckStats.maintenance} maintenance</span>
              )}
            </div>
          </div>
          <button className="btn btn-primary btn-add-truck" onClick={() => { setShowAddTruck(true); setTruckFormError(''); setTruckFormSuccess(''); }}>
            <span className="btn-icon">+</span> Add Truck
          </button>
        </div>

        <div className="table-container fleet-table-container">
          <table>
            <thead>
              <tr>
                <th>Truck Number</th>
                <th>Driver Name</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {trucks.map((t, i) => (
                <tr key={t.id} className="fleet-row" style={{ animationDelay: `${i * 0.05}s` }}>
                  <td>
                    <div className="truck-number-cell">
                      <span className="truck-icon-badge">🚛</span>
                      <span className="truck-number-text">{t.truckNumber}</span>
                    </div>
                  </td>
                  <td>
                    <div className="driver-cell">
                      <span className="driver-avatar">{t.driverName.split(' ').map(n => n[0]).join('')}</span>
                      <span>{t.driverName}</span>
                    </div>
                  </td>
                  <td><span className={`truck-type-badge truck-type-${t.truckType?.toLowerCase()}`}>{t.truckType}</span></td>
                  <td><span className="capacity-text">{t.capacity}</span></td>
                  <td>
                    <span className={`truck-status-tag truck-status-${t.status?.toLowerCase().replace(/\s/g, '-')}`}>
                      {t.status === 'Available' && '🟢 '}
                      {t.status === 'In Transit' && '🔵 '}
                      {t.status === 'Maintenance' && '🟠 '}
                      {t.status}
                    </span>
                  </td>
                  <td><span className="date-text">{new Date(t.addedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></td>
                  <td>
                    <button
                      className="btn btn-sm btn-danger fleet-delete-btn"
                      onClick={() => handleDeleteTruck(t.id, t.truckNumber)}
                      title="Remove truck"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
              {trucks.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No trucks in fleet. Add your first truck!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Truck Modal */}
      {showAddTruck && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAddTruck(false); }}>
          <div className="modal-content add-truck-modal animate-fade-in">
            <div className="modal-header">
              <div className="modal-header-icon">🚛</div>
              <h2>Add New Truck</h2>
              <p className="modal-subtitle">Register a truck to your logistics fleet</p>
              <button className="modal-close" onClick={() => setShowAddTruck(false)}>✕</button>
            </div>

            <form onSubmit={handleAddTruck} className="truck-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="label" htmlFor="truckNumber">
                    <span className="label-icon">🔢</span> Truck Number <span className="required">*</span>
                  </label>
                  <input
                    id="truckNumber"
                    className="input"
                    type="text"
                    placeholder="e.g. MH-14-XY-9999"
                    value={truckForm.truckNumber}
                    onChange={(e) => setTruckForm({ ...truckForm, truckNumber: e.target.value })}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="label" htmlFor="driverName">
                    <span className="label-icon">👤</span> Driver Name <span className="required">*</span>
                  </label>
                  <input
                    id="driverName"
                    className="input"
                    type="text"
                    placeholder="e.g. Rajesh Sharma"
                    value={truckForm.driverName}
                    onChange={(e) => setTruckForm({ ...truckForm, driverName: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="label" htmlFor="truckType">
                    <span className="label-icon">📏</span> Truck Type
                  </label>
                  <select
                    id="truckType"
                    className="input"
                    value={truckForm.truckType}
                    onChange={(e) => setTruckForm({ ...truckForm, truckType: e.target.value })}
                  >
                    <option value="Light">Light (Up to 3.5 ton)</option>
                    <option value="Medium">Medium (3.5 – 7.5 ton)</option>
                    <option value="Heavy">Heavy (7.5+ ton)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label" htmlFor="capacity">
                    <span className="label-icon">⚖️</span> Capacity
                  </label>
                  <input
                    id="capacity"
                    className="input"
                    type="text"
                    placeholder="e.g. 8,000 kg"
                    value={truckForm.capacity}
                    onChange={(e) => setTruckForm({ ...truckForm, capacity: e.target.value })}
                  />
                </div>
              </div>

              {truckFormError && <div className="form-error animate-fade-in">{truckFormError}</div>}
              {truckFormSuccess && <div className="form-success animate-fade-in">{truckFormSuccess}</div>}

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddTruck(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-lg" disabled={addingTruck}>
                  {addingTruck ? (
                    <><div className="btn-spinner"></div> Adding...</>
                  ) : (
                    <>🚛 Add to Fleet</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Shipment table */}
        <div className="card dashboard-shipments">
          <div className="card-header">
            <h3>Active Shipments</h3>
            <span className="badge badge-info">{shipments.length} active</span>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tracking ID</th>
                  <th>Route</th>
                  <th>Cargo</th>
                  <th>Driver</th>
                  <th>Status</th>
                  <th>Risk</th>
                  <th>ETA</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {shipments.map(s => (
                  <tr key={s.id} className={selectedShipment === s.id ? 'row-selected' : ''}>
                    <td><span className="tracking-id">{s.trackingId}</span></td>
                    <td className="route-cell">{s.origin} → {s.destination}</td>
                    <td>{s.cargo}</td>
                    <td>{s.driver}</td>
                    <td>
                      <span className={`status-tag status-${s.status?.toLowerCase().replace(/\s/g, '-')}`}>
                        {s.status}
                      </span>
                    </td>
                    <td><RiskBadge level={s.riskLevel} score={s.riskScore} /></td>
                    <td>{s.eta}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setSelectedShipment(selectedShipment === s.id ? null : s.id)}
                      >
                        {selectedShipment === s.id ? 'Close' : 'Monitor'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monitor panel */}
        {monitorData && (
          <div className="card dashboard-monitor animate-fade-in">
            <div className="card-header">
              <h3>📡 Live Monitor — {monitorData.trackingId}</h3>
              <span className="badge badge-info">{monitorData.origin} → {monitorData.destination}</span>
            </div>

            <div className="monitor-gauge-section">
              <RiskGauge score={monitorData.riskScore} size={160} />
              <div className="monitor-breakdown">
                <div className="breakdown-item">
                  <span className="bd-label">Traffic</span>
                  <div className="bd-bar"><div className="bd-fill bd-traffic" style={{ width: `${monitorData.breakdown.trafficScore}%` }}></div></div>
                  <span className="bd-value">{monitorData.breakdown.trafficScore}</span>
                </div>
                <div className="breakdown-item">
                  <span className="bd-label">Weather</span>
                  <div className="bd-bar"><div className="bd-fill bd-weather" style={{ width: `${monitorData.breakdown.weatherScore}%` }}></div></div>
                  <span className="bd-value">{monitorData.breakdown.weatherScore}</span>
                </div>
                <div className="breakdown-item">
                  <span className="bd-label">News</span>
                  <div className="bd-bar"><div className="bd-fill bd-news" style={{ width: `${monitorData.breakdown.newsScore}%` }}></div></div>
                  <span className="bd-value">{monitorData.breakdown.newsScore}</span>
                </div>
              </div>
            </div>

            {monitorData.weather && (
              <div className="monitor-weather">
                <span>{monitorData.weather.origin?.icon} {monitorData.weather.origin?.city}: {monitorData.weather.origin?.temperature}°C {monitorData.weather.origin?.condition}</span>
                <span>{monitorData.weather.destination?.icon} {monitorData.weather.destination?.city}: {monitorData.weather.destination?.temperature}°C {monitorData.weather.destination?.condition}</span>
              </div>
            )}

            {monitorData.newsHighlights?.length > 0 && (
              <div className="monitor-news">
                <h4>📰 News Alerts</h4>
                {monitorData.newsHighlights.map((n, i) => (
                  <p key={i} className="news-item">{n}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Alerts panel */}
        <div className="card dashboard-alerts">
          <div className="card-header">
            <h3>⚠️ Alerts History</h3>
            <span className="badge badge-high">{alertStats.unacknowledged || 0} unread</span>
          </div>
          <div className="alerts-list">
            {alerts.map(a => (
              <div key={a.id} className={`alert-item alert-item--${a.severity?.toLowerCase()} ${a.acknowledged ? 'acknowledged' : ''}`}>
                <div className="alert-item-header">
                  <span className="alert-type-tag">{a.type}</span>
                  <span className="alert-time">{new Date(a.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="alert-message">{a.message}</p>
                <div className="alert-meta">
                  <span>{a.route}</span>
                  <span>• {a.driver}</span>
                  {!a.acknowledged && (
                    <button className="btn btn-sm btn-secondary" onClick={() => handleAcknowledge(a.id)}>Ack</button>
                  )}
                  {a.acknowledged && <span className="ack-badge">✓ Acknowledged</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getShipments, getMonitorData, getAlerts, acknowledgeAlert } from '../services/api';
import RiskGauge from '../components/RiskGauge';
import AlertBanner from '../components/AlertBanner';
import MapView from '../components/MapView';
import RiskBadge from '../components/RiskBadge';
import './DriverInterface.css';

export default function DriverInterface() {
  const { user } = useAuth();
  const [shipment, setShipment] = useState(null);
  const [monitorData, setMonitorData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [routeAccepted, setRouteAccepted] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [shipData, alertData] = await Promise.all([getShipments(), getAlerts()]);
      if (shipData.shipments.length > 0) {
        setShipment(shipData.shipments[0]);
      }
      setAlerts(alertData.alerts.filter(a => a.driverId === user?.id || true).slice(0, 5));
    } catch (err) {
      console.error('Driver fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Poll monitor data
  useEffect(() => {
    if (!shipment) return;
    const fetchMonitor = async () => {
      try {
        const data = await getMonitorData(shipment.id);
        setMonitorData(data);
      } catch (err) { console.error(err); }
    };
    fetchMonitor();
    const interval = setInterval(fetchMonitor, 5000);
    return () => clearInterval(interval);
  }, [shipment?.id]);

  const handleAcknowledge = async (alertId) => {
    try {
      await acknowledgeAlert(alertId);
      fetchData();
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return <div className="loader-wrapper"><div className="loader"></div><span>Loading your route...</span></div>;
  }

  if (!shipment) {
    return (
      <div className="page-container">
        <div className="no-shipment">
          <span className="no-shipment-icon">📭</span>
          <h2>No Active Shipment</h2>
          <p>You don't have any assigned shipments at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="driver-header">
        <div>
          <h1 className="driver-title">🚛 Driver Interface</h1>
          <p className="driver-subtitle">{user?.name} • Vehicle: {user?.vehicleId || shipment.vehicleId}</p>
        </div>
        <div className="driver-status">
          <span className="live-dot"></span>
          <RiskBadge level={monitorData?.riskLevel || shipment.riskLevel} score={monitorData?.riskScore || shipment.riskScore} />
        </div>
      </div>

      <AlertBanner alerts={alerts} onAcknowledge={handleAcknowledge} />

      <div className="driver-grid">
        {/* Left: Route + Map */}
        <div className="driver-left">
          <div className="card driver-route-card">
            <div className="card-header">
              <h3>Current Route</h3>
              <span className="tracking-id">{shipment.trackingId}</span>
            </div>

            <div className="route-endpoints">
              <div className="endpoint">
                <span className="ep-dot ep-origin"></span>
                <div>
                  <span className="ep-label">Origin</span>
                  <span className="ep-city">{shipment.origin}</span>
                </div>
              </div>
              <div className="route-line"></div>
              <div className="endpoint">
                <span className="ep-dot ep-dest"></span>
                <div>
                  <span className="ep-label">Destination</span>
                  <span className="ep-city">{shipment.destination}</span>
                </div>
              </div>
            </div>

            <div className="route-quick-stats">
              <div className="qs">
                <span className="qs-value">{shipment.distance}</span>
                <span className="qs-label">Distance</span>
              </div>
              <div className="qs">
                <span className="qs-value">{shipment.eta}</span>
                <span className="qs-label">ETA</span>
              </div>
              <div className="qs">
                <span className="qs-value">{shipment.cargo}</span>
                <span className="qs-label">Cargo</span>
              </div>
              <div className="qs">
                <span className="qs-value">{shipment.weight}</span>
                <span className="qs-label">Weight</span>
              </div>
            </div>

            {shipment.currentLocation && (
              <div className="current-loc">
                📍 Currently near <strong>{shipment.currentLocation.city}</strong>
              </div>
            )}
          </div>

          {/* Map */}
          {shipment.originCoords && (
            <MapView
              routes={[{
                id: 'current',
                type: 'primary',
                waypoints: [shipment.originCoords, ...(shipment.currentLocation ? [[shipment.currentLocation.lat, shipment.currentLocation.lng]] : []), shipment.destCoords]
              }]}
              selectedRoute="current"
              currentLocation={shipment.currentLocation}
              height="350px"
            />
          )}
        </div>

        {/* Right: Monitor */}
        <div className="driver-right">
          <div className="card driver-risk-card">
            <h3 style={{ marginBottom: 16 }}>Risk Monitor</h3>
            <div className="risk-gauge-center-container">
              <RiskGauge score={monitorData?.riskScore || shipment.riskScore} size={180} />
            </div>

            {monitorData && (
              <div className="risk-breakdown">
                <div className="rb-item">
                  <span>🚗 Traffic</span>
                  <div className="rb-bar"><div className="rb-fill" style={{ width: `${monitorData.breakdown.trafficScore}%`, background: 'var(--accent-blue)' }}></div></div>
                  <span className="rb-val">{monitorData.breakdown.trafficScore}%</span>
                </div>
                <div className="rb-item">
                  <span>🌧️ Weather</span>
                  <div className="rb-bar"><div className="rb-fill" style={{ width: `${monitorData.breakdown.weatherScore}%`, background: 'var(--accent-yellow)' }}></div></div>
                  <span className="rb-val">{monitorData.breakdown.weatherScore}%</span>
                </div>
                <div className="rb-item">
                  <span>📰 News</span>
                  <div className="rb-bar"><div className="rb-fill" style={{ width: `${monitorData.breakdown.newsScore}%`, background: 'var(--accent-purple)' }}></div></div>
                  <span className="rb-val">{monitorData.breakdown.newsScore}%</span>
                </div>
              </div>
            )}

            {monitorData?.weather && (
              <div className="driver-weather-card">
                <div className="dw-item">
                  <span className="dw-icon">{monitorData.weather.origin?.icon}</span>
                  <div>
                    <span className="dw-city">{monitorData.weather.origin?.city}</span>
                    <span className="dw-temp">{monitorData.weather.origin?.temperature}°C • {monitorData.weather.origin?.condition}</span>
                  </div>
                </div>
                <div className="dw-item">
                  <span className="dw-icon">{monitorData.weather.destination?.icon}</span>
                  <div>
                    <span className="dw-city">{monitorData.weather.destination?.city}</span>
                    <span className="dw-temp">{monitorData.weather.destination?.temperature}°C • {monitorData.weather.destination?.condition}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Accept route button */}
          {(monitorData?.riskScore >= 70 || shipment.riskScore >= 70) && (
            <div className="card driver-action-card animate-fade-in">
              <div className="action-warning">
                <span>🚨</span>
                <div>
                  <h4>High Risk Detected</h4>
                  <p>An optimized route is available to reduce disruption risk.</p>
                </div>
              </div>
              {!routeAccepted ? (
                <button className="btn btn-success btn-lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setRouteAccepted(true)}>
                  ✅ Accept Optimized Route
                </button>
              ) : (
                <div className="route-accepted">
                  <span>✅</span> Optimized route accepted! Following new path.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

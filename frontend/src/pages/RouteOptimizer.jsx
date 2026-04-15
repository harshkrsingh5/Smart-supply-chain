import { useState } from 'react';
import { generateRoutes, getTransportOptions } from '../services/api';
import MapView from '../components/MapView';
import RouteCard from '../components/RouteCard';
import TransportModal from '../components/TransportModal';
import RiskBadge from '../components/RiskBadge';
import './RouteOptimizer.css';

const presetRoutes = [
  { origin: 'Mumbai', destination: 'Delhi', label: 'Mumbai → Delhi' },
  { origin: 'Bangalore', destination: 'Chennai', label: 'Bangalore → Chennai' },
  { origin: 'Hyderabad', destination: 'Pune', label: 'Hyderabad → Pune' },
  { origin: 'Kolkata', destination: 'Bhubaneswar', label: 'Kolkata → Bhubaneswar' },
  { origin: 'Ahmedabad', destination: 'Jaipur', label: 'Ahmedabad → Jaipur' },
];

export default function RouteOptimizer() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [cargo, setCargo] = useState('General');
  const [weight, setWeight] = useState('1000');
  const [loading, setLoading] = useState(false);
  const [transportLoading, setTransportLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [transportData, setTransportData] = useState(null);
  const [showTransport, setShowTransport] = useState(false);

  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!origin || !destination) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await generateRoutes(origin, destination, cargo, weight);
      setResult(data);
      setSelectedRoute(data.routes?.[0]?.id);
    } catch (err) {
      console.error('Route gen error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreset = (preset) => {
    setOrigin(preset.origin);
    setDestination(preset.destination);
  };

  const handleTransport = async () => {
    if (transportLoading) return;
    setTransportLoading(true);
    const selRoute = result?.routes?.find(r => r.id === selectedRoute);
    const dist = selRoute?.distanceKm || 500;
    const wt = parseInt(weight) || 1000;
    try {
      const data = await getTransportOptions(origin, destination, dist, wt);
      setTransportData(data);
      setShowTransport(true);
    } catch (err) {
      console.error('Transport options error:', err);
    } finally {
      setTransportLoading(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="optimizer-header">
        <div>
          <h1 className="optimizer-title">🗺️ Route Optimizer</h1>
          <p className="optimizer-subtitle">Generate AI-optimized routes with real-time risk analysis</p>
        </div>
      </div>

      {/* Input form */}
      <div className="card optimizer-form-card">
        <form onSubmit={handleGenerate} className="optimizer-form">
          <div className="form-row">
            <div className="form-group">
              <label className="label">Origin City</label>
              <input className="input" placeholder="e.g. Mumbai" value={origin} onChange={e => setOrigin(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="label">Destination City</label>
              <input className="input" placeholder="e.g. Delhi" value={destination} onChange={e => setDestination(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="label">Cargo Type</label>
              <select className="input" value={cargo} onChange={e => setCargo(e.target.value)}>
                <option>General</option>
                <option>Electronics</option>
                <option>Pharmaceuticals</option>
                <option>Food Products</option>
                <option>Automotive Parts</option>
                <option>Textiles</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Weight (kg)</label>
              <input className="input" type="number" value={weight} onChange={e => setWeight(e.target.value)} />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? <><span className="loader" style={{ width: 18, height: 18, borderWidth: 2 }}></span> Analyzing...</> : '🔍 Generate Routes'}
            </button>
          </div>
        </form>

        <div className="preset-routes">
          <span className="preset-label">Quick Select:</span>
          {presetRoutes.map(p => (
            <button key={p.label} className="preset-btn" onClick={() => handlePreset(p)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="optimizer-results animate-fade-in">
          {/* AI Analysis */}
          {result.aiAnalysis && (
            <div className="card ai-analysis-card">
              <h3>🤖 AI Risk Analysis</h3>
              <div className="ai-grid">
                <div className="ai-item">
                  <span className="ai-label">Summary</span>
                  <p>{result.aiAnalysis.summary}</p>
                </div>
                <div className="ai-item">
                  <span className="ai-label">Primary Concern</span>
                  <p>{result.aiAnalysis.primaryConcern}</p>
                </div>
                <div className="ai-item">
                  <span className="ai-label">Recommendation</span>
                  <p>{result.aiAnalysis.recommendation}</p>
                </div>
                <div className="ai-item">
                  <span className="ai-label">Est. Delay</span>
                  <p>{result.aiAnalysis.estimatedDelay}</p>
                </div>
                {result.aiAnalysis.driverTip && (
                  <div className="ai-item ai-tip">
                    <span className="ai-label">💡 Driver Tip</span>
                    <p>{result.aiAnalysis.driverTip}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Map */}
          <MapView routes={result.routes} selectedRoute={selectedRoute} height="400px" />

          {/* Route cards */}
          <div className="route-cards-grid">
            {result.routes.map(route => (
              <RouteCard
                key={route.id}
                route={route}
                selected={selectedRoute === route.id}
                onSelect={setSelectedRoute}
              />
            ))}
          </div>

          {/* AI Optimization recommendation */}
          {result.aiOptimization && (
            <div className="card optimization-card">
              <h3>🎯 AI Route Recommendation</h3>
              <div className="opt-content">
                <p><strong>Best Route:</strong> {result.routes.find(r => r.id === result.aiOptimization.bestRouteId)?.name || result.aiOptimization.bestRouteId}</p>
                <p><strong>Reasoning:</strong> {result.aiOptimization.reasoning}</p>
                <p><strong>Estimated Saving:</strong> {result.aiOptimization.estimatedSaving}</p>
                <p><strong>Confidence:</strong> <span className={`badge badge-${result.aiOptimization.confidenceLevel?.toLowerCase() === 'high' ? 'low' : 'medium'}`}>{result.aiOptimization.confidenceLevel}</span></p>
              </div>
            </div>
          )}

          {/* Weather panel */}
          {result.weather && (
            <div className="card weather-card">
              <h3>🌤️ Route Weather Conditions</h3>
              <div className="weather-grid">
                <div className="weather-item">
                  <span className="wi-icon">{result.weather.origin?.icon}</span>
                  <span className="wi-city">{result.weather.origin?.city}</span>
                  <span className="wi-temp">{result.weather.origin?.temperature}°C</span>
                  <span className="wi-cond">{result.weather.origin?.condition}</span>
                  <span className="wi-detail">💧 {result.weather.origin?.humidity}% • 💨 {result.weather.origin?.windSpeed} km/h</span>
                </div>
                <div className="weather-item">
                  <span className="wi-icon">{result.weather.destination?.icon}</span>
                  <span className="wi-city">{result.weather.destination?.city}</span>
                  <span className="wi-temp">{result.weather.destination?.temperature}°C</span>
                  <span className="wi-cond">{result.weather.destination?.condition}</span>
                  <span className="wi-detail">💧 {result.weather.destination?.humidity}% • 💨 {result.weather.destination?.windSpeed} km/h</span>
                </div>
              </div>
              {result.weather.worstCondition?.condition !== 'Clear' && (
                <div className="weather-alerts">
                  {result.weather.alerts?.map((a, i) => <p key={i}>{a}</p>)}
                </div>
              )}
            </div>
          )}

          {/* News panel */}
          {result.news?.articles?.length > 0 && (
            <div className="card news-card">
              <h3>📰 Disruption News ({result.news.source})</h3>
              <div className="news-list">
                {result.news.articles.slice(0, 5).map((a, i) => (
                  <div key={i} className="news-article">
                    <h4>{a.title}</h4>
                    <p>{a.description}</p>
                    <span className="news-meta">{a.source} • {new Date(a.publishedAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transport button */}
          <div className="transport-action">
            <button type="button" className="btn btn-primary btn-lg" onClick={handleTransport} disabled={transportLoading}>
              {transportLoading
                ? <><span className="loader" style={{ width: 18, height: 18, borderWidth: 2 }}></span> Loading...</>
                : '🚛 Compare Transport Modes (Road / Air / Rail)'}
            </button>
          </div>
        </div>
      )}

      {showTransport && (
        <TransportModal data={transportData} onClose={() => setShowTransport(false)} />
      )}
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginApi } from '../services/api';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginApi(email, password);
      login(data.token, data.user);
      navigate(data.user.role === 'manager' ? '/dashboard' : '/driver');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (role) => {
    setEmail(role === 'manager' ? 'manager@sco.com' : 'driver@sco.com');
    setPassword(role === 'manager' ? 'manager123' : 'driver123');
    setLoading(true);
    try {
      const data = await loginApi(
        role === 'manager' ? 'manager@sco.com' : 'driver@sco.com',
        role === 'manager' ? 'manager123' : 'driver123'
      );
      login(data.token, data.user);
      navigate(data.user.role === 'manager' ? '/dashboard' : '/driver');
    } catch (err) {
      setError('Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-effects">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
      </div>

      <div className="login-container">
        <div className="login-hero">
          <div className="hero-content">
            <div className="hero-badge">🚀 AI-Powered Logistics</div>
            <h1 className="hero-title">
              Smart Supply<br />Chain <span className="gradient-text">Optimizer</span>
            </h1>
            <p className="hero-description">
              Predict disruptions, optimize routes, and manage logistics in real-time 
              with AI-driven risk analysis and multi-modal transport intelligence.
            </p>
            <div className="hero-features">
              <div className="hero-feature">
                <span className="hf-icon">🗺️</span>
                <span>Real-time Route Optimization</span>
              </div>
              <div className="hero-feature">
                <span className="hf-icon">🤖</span>
                <span>Gemini AI Risk Analysis</span>
              </div>
              <div className="hero-feature">
                <span className="hf-icon">📊</span>
                <span>Live Disruption Scoring</span>
              </div>
              <div className="hero-feature">
                <span className="hf-icon">🚛</span>
                <span>Multi-Modal Transport</span>
              </div>
            </div>
          </div>
        </div>

        <div className="login-form-panel">
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-form-header">
              <div className="form-brand">
                <div className="form-brand-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <span>SCO</span>
              </div>
              <h2>Welcome Back</h2>
              <p>Sign in to access your logistics dashboard</p>
            </div>

            {error && <div className="login-error">{error}</div>}

            <div className="form-group">
              <label className="label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg login-submit" disabled={loading}>
              {loading ? <span className="loader" style={{ width: 20, height: 20, borderWidth: 2 }}></span> : 'Sign In'}
            </button>

            <div className="login-divider"><span>Quick Access</span></div>

            <div className="quick-login-btns">
              <button type="button" className="quick-btn quick-btn--manager" onClick={() => quickLogin('manager')}>
                <span>📊</span> Manager Dashboard
              </button>
              <button type="button" className="quick-btn quick-btn--driver" onClick={() => quickLogin('driver')}>
                <span>🚛</span> Driver Interface
              </button>
            </div>

            <div className="login-footer">
              <p>Demo credentials available via Quick Access buttons</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

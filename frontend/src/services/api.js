import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE });

// Attach JWT to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('sco_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401/403
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response && (err.response.status === 401 || err.response.status === 403)) {
      localStorage.removeItem('sco_token');
      localStorage.removeItem('sco_user');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export async function loginApi(email, password) {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
}

export async function getShipments() {
  const res = await api.get('/shipments');
  return res.data;
}

export async function getMonitorData(shipmentId) {
  const res = await api.get(`/monitor/${shipmentId}`);
  return res.data;
}

export async function getAlerts() {
  const res = await api.get('/alerts');
  return res.data;
}

export async function acknowledgeAlert(alertId) {
  const res = await api.post('/alerts/ack', { alertId });
  return res.data;
}

export async function generateRoutes(origin, destination, cargo, weight) {
  const res = await api.post('/routes/generate', { origin, destination, cargo, weight });
  return res.data;
}

export async function getTransportOptions(origin, destination, distanceKm, cargoWeight) {
  const res = await api.post('/routes/transport', { origin, destination, distanceKm, cargoWeight });
  return res.data;
}

// Truck fleet management
export async function getTrucks() {
  const res = await api.get('/trucks');
  return res.data;
}

export async function addTruck(truckData) {
  const res = await api.post('/trucks', truckData);
  return res.data;
}

export async function deleteTruck(truckId) {
  const res = await api.delete(`/trucks/${truckId}`);
  return res.data;
}

export async function updateTruckStatus(truckId, status) {
  const res = await api.patch(`/trucks/${truckId}/status`, { status });
  return res.data;
}

export default api;

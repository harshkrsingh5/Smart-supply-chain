require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');

const authRoutes = require('./routes/auth.routes');
const routeRoutes = require('./routes/route.routes');
const monitoringRoutes = require('./routes/monitoring.routes');
const shipmentRoutes = require('./routes/shipment.routes');
const alertRoutes = require('./routes/alert.routes');
const truckRoutes = require('./routes/truck.routes');
const { simulateDataFluctuation } = require('./services/scoring.service');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/monitor', monitoringRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/trucks', truckRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Smart Supply Chain Optimizer' });
});

// Real-time simulation: fluctuate risk scores every 8 seconds
cron.schedule('*/8 * * * * *', () => {
  simulateDataFluctuation();
});

app.listen(PORT, () => {
  console.log(`🚀 Smart Supply Chain Backend running on http://localhost:${PORT}`);
  console.log(`📡 APIs: NewsAPI ✅ | Gemini AI ✅ | Weather: Open-Meteo ✅ (real-time) | Routing: OSRM (open-source) | Maps: Google (frontend)`);
});

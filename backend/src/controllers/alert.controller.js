const { alerts } = require('../data/mockData');

function getAlerts(req, res) {
  try {
    const sorted = [...alerts].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const stats = {
      total: alerts.length,
      unacknowledged: alerts.filter(a => !a.acknowledged).length,
      high: alerts.filter(a => a.severity === 'HIGH').length,
      medium: alerts.filter(a => a.severity === 'MEDIUM').length,
      low: alerts.filter(a => a.severity === 'LOW').length
    };
    res.json({ alerts: sorted, stats });
  } catch (err) {
    console.error('Alerts error:', err);
    res.status(500).json({ error: 'Failed to fetch alerts.' });
  }
}

function acknowledgeAlert(req, res) {
  try {
    const { alertId } = req.body;
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found.' });
    }
    alert.acknowledged = true;
    res.json({ message: 'Alert acknowledged.', alert });
  } catch (err) {
    console.error('Acknowledge alert error:', err);
    res.status(500).json({ error: 'Failed to acknowledge alert.' });
  }
}

module.exports = { getAlerts, acknowledgeAlert };

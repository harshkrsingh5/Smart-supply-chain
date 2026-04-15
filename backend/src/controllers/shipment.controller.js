const { shipments } = require('../data/mockData');
const { getRiskLevel } = require('../services/scoring.service');

function getShipments(req, res) {
  try {
    const { role, id } = req.user;

    let filtered = shipments;

    // Drivers only see their assigned shipments
    if (role === 'driver') {
      filtered = shipments.filter(s => s.driverId === id);
    }

    const enriched = filtered.map(s => ({
      ...s,
      ...getRiskLevel(s.riskScore)
    }));

    const stats = {
      total: filtered.length,
      inTransit: filtered.filter(s => s.status === 'In Transit').length,
      delayed: filtered.filter(s => s.status === 'Delayed').length,
      onSchedule: filtered.filter(s => s.status === 'On Schedule').length,
      highRisk: filtered.filter(s => s.riskScore >= 70).length,
      mediumRisk: filtered.filter(s => s.riskScore >= 40 && s.riskScore < 70).length,
      lowRisk: filtered.filter(s => s.riskScore < 40).length,
      avgRiskScore: Math.round(filtered.reduce((sum, s) => sum + s.riskScore, 0) / (filtered.length || 1))
    };

    res.json({ shipments: enriched, stats });
  } catch (err) {
    console.error('Shipments error:', err);
    res.status(500).json({ error: 'Failed to fetch shipments.' });
  }
}

function createShipment(req, res) {
  try {
    const { origin, destination, cargo, weight, driver } = req.body;
    const newShipment = {
      id: `SHP_${String(shipments.length + 1).padStart(3, '0')}`,
      trackingId: `SCO-2024-${String(shipments.length + 1).padStart(3, '0')}`,
      origin,
      destination,
      cargo: cargo || 'General',
      weight: weight || '1000 kg',
      driver: driver || 'Unassigned',
      status: 'Pending',
      riskScore: 0,
      riskLevel: 'LOW',
      eta: 'Calculating...',
      distance: 'Calculating...',
      startTime: new Date().toISOString(),
      currentLocation: { lat: 0, lng: 0, city: origin }
    };

    shipments.push(newShipment);
    res.status(201).json({ shipment: newShipment, message: 'Shipment created.' });
  } catch (err) {
    console.error('Create shipment error:', err);
    res.status(500).json({ error: 'Failed to create shipment.' });
  }
}

module.exports = { getShipments, createShipment };

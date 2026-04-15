const { shipments } = require('../data/mockData');
const { getRouteScore, getRiskLevel, computeDisruptionScore, weatherToScore, analyzeNewsForScore } = require('../services/scoring.service');
const { getWeatherForRoute } = require('../services/weather.service');
const { fetchDisruptionNews } = require('../services/news.service');

async function getMonitorData(req, res) {
  try {
    const { routeId } = req.params;

    const shipment = shipments.find(s => s.id === routeId);
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found.' });
    }

    // Fetch live data
    const [weatherData, newsData] = await Promise.all([
      getWeatherForRoute(shipment.origin, shipment.destination),
      fetchDisruptionNews(shipment.origin, shipment.destination)
    ]);

    const weatherScore = weatherToScore(weatherData.worstCondition);
    const newsScore = analyzeNewsForScore(newsData.articles);
    const trafficScore = getRouteScore(`${routeId}_A`);

    const riskScore = computeDisruptionScore({ trafficScore, weatherScore, newsScore });
    const risk = getRiskLevel(riskScore);

    // Update shipment in-memory
    shipment.riskScore = riskScore;
    shipment.riskLevel = risk.level;

    res.json({
      shipmentId: routeId,
      trackingId: shipment.trackingId,
      origin: shipment.origin,
      destination: shipment.destination,
      status: shipment.status,
      currentLocation: shipment.currentLocation,
      riskScore,
      riskLevel: risk.level,
      riskColor: risk.color,
      riskLabel: risk.label,
      riskEmoji: risk.emoji,
      breakdown: {
        trafficScore,
        weatherScore,
        newsScore,
        trafficWeight: '35%',
        weatherWeight: '30%',
        newsWeight: '25%',
        timeWeight: '10%'
      },
      weather: weatherData,
      newsHighlights: newsData.articles.slice(0, 3).map(a => a.title),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Monitoring error:', err);
    res.status(500).json({ error: 'Failed to fetch monitoring data.' });
  }
}

module.exports = { getMonitorData };

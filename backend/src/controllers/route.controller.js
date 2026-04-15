const { generateRoutes, getTrafficScore } = require('../services/maps.service');
const { getWeatherForRoute } = require('../services/weather.service');
const { fetchDisruptionNews } = require('../services/news.service');
const { computeDisruptionScore, getRiskLevel, analyzeNewsForScore, weatherToScore, setRouteScore } = require('../services/scoring.service');
const { getTransportOptions } = require('../services/transport.service');
const { generateRiskAnalysis, generateRouteOptimization } = require('../services/gemini.service');

async function generateRoute(req, res) {
  try {
    const { origin, destination, cargo, weight } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required.' });
    }

    // Generate route options (OSRM open-source routing with fallback)
    const routes = await generateRoutes(origin, destination);

    // Fetch real-time data
    const [weatherData, newsData] = await Promise.all([
      getWeatherForRoute(origin, destination),
      fetchDisruptionNews(origin, destination)
    ]);

    const weatherScore = weatherToScore(weatherData.worstCondition);
    const newsScore = analyzeNewsForScore(newsData.articles);

    // Score each route
    const scoredRoutes = routes.map(route => {
      const trafficScore = getTrafficScore(route);
      const riskScore = computeDisruptionScore({ trafficScore, weatherScore, newsScore });
      const risk = getRiskLevel(riskScore);

      return {
        ...route,
        trafficScore,
        weatherScore,
        newsScore,
        riskScore,
        riskLevel: risk.level,
        riskColor: risk.color,
        riskLabel: risk.label,
        riskEmoji: risk.emoji
      };
    });

    // AI analysis
    const bestRoute = scoredRoutes.reduce((a, b) => a.riskScore < b.riskScore ? a : b);
    const [aiAnalysis, aiOptimization] = await Promise.all([
      generateRiskAnalysis({
        origin, destination,
        riskScore: bestRoute.riskScore,
        riskLevel: bestRoute.riskLevel,
        trafficScore: bestRoute.trafficScore,
        weatherScore, newsScore,
        weatherCondition: weatherData.routeSummary,
        newsHeadlines: newsData.articles.map(a => a.title)
      }),
      generateRouteOptimization({ routes: scoredRoutes, cargo: cargo || 'General' })
    ]);

    res.json({
      routes: scoredRoutes,
      weather: weatherData,
      news: newsData,
      aiAnalysis,
      aiOptimization,
      metadata: {
        origin, destination,
        generatedAt: new Date().toISOString(),
        routeCount: scoredRoutes.length
      }
    });
  } catch (err) {
    console.error('Route generation error:', err);
    res.status(500).json({ error: 'Failed to generate routes.' });
  }
}

async function getRoute(req, res) {
  try {
    const { id } = req.params;
    // Return a specific route from cache/mock
    res.json({
      routeId: id,
      message: 'Route details retrieved.',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get route.' });
  }
}

async function getTransport(req, res) {
  try {
    const { origin, destination, distanceKm, cargoWeight } = req.body;
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required.' });
    }
    const options = getTransportOptions(origin, destination, distanceKm || 500, cargoWeight || 1000);
    res.json(options);
  } catch (err) {
    console.error('Transport options error:', err);
    res.status(500).json({ error: 'Failed to get transport options.' });
  }
}

module.exports = { generateRoute, getRoute, getTransport };

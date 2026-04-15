// Risk Scoring Service — Core engine
// Formula: Traffic(35%) + Weather(30%) + News(25%) + TimeFactor(10%)

// In-memory state for real-time simulation
let routeScores = {
  'SHP_001_A': 72, 'SHP_001_B': 58,
  'SHP_002_A': 28, 'SHP_002_B': 35,
  'SHP_003_A': 55, 'SHP_003_B': 42,
  'SHP_004_A': 63, 'SHP_004_B': 50,
  'SHP_005_A': 22, 'SHP_005_B': 30,
};

function computeDisruptionScore({ trafficScore, weatherScore, newsScore }) {
  const timeFactor = getTimeFactor();
  const raw = (trafficScore * 0.35) + (weatherScore * 0.30) + (newsScore * 0.25) + (timeFactor * 0.10);
  return Math.round(Math.min(100, Math.max(0, raw)));
}

function getRiskLevel(score) {
  if (score < 40) return { level: 'LOW', color: '#22c55e', label: 'Low Risk', emoji: '🟢' };
  if (score < 70) return { level: 'MEDIUM', color: '#f59e0b', label: 'Medium Risk', emoji: '🟡' };
  return { level: 'HIGH', color: '#ef4444', label: 'High Risk', emoji: '🔴' };
}

function getTimeFactor() {
  const hour = new Date().getHours();
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) return 80; // Peak hours
  if (hour >= 23 || hour <= 5) return 10; // Late night — low traffic
  if (hour >= 10 && hour <= 16) return 35; // Daytime
  return 50; // Evening
}

// Simulate live data fluctuation — called every 8s by cron job
function simulateDataFluctuation() {
  Object.keys(routeScores).forEach(key => {
    const delta = (Math.random() - 0.45) * 8; // Slight upward bias for realism
    routeScores[key] = Math.round(Math.min(100, Math.max(0, routeScores[key] + delta)));
  });
}

function getRouteScore(routeKey) {
  return routeScores[routeKey] || Math.round(Math.random() * 60 + 20);
}

function setRouteScore(routeKey, score) {
  routeScores[routeKey] = score;
}

function getAllRouteScores() {
  return routeScores;
}

// Analyze news articles for disruption keywords
function analyzeNewsForScore(articles = []) {
  if (!articles || articles.length === 0) return 20;

  const highRiskKeywords = ['accident', 'crash', 'collision', 'flood', 'blocked', 'closed', 'strike', 'protest', 'disaster'];
  const mediumRiskKeywords = ['delay', 'congestion', 'traffic', 'weather', 'rain', 'construction', 'detour'];

  let score = 0;
  articles.slice(0, 10).forEach(article => {
    const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
    highRiskKeywords.forEach(kw => { if (text.includes(kw)) score += 18; });
    mediumRiskKeywords.forEach(kw => { if (text.includes(kw)) score += 8; });
  });

  return Math.min(100, score);
}

// Convert weather condition to risk score
function weatherToScore(weatherData) {
  if (!weatherData) return 20;
  const condition = (weatherData.condition || '').toLowerCase();
  const windSpeed = weatherData.windSpeed || 0;
  const visibility = weatherData.visibility || 10;

  let score = 0;
  if (condition.includes('storm') || condition.includes('tornado')) score = 90;
  else if (condition.includes('heavy rain') || condition.includes('thunderstorm')) score = 75;
  else if (condition.includes('rain') || condition.includes('drizzle')) score = 45;
  else if (condition.includes('fog') || condition.includes('mist') || condition.includes('haze')) score = 55;
  else if (condition.includes('snow') || condition.includes('ice')) score = 80;
  else if (condition.includes('cloud')) score = 15;
  else score = 5; // Clear

  if (windSpeed > 60) score = Math.min(100, score + 20);
  if (visibility < 1) score = Math.min(100, score + 25);

  return score;
}

module.exports = {
  computeDisruptionScore, getRiskLevel, getTimeFactor,
  simulateDataFluctuation, getRouteScore, setRouteScore,
  getAllRouteScores, analyzeNewsForScore, weatherToScore
};

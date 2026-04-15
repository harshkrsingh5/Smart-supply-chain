// Weather Service — Real-time weather data from Open-Meteo (free, no API key)
// Fallback chain: Open-Meteo → OpenWeatherMap (if key) → Simulation
const axios = require('axios');

// ───── Indian City Coordinates (lat, lon) ─────
const cityCoords = {
  Mumbai:      { lat: 19.0760, lon: 72.8777 },
  Delhi:       { lat: 28.7041, lon: 77.1025 },
  Bangalore:   { lat: 12.9716, lon: 77.5946 },
  Chennai:     { lat: 13.0827, lon: 80.2707 },
  Hyderabad:   { lat: 17.3850, lon: 78.4867 },
  Pune:        { lat: 18.5204, lon: 73.8567 },
  Kolkata:     { lat: 22.5726, lon: 88.3639 },
  Bhubaneswar: { lat: 20.2961, lon: 85.8245 },
  Ahmedabad:   { lat: 23.0225, lon: 72.5714 },
  Jaipur:      { lat: 26.9124, lon: 75.7873 },
  Surat:       { lat: 21.1702, lon: 72.8311 },
  Vadodara:    { lat: 22.3072, lon: 73.1812 },
  Nashik:      { lat: 19.9975, lon: 73.7898 },
  Udaipur:     { lat: 24.5854, lon: 73.7125 },
  Vellore:     { lat: 12.9165, lon: 79.1325 },
  Solapur:     { lat: 17.6599, lon: 75.9064 },
  Balasore:    { lat: 21.4934, lon: 86.9337 },
  Indore:      { lat: 22.7196, lon: 75.8577 },
  Bhopal:      { lat: 23.2599, lon: 77.4126 },
  Lucknow:     { lat: 26.8467, lon: 80.9462 },
  Nagpur:      { lat: 21.1458, lon: 79.0882 },
  Visakhapatnam: { lat: 17.6868, lon: 83.2185 },
  Coimbatore:  { lat: 11.0168, lon: 76.9558 },
  Kochi:       { lat: 9.9312,  lon: 76.2673 },
  Chandigarh:  { lat: 30.7333, lon: 76.7794 },
  Guwahati:    { lat: 26.1445, lon: 91.7362 },
  Patna:       { lat: 25.6093, lon: 85.1376 },
  Ranchi:      { lat: 23.3441, lon: 85.3096 },
  Thiruvananthapuram: { lat: 8.5241, lon: 76.9366 },
  Mangalore:   { lat: 12.9141, lon: 74.8560 }
};

// ───── WMO Weather Code → Human-readable mapping ─────
const wmoCodeMap = {
  0:  { condition: 'Clear',           icon: '☀️',   description: 'Clear sky' },
  1:  { condition: 'Mostly Clear',    icon: '🌤️',  description: 'Mainly clear' },
  2:  { condition: 'Partly Cloudy',   icon: '⛅',   description: 'Partly cloudy' },
  3:  { condition: 'Overcast',        icon: '☁️',   description: 'Overcast' },
  45: { condition: 'Fog',             icon: '🌫️',  description: 'Fog' },
  48: { condition: 'Rime Fog',        icon: '🌫️',  description: 'Depositing rime fog' },
  51: { condition: 'Light Drizzle',   icon: '🌦️',  description: 'Light drizzle' },
  53: { condition: 'Drizzle',         icon: '🌦️',  description: 'Moderate drizzle' },
  55: { condition: 'Heavy Drizzle',   icon: '🌦️',  description: 'Dense drizzle' },
  56: { condition: 'Freezing Drizzle',icon: '🌧️',  description: 'Light freezing drizzle' },
  57: { condition: 'Freezing Drizzle',icon: '🌧️',  description: 'Dense freezing drizzle' },
  61: { condition: 'Light Rain',      icon: '🌦️',  description: 'Slight rain' },
  63: { condition: 'Moderate Rain',   icon: '🌧️',  description: 'Moderate rain' },
  65: { condition: 'Heavy Rain',      icon: '🌧️',  description: 'Heavy rain' },
  66: { condition: 'Freezing Rain',   icon: '🌧️',  description: 'Light freezing rain' },
  67: { condition: 'Freezing Rain',   icon: '🌧️',  description: 'Heavy freezing rain' },
  71: { condition: 'Light Snow',      icon: '🌨️',  description: 'Slight snow fall' },
  73: { condition: 'Snow',            icon: '🌨️',  description: 'Moderate snow fall' },
  75: { condition: 'Heavy Snow',      icon: '🌨️',  description: 'Heavy snow fall' },
  77: { condition: 'Snow Grains',     icon: '🌨️',  description: 'Snow grains' },
  80: { condition: 'Light Showers',   icon: '🌦️',  description: 'Slight rain showers' },
  81: { condition: 'Showers',         icon: '🌧️',  description: 'Moderate rain showers' },
  82: { condition: 'Heavy Showers',   icon: '🌧️',  description: 'Violent rain showers' },
  85: { condition: 'Snow Showers',    icon: '🌨️',  description: 'Slight snow showers' },
  86: { condition: 'Heavy Snow Showers', icon: '🌨️', description: 'Heavy snow showers' },
  95: { condition: 'Thunderstorm',    icon: '⛈️',   description: 'Thunderstorm' },
  96: { condition: 'Thunderstorm with Hail', icon: '⛈️', description: 'Thunderstorm with slight hail' },
  99: { condition: 'Severe Thunderstorm',    icon: '⛈️', description: 'Thunderstorm with heavy hail' }
};

// ───── In-memory cache (10 min TTL per city) ─────
const weatherCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCachedWeather(city) {
  const entry = weatherCache.get(city);
  if (entry && (Date.now() - entry.timestamp) < CACHE_TTL_MS) {
    return entry.data;
  }
  return null;
}

function setCachedWeather(city, data) {
  weatherCache.set(city, { data, timestamp: Date.now() });
}

// ───── 1. Open-Meteo (Primary — free, no API key) ─────
async function fetchFromOpenMeteo(city, coords) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_gusts_10m,surface_pressure,cloud_cover&wind_speed_unit=kmh&timezone=auto`;

  const { data } = await axios.get(url, { timeout: 8000 });
  const current = data.current;
  const weatherCode = current.weather_code || 0;
  const wmo = wmoCodeMap[weatherCode] || wmoCodeMap[0];

  // Estimate visibility from weather code
  let visibility = 10; // km, default clear
  if ([45, 48].includes(weatherCode)) visibility = 0.5;
  else if ([65, 67, 82, 95, 96, 99].includes(weatherCode)) visibility = 2;
  else if ([61, 63, 66, 80, 81].includes(weatherCode)) visibility = 5;
  else if ([51, 53, 55, 56, 57].includes(weatherCode)) visibility = 7;

  return {
    city,
    condition: wmo.condition,
    description: wmo.description,
    icon: wmo.icon,
    weatherCode,
    temperature: Math.round(current.temperature_2m),
    feelsLike: Math.round(current.apparent_temperature),
    humidity: Math.round(current.relative_humidity_2m),
    windSpeed: Math.round(current.wind_speed_10m),
    windGusts: Math.round(current.wind_gusts_10m || 0),
    visibility,
    pressure: Math.round(current.surface_pressure),
    cloudCover: current.cloud_cover,
    uvIndex: null, // not available in free Open-Meteo current
    source: 'open-meteo',
    coordinates: { lat: coords.lat, lon: coords.lon },
    fetchedAt: new Date().toISOString()
  };
}

// ───── 2. OpenWeatherMap (Secondary — requires API key) ─────
async function fetchFromOpenWeatherMap(city, coords) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return null;

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric`;

  const { data } = await axios.get(url, { timeout: 8000 });
  const weather = data.weather?.[0] || {};

  return {
    city,
    condition: weather.main || 'Unknown',
    description: weather.description || '',
    icon: getEmojiFromOWM(weather.id),
    weatherCode: weather.id,
    temperature: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    windSpeed: Math.round((data.wind?.speed || 0) * 3.6), // m/s → km/h
    windGusts: Math.round(((data.wind?.gust || 0) * 3.6)),
    visibility: Math.round((data.visibility || 10000) / 1000), // m → km
    pressure: data.main.pressure,
    cloudCover: data.clouds?.all || 0,
    uvIndex: null,
    source: 'openweathermap',
    coordinates: { lat: coords.lat, lon: coords.lon },
    fetchedAt: new Date().toISOString()
  };
}

function getEmojiFromOWM(conditionId) {
  if (!conditionId) return '❓';
  if (conditionId >= 200 && conditionId < 300) return '⛈️';
  if (conditionId >= 300 && conditionId < 400) return '🌦️';
  if (conditionId >= 500 && conditionId < 600) return '🌧️';
  if (conditionId >= 600 && conditionId < 700) return '🌨️';
  if (conditionId >= 700 && conditionId < 800) return '🌫️';
  if (conditionId === 800) return '☀️';
  if (conditionId > 800) return '☁️';
  return '❓';
}

// ───── 3. Simulation Fallback (if all APIs fail) ─────
function getSimulatedWeather(city) {
  const profiles = {
    Mumbai: { baseTemp: 30, humidity: 80 }, Delhi: { baseTemp: 25, humidity: 55 },
    Bangalore: { baseTemp: 24, humidity: 65 }, Chennai: { baseTemp: 32, humidity: 75 },
    Hyderabad: { baseTemp: 28, humidity: 60 }, Pune: { baseTemp: 26, humidity: 65 },
    Kolkata: { baseTemp: 30, humidity: 78 }, Bhubaneswar: { baseTemp: 29, humidity: 72 },
    Ahmedabad: { baseTemp: 33, humidity: 45 }, Jaipur: { baseTemp: 28, humidity: 40 }
  };
  const profile = profiles[city] || { baseTemp: 28, humidity: 60 };
  const conditions = ['Clear', 'Partly Cloudy', 'Overcast', 'Light Rain', 'Heavy Rain', 'Thunderstorm', 'Fog'];
  const icons      = ['☀️',   '⛅',            '☁️',       '🌦️',        '🌧️',        '⛈️',           '🌫️'];
  const idx = Math.floor(Math.random() * conditions.length);

  return {
    city,
    condition: conditions[idx],
    description: `Simulated: ${conditions[idx].toLowerCase()}`,
    icon: icons[idx],
    weatherCode: null,
    temperature: Math.round(profile.baseTemp + (Math.random() - 0.5) * 6),
    feelsLike: Math.round(profile.baseTemp + (Math.random() - 0.5) * 6 - 2),
    humidity: Math.round(profile.humidity + (Math.random() - 0.5) * 20),
    windSpeed: Math.round(10 + Math.random() * 40),
    windGusts: Math.round(15 + Math.random() * 50),
    visibility: conditions[idx].includes('Fog') ? 0.5 : conditions[idx].includes('Rain') ? 3 : 10,
    pressure: Math.round(1010 + (Math.random() - 0.5) * 20),
    cloudCover: Math.round(Math.random() * 100),
    uvIndex: Math.round(Math.random() * 10),
    source: 'simulation (API unavailable)',
    coordinates: cityCoords[city] || null,
    fetchedAt: new Date().toISOString()
  };
}

// ───── Main: Get weather for a single city ─────
async function getWeatherForCity(city) {
  // 1. Check cache first
  const cached = getCachedWeather(city);
  if (cached) return { ...cached, fromCache: true };

  const coords = cityCoords[city];
  if (!coords) {
    console.warn(`⚠️ No coordinates for city "${city}" — using simulation`);
    return getSimulatedWeather(city);
  }

  // 2. Try Open-Meteo (free, no key)
  try {
    const result = await fetchFromOpenMeteo(city, coords);
    setCachedWeather(city, result);
    return result;
  } catch (err) {
    console.warn(`⚠️ Open-Meteo failed for ${city}: ${err.message}`);
  }

  // 3. Try OpenWeatherMap (if key present)
  try {
    const result = await fetchFromOpenWeatherMap(city, coords);
    if (result) {
      setCachedWeather(city, result);
      return result;
    }
  } catch (err) {
    console.warn(`⚠️ OpenWeatherMap failed for ${city}: ${err.message}`);
  }

  // 4. Fallback to simulation
  console.warn(`⚠️ All weather APIs failed for ${city} — using simulation`);
  const simulated = getSimulatedWeather(city);
  setCachedWeather(city, simulated);
  return simulated;
}

// ───── Get weather for a route (origin + destination) ─────
async function getWeatherForRoute(origin, destination) {
  const [originWeather, destWeather] = await Promise.all([
    getWeatherForCity(origin),
    getWeatherForCity(destination)
  ]);

  // Determine worst conditions along the route
  const conditionSeverity = {
    'Clear': 0, 'Mostly Clear': 1, 'Partly Cloudy': 2, 'Overcast': 3,
    'Haze': 4, 'Light Drizzle': 4, 'Drizzle': 5, 'Heavy Drizzle': 5,
    'Light Rain': 5, 'Moderate Rain': 6, 'Light Showers': 5, 'Showers': 6,
    'Fog': 6, 'Rime Fog': 6, 'Freezing Drizzle': 7, 'Freezing Rain': 7,
    'Heavy Rain': 7, 'Heavy Showers': 7, 'Light Snow': 6, 'Snow': 7,
    'Heavy Snow': 8, 'Snow Grains': 6, 'Snow Showers': 7, 'Heavy Snow Showers': 8,
    'Thunderstorm': 8, 'Thunderstorm with Hail': 9, 'Severe Thunderstorm': 10
  };

  const originSev = conditionSeverity[originWeather.condition] || 0;
  const destSev = conditionSeverity[destWeather.condition] || 0;
  const worstWeather = originSev >= destSev ? originWeather : destWeather;

  return {
    origin: originWeather,
    destination: destWeather,
    routeSummary: worstWeather.condition,
    worstCondition: worstWeather,
    alerts: generateWeatherAlerts(worstWeather),
    dataSource: `${originWeather.source} / ${destWeather.source}`
  };
}

// ───── Generate actionable weather alerts ─────
function generateWeatherAlerts(weather) {
  const alerts = [];
  const cond = (weather.condition || '').toLowerCase();

  if (cond.includes('severe thunderstorm') || cond.includes('hail'))
    alerts.push('🚨 Severe thunderstorm with hail — AVOID travel if possible');
  else if (cond.includes('thunderstorm'))
    alerts.push('⛈️ Thunderstorm warning — consider postponing travel');

  if (cond.includes('heavy rain') || cond.includes('heavy showers'))
    alerts.push('🌧️ Heavy rainfall expected — reduce speed, use headlights');

  if (cond.includes('fog') || cond.includes('rime fog'))
    alerts.push('🌫️ Dense fog advisory — keep safe following distance');

  if (cond.includes('snow') || cond.includes('freezing'))
    alerts.push('🌨️ Snow/ice conditions — use chains, drive cautiously');

  if (weather.windSpeed > 55)
    alerts.push('💨 High wind warning — drive carefully, especially on bridges');
  else if (weather.windSpeed > 40)
    alerts.push('💨 Moderate wind advisory — exercise caution on open roads');

  if (weather.visibility < 1)
    alerts.push('👁️ Very low visibility (<1 km) — drive with extreme caution');
  else if (weather.visibility < 3)
    alerts.push('👁️ Reduced visibility — use fog lights and reduce speed');

  if (weather.temperature > 42)
    alerts.push('🌡️ Extreme heat warning — ensure vehicle cooling system is working');

  return alerts;
}

module.exports = { getWeatherForCity, getWeatherForRoute };

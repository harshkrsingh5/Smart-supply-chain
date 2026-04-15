// Maps Service — Route generation using OSRM (open-source routing)
// Uses OSRM for real road-following routes, Nominatim for geocoding
// Falls back to synthetic routes when OSRM is unavailable

const { routeWaypoints } = require('../data/mockData');

// ═══════════════════════════════════════════════════
// Coordinate lookup for major Indian cities
// ═══════════════════════════════════════════════════
const cityCoords = {
  'mumbai': [19.0760, 72.8777],
  'delhi': [28.6139, 77.2090],
  'new delhi': [28.6139, 77.2090],
  'bangalore': [12.9716, 77.5946],
  'bengaluru': [12.9716, 77.5946],
  'chennai': [13.0827, 80.2707],
  'hyderabad': [17.3850, 78.4867],
  'pune': [18.5204, 73.8567],
  'kolkata': [22.5726, 88.3639],
  'bhubaneswar': [20.2961, 85.8245],
  'ahmedabad': [23.0225, 72.5714],
  'jaipur': [26.9124, 75.7873],
  'lucknow': [26.8467, 80.9462],
  'kanpur': [26.4499, 80.3319],
  'nagpur': [21.1458, 79.0882],
  'indore': [22.7196, 75.8577],
  'bhopal': [23.2599, 77.4126],
  'patna': [25.6093, 85.1376],
  'vadodara': [22.3072, 73.1812],
  'surat': [21.1702, 72.8311],
  'visakhapatnam': [17.6868, 83.2185],
  'coimbatore': [11.0168, 76.9558],
  'thiruvananthapuram': [8.5241, 76.9366],
  'kochi': [9.9312, 76.2673],
  'guwahati': [26.1445, 91.7362],
  'chandigarh': [30.7333, 76.7794],
  'dehradun': [30.3165, 78.0322],
  'ranchi': [23.3441, 85.3096],
  'raipur': [21.2514, 81.6296],
  'goa': [15.2993, 74.1240],
  'nashik': [19.9975, 73.7898],
  'solapur': [17.6688, 75.9006],
  'mysore': [12.2958, 76.6394],
  'mangalore': [12.9141, 74.8560],
  'jodhpur': [26.2389, 73.0243],
  'udaipur': [24.5854, 73.7125],
  'varanasi': [25.3176, 82.9739],
  'agra': [27.1767, 78.0081],
  'amritsar': [31.6340, 74.8723],
  'shimla': [31.1048, 77.1734],
  'gwalior': [26.2183, 78.1828],
  'vijayawada': [16.5062, 80.6480],
  'madurai': [9.9252, 78.1198],
  'tiruchirappalli': [10.7905, 78.7047],
  'cuttack': [20.4625, 85.8830],
  'kharagpur': [22.3460, 87.3236],
  'jamshedpur': [22.8046, 86.2029],
  'dhanbad': [23.7957, 86.4304]
};

// ═══════════════════════════════════════════════════
// Geocoding — resolve city name to coordinates
// ═══════════════════════════════════════════════════
async function geocodeCity(cityName) {
  const key = cityName.trim().toLowerCase();

  // Check local lookup first
  if (cityCoords[key]) return cityCoords[key];

  // Fuzzy match
  for (const [name, coords] of Object.entries(cityCoords)) {
    if (key.includes(name) || name.includes(key)) return coords;
  }

  // Use Nominatim (open-source geocoding) for unknown cities
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName + ', India')}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SmartSupplyChainOptimizer/1.0' }
    });
    const data = await res.json();
    if (data.length > 0) {
      const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      // Cache for future use
      cityCoords[key] = coords;
      console.log(`📍 Geocoded "${cityName}" → [${coords}] via Nominatim`);
      return coords;
    }
  } catch (err) {
    console.warn(`⚠️ Nominatim geocoding failed for "${cityName}":`, err.message);
  }

  // Final fallback — deterministic hash within India bounds
  let hash = 0;
  for (let i = 0; i < cityName.length; i++) {
    hash = ((hash << 5) - hash + cityName.charCodeAt(i)) | 0;
  }
  const lat = 10 + Math.abs(hash % 2000) / 100;
  const lng = 72 + Math.abs((hash >> 8) % 1600) / 100;
  return [lat, lng];
}

function getCityCoordsCached(cityName) {
  const key = cityName.trim().toLowerCase();
  if (cityCoords[key]) return cityCoords[key];
  for (const [name, coords] of Object.entries(cityCoords)) {
    if (key.includes(name) || name.includes(key)) return coords;
  }
  return null;
}

// ═══════════════════════════════════════════════════
// OSRM — Open Source Routing Machine (free, no key)
// ═══════════════════════════════════════════════════
async function fetchOSRMRoute(originCoord, destCoord, alternatives = true) {
  // OSRM uses [lng, lat] format
  const coords = `${originCoord[1]},${originCoord[0]};${destCoord[1]},${destCoord[0]}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&alternatives=${alternatives}&steps=false`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'SmartSupplyChainOptimizer/1.0' }
  });

  if (!res.ok) throw new Error(`OSRM returned ${res.status}`);

  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error(`OSRM: ${data.code} — ${data.message || 'No routes found'}`);
  }

  return data.routes;
}

// Convert OSRM GeoJSON coordinates to [lat, lng] waypoints (sampled)
function sampleRouteWaypoints(geojsonCoords, maxPoints = 200) {
  if (geojsonCoords.length <= maxPoints) {
    return geojsonCoords.map(([lng, lat]) => [lat, lng]);
  }
  const step = Math.floor(geojsonCoords.length / maxPoints);
  const sampled = [];
  for (let i = 0; i < geojsonCoords.length; i += step) {
    const [lng, lat] = geojsonCoords[i];
    sampled.push([lat, lng]);
  }
  // Always include the last point
  const last = geojsonCoords[geojsonCoords.length - 1];
  sampled.push([last[1], last[0]]);
  return sampled;
}

// ═══════════════════════════════════════════════════
// Route generation — OSRM with fallback
// ═══════════════════════════════════════════════════
async function generateRoutes(origin, destination) {
  try {
    // Resolve coordinates
    const originCoord = await geocodeCity(origin);
    const destCoord = await geocodeCity(destination);

    // Try OSRM first for real road-following routes
    const osrmRoutes = await fetchOSRMRoute(originCoord, destCoord, true);
    console.log(`🛣️ OSRM returned ${osrmRoutes.length} route(s) for ${origin} → ${destination}`);

    return buildRoutesFromOSRM(origin, destination, osrmRoutes);
  } catch (err) {
    console.warn(`⚠️ OSRM failed, using fallback:`, err.message);

    // Fallback to mock waypoints or synthetic routes
    const key = `${origin}-${destination}`;
    const waypoints = routeWaypoints[key];
    if (waypoints) {
      return buildRoutesFromWaypoints(origin, destination, waypoints);
    }
    return generateSyntheticRoutes(origin, destination);
  }
}

function buildRoutesFromOSRM(origin, destination, osrmRoutes) {
  const now = new Date();
  const routeTypes = [
    { id: 'route_A', name: 'Fastest Route (NH)', type: 'primary', highlights: ['Highway driving', 'Fastest option', 'Multiple fuel stations'] },
    { id: 'route_B', name: 'Alternative Route (SH)', type: 'alternate', highlights: ['Less traffic', 'Scenic route', 'Lower toll cost'] },
    { id: 'route_C', name: 'Expressway Route', type: 'expressway', highlights: ['Expressway speed', 'Smooth roads', 'Rest areas available'] }
  ];

  const results = osrmRoutes.slice(0, 3).map((osrmRoute, idx) => {
    const distanceKm = Math.round(osrmRoute.distance / 1000);
    const durationMinutes = Math.round(osrmRoute.duration / 60);
    const hours = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    const waypoints = sampleRouteWaypoints(osrmRoute.geometry.coordinates);
    const meta = routeTypes[idx] || routeTypes[0];

    return {
      id: meta.id,
      name: meta.name,
      type: meta.type,
      waypoints,
      summary: `${origin} → ${destination} via ${meta.name}`,
      distance: `${distanceKm} km`,
      distanceKm,
      duration: `${hours}h ${mins}m`,
      durationMinutes,
      trafficScore: Math.round(30 + Math.random() * 40),
      tollCost: `₹${Math.round(distanceKm * (idx === 2 ? 2.8 : idx === 1 ? 0.6 : 1.5))}`,
      fuelCost: `₹${Math.round(distanceKm * 7.5)}`,
      totalCost: `₹${Math.round(distanceKm * (7.5 + (idx === 2 ? 2.8 : idx === 1 ? 0.6 : 1.5)))}`,
      highlights: meta.highlights,
      source: 'osrm',
      generatedAt: now.toISOString()
    };
  });

  // If OSRM returned fewer than 3 routes, generate synthetic alternates
  while (results.length < 3) {
    const base = results[0];
    const idx = results.length;
    const meta = routeTypes[idx];
    const factor = idx === 1 ? 1.12 : 0.92;
    const distanceKm = Math.round(base.distanceKm * factor);
    const durationMinutes = Math.round(base.durationMinutes * (idx === 1 ? 1.2 : 0.85));
    const hours = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;

    let waypoints;

    if (idx === 2) {
      // ── EXPRESSWAY: Blend toward direct line (straighter, smoother) ──
      const origin = base.waypoints[0];
      const dest = base.waypoints[base.waypoints.length - 1];
      waypoints = base.waypoints.map(([lat, lng], i, arr) => {
        if (i === 0 || i === arr.length - 1) return [lat, lng];
        const t = i / (arr.length - 1);
        const directLat = origin[0] + (dest[0] - origin[0]) * t;
        const directLng = origin[1] + (dest[1] - origin[1]) * t;
        // 65% original road + 35% direct line = realistically straighter
        return [lat * 0.65 + directLat * 0.35, lng * 0.65 + directLng * 0.35];
      });
    } else {
      // ── ALTERNATE: Smooth lateral offset using moving average ──
      // First compute raw perpendicular offsets
      const rawOffsets = base.waypoints.map(([lat, lng], i, arr) => {
        if (i === 0 || i === arr.length - 1) return [0, 0];
        // Use wider window for smoother perpendicular direction
        const backIdx = Math.max(0, i - 5);
        const fwdIdx = Math.min(arr.length - 1, i + 5);
        const dx = arr[fwdIdx][1] - arr[backIdx][1];
        const dy = arr[fwdIdx][0] - arr[backIdx][0];
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        return [-dx / len * 0.18, dy / len * 0.18];
      });

      // Apply moving average to smooth out jitter
      const windowSize = 15;
      waypoints = base.waypoints.map(([lat, lng], i, arr) => {
        if (i === 0 || i === arr.length - 1) return [lat, lng];
        let sumLat = 0, sumLng = 0, count = 0;
        for (let j = Math.max(1, i - windowSize); j <= Math.min(arr.length - 2, i + windowSize); j++) {
          sumLat += rawOffsets[j][0];
          sumLng += rawOffsets[j][1];
          count++;
        }
        return [lat + sumLat / count, lng + sumLng / count];
      });
    }

    results.push({
      id: meta.id,
      name: meta.name,
      type: meta.type,
      waypoints,
      summary: `${origin} → ${destination} via ${meta.name}`,
      distance: `${distanceKm} km`,
      distanceKm,
      duration: `${hours}h ${mins}m`,
      durationMinutes,
      trafficScore: Math.round(25 + Math.random() * 30),
      tollCost: `₹${Math.round(distanceKm * (idx === 2 ? 2.8 : 0.6))}`,
      fuelCost: `₹${Math.round(distanceKm * 7.5)}`,
      totalCost: `₹${Math.round(distanceKm * (7.5 + (idx === 2 ? 2.8 : 0.6)))}`,
      highlights: meta.highlights,
      source: 'osrm-synthetic',
      generatedAt: new Date().toISOString()
    });
  }

  return results;
}

// ═══════════════════════════════════════════════════
// Fallback — synthetic routes (when OSRM is down)
// ═══════════════════════════════════════════════════
function buildRoutesFromWaypoints(origin, destination, waypoints) {
  const now = new Date();
  const baseDistance = estimateDistance(waypoints.primary);
  const altDistance = estimateDistance(waypoints.alternate || waypoints.primary);

  return [
    {
      id: 'route_A',
      name: 'National Highway (Fastest)',
      type: 'primary',
      waypoints: waypoints.primary,
      summary: `Via NH — Direct route through major cities`,
      distance: `${Math.round(baseDistance)} km`,
      distanceKm: Math.round(baseDistance),
      duration: `${Math.round(baseDistance / 60)}h ${Math.round((baseDistance / 60 % 1) * 60)}m`,
      durationMinutes: Math.round(baseDistance / 60 * 60),
      trafficScore: Math.round(50 + Math.random() * 30),
      tollCost: `₹${Math.round(baseDistance * 1.5)}`,
      fuelCost: `₹${Math.round(baseDistance * 7.5)}`,
      totalCost: `₹${Math.round(baseDistance * 9)}`,
      highlights: ['Toll roads', 'High speed', 'Multiple fuel stations'],
      source: 'fallback',
      generatedAt: now.toISOString()
    },
    {
      id: 'route_B',
      name: 'State Highway (Balanced)',
      type: 'alternate',
      waypoints: waypoints.alternate || generateParallelWaypoints(waypoints.primary),
      summary: `Via SH — Alternate route avoiding major congestion points`,
      distance: `${Math.round(altDistance * 1.12)} km`,
      distanceKm: Math.round(altDistance * 1.12),
      duration: `${Math.round(altDistance / 50)}h ${Math.round((altDistance / 50 % 1) * 60)}m`,
      durationMinutes: Math.round(altDistance / 50 * 60),
      trafficScore: Math.round(25 + Math.random() * 25),
      tollCost: `₹${Math.round(altDistance * 0.6)}`,
      fuelCost: `₹${Math.round(altDistance * 1.12 * 7.5)}`,
      totalCost: `₹${Math.round(altDistance * 1.12 * 8.1)}`,
      highlights: ['Less traffic', 'Scenic route', 'Lower toll cost'],
      source: 'fallback',
      generatedAt: now.toISOString()
    },
    {
      id: 'route_C',
      name: 'Expressway (Premium)',
      type: 'expressway',
      waypoints: generateExpresswayWaypoints(waypoints.primary),
      summary: `Via Expressway — Fastest but highest toll`,
      distance: `${Math.round(baseDistance * 0.92)} km`,
      distanceKm: Math.round(baseDistance * 0.92),
      duration: `${Math.round(baseDistance * 0.92 / 80)}h ${Math.round((baseDistance * 0.92 / 80 % 1) * 60)}m`,
      durationMinutes: Math.round(baseDistance * 0.92 / 80 * 60),
      trafficScore: Math.round(35 + Math.random() * 20),
      tollCost: `₹${Math.round(baseDistance * 2.8)}`,
      fuelCost: `₹${Math.round(baseDistance * 0.92 * 7.5)}`,
      totalCost: `₹${Math.round(baseDistance * 0.92 * 7.5 + baseDistance * 2.8)}`,
      highlights: ['Expressway speed', 'Smooth roads', 'Rest areas available'],
      source: 'fallback',
      generatedAt: now.toISOString()
    }
  ];
}

function generateSyntheticRoutes(origin, destination) {
  const originCoord = getCityCoordsCached(origin) || [19.0760, 72.8777];
  const destCoord = getCityCoordsCached(destination) || [28.6139, 77.2090];

  const midLat = (originCoord[0] + destCoord[0]) / 2;
  const midLng = (originCoord[1] + destCoord[1]) / 2;
  const offset1 = [(Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5];
  const offset2 = [(Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5];

  const mockWaypoints = {
    primary: [
      originCoord,
      [(originCoord[0] * 2 + destCoord[0]) / 3 + offset1[0], (originCoord[1] * 2 + destCoord[1]) / 3 + offset1[1]],
      [midLat, midLng],
      [(originCoord[0] + destCoord[0] * 2) / 3 + offset2[0], (originCoord[1] + destCoord[1] * 2) / 3 + offset2[1]],
      destCoord
    ],
    alternate: [
      originCoord,
      [(originCoord[0] * 2 + destCoord[0]) / 3 + offset1[0] + 0.5, (originCoord[1] * 2 + destCoord[1]) / 3 + offset1[1] - 0.5],
      [midLat + 0.4, midLng - 0.3],
      [(originCoord[0] + destCoord[0] * 2) / 3 + offset2[0] - 0.3, (originCoord[1] + destCoord[1] * 2) / 3 + offset2[1] + 0.4],
      destCoord
    ]
  };

  return buildRoutesFromWaypoints(origin, destination, mockWaypoints);
}

// ═══════════════════════════════════════════════════
// Utility functions
// ═══════════════════════════════════════════════════
function generateParallelWaypoints(waypoints) {
  if (waypoints.length < 2) return waypoints;
  // Calculate perpendicular offset direction for a smooth parallel route
  return waypoints.map(([lat, lng], i, arr) => {
    if (i === 0 || i === arr.length - 1) return [lat, lng]; // keep origin/destination same
    // Use consistent offset in one direction (not alternating)
    const prevLat = arr[Math.max(0, i - 1)][0];
    const prevLng = arr[Math.max(0, i - 1)][1];
    const nextLat = arr[Math.min(arr.length - 1, i + 1)][0];
    const nextLng = arr[Math.min(arr.length - 1, i + 1)][1];
    // Perpendicular direction (rotate 90 degrees)
    const dx = nextLng - prevLng;
    const dy = nextLat - prevLat;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const perpLat = -dx / len * 0.25;
    const perpLng = dy / len * 0.25;
    return [lat + perpLat, lng + perpLng];
  });
}

function generateExpresswayWaypoints(waypoints) {
  if (waypoints.length < 2) return waypoints;
  // Create a straighter route (expressway) by reducing intermediate detours
  return waypoints.map(([lat, lng], i, arr) => {
    if (i === 0 || i === arr.length - 1) return [lat, lng];
    // Blend toward the direct line between origin and destination
    const t = i / (arr.length - 1);
    const directLat = arr[0][0] + (arr[arr.length - 1][0] - arr[0][0]) * t;
    const directLng = arr[0][1] + (arr[arr.length - 1][1] - arr[0][1]) * t;
    // 60% original route + 40% direct line = straighter but still realistic
    return [lat * 0.6 + directLat * 0.4, lng * 0.6 + directLng * 0.4];
  });
}

function estimateDistance(waypoints) {
  let dist = 0;
  for (let i = 1; i < waypoints.length; i++) {
    dist += haversine(waypoints[i - 1], waypoints[i]);
  }
  return dist;
}

function haversine([lat1, lng1], [lat2, lng2]) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return deg * Math.PI / 180; }

// Generate Google Maps link for navigation
function getNavigationLink(origin, destination) {
  const o = encodeURIComponent(origin + ', India');
  const d = encodeURIComponent(destination + ', India');
  return `https://www.google.com/maps/dir/${o}/${d}`;
}

// Simulate traffic score for a route
function getTrafficScore(route) {
  const baseScore = route.trafficScore || 40;
  const variation = (Math.random() - 0.5) * 15;
  return Math.round(Math.min(100, Math.max(0, baseScore + variation)));
}

module.exports = { generateRoutes, getNavigationLink, getTrafficScore, geocodeCity };

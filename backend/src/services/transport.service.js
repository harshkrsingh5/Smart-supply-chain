// Multi-Modal Transport Service
// Simulates Road, Air, and Rail options with cost and time estimates

const TRANSPORT_MODES = {
  ROAD: { id: 'road', name: 'Road Freight', icon: '🚛', baseSpeedKmh: 60, costPerKm: 12, co2PerKm: 0.15 },
  AIR:  { id: 'air',  name: 'Air Cargo',   icon: '✈️', baseSpeedKmh: 750, costPerKm: 85, co2PerKm: 0.65 },
  RAIL: { id: 'rail', name: 'Rail Freight', icon: '🚂', baseSpeedKmh: 80, costPerKm: 6, co2PerKm: 0.04 }
};

// Major Indian railway connections
const railRoutes = {
  'Mumbai-Delhi':       { available: true, trainName: 'Rajdhani Express', frequency: '2x Daily', stops: 3 },
  'Bangalore-Chennai':  { available: true, trainName: 'Shatabdi Express', frequency: '3x Daily', stops: 1 },
  'Hyderabad-Pune':     { available: true, trainName: 'Duronto Express', frequency: '1x Daily', stops: 2 },
  'Kolkata-Bhubaneswar':{ available: true, trainName: 'Konark Express', frequency: '4x Daily', stops: 5 },
  'Ahmedabad-Jaipur':   { available: true, trainName: 'Ashram Express', frequency: '2x Daily', stops: 4 }
};

// Major Indian airports
const airRoutes = {
  'Mumbai-Delhi':       { available: true, airline: 'IndiGo / Air India', frequency: '15x Daily', airport: 'CSIA → IGI' },
  'Bangalore-Chennai':  { available: true, airline: 'SpiceJet / Vistara', frequency: '8x Daily', airport: 'BLR → MAA' },
  'Hyderabad-Pune':     { available: true, airline: 'Vistara / IndiGo', frequency: '5x Daily', airport: 'HYD → PNQ' },
  'Kolkata-Bhubaneswar':{ available: true, airline: 'IndiGo / Air Asia', frequency: '4x Daily', airport: 'CCU → BBI' },
  'Ahmedabad-Jaipur':   { available: true, airline: 'SpiceJet / Go First', frequency: '3x Daily', airport: 'AMD → JAI' }
};

function getTransportOptions(origin, destination, distanceKm, cargoWeight = 1000) {
  const routeKey = `${origin}-${destination}`;
  const rail = railRoutes[routeKey];
  const air = airRoutes[routeKey];

  const options = [];

  // Road Option
  const roadTime = distanceKm / TRANSPORT_MODES.ROAD.baseSpeedKmh;
  const roadCost = distanceKm * TRANSPORT_MODES.ROAD.costPerKm * (cargoWeight / 1000);
  options.push({
    mode: 'road',
    name: 'Road Freight',
    icon: '🚛',
    available: true,
    estimatedTime: formatDuration(roadTime),
    estimatedTimeHours: roadTime,
    estimatedCost: `₹${Math.round(roadCost).toLocaleString()}`,
    costValue: Math.round(roadCost),
    details: 'Door-to-door delivery. Most flexible for timing.',
    advantages: ['Direct delivery', 'Flexible schedule', 'Real-time tracking'],
    disadvantages: ['Affected by traffic', 'Slower for long distances'],
    co2: `${(distanceKm * TRANSPORT_MODES.ROAD.co2PerKm).toFixed(1)} kg CO₂`,
    riskLevel: 'MEDIUM',
    frequency: '24/7'
  });

  // Air Option
  if (air && air.available) {
    const airTransitTime = distanceKm / TRANSPORT_MODES.AIR.baseSpeedKmh;
    const airTotalTime = airTransitTime + 4; // +4h for processing/customs
    const airCost = distanceKm * TRANSPORT_MODES.AIR.costPerKm * (cargoWeight / 1000);
    options.push({
      mode: 'air',
      name: 'Air Cargo',
      icon: '✈️',
      available: true,
      estimatedTime: formatDuration(airTotalTime),
      estimatedTimeHours: airTotalTime,
      estimatedCost: `₹${Math.round(airCost).toLocaleString()}`,
      costValue: Math.round(airCost),
      details: `${air.airline} — ${air.frequency}. Route: ${air.airport}`,
      advantages: ['Fastest option', 'Unaffected by road conditions', 'High security'],
      disadvantages: ['Most expensive', 'Size/weight restrictions', 'Airport handling time'],
      co2: `${(distanceKm * TRANSPORT_MODES.AIR.co2PerKm).toFixed(1)} kg CO₂`,
      riskLevel: 'LOW',
      frequency: air.frequency
    });
  }

  // Rail Option
  if (rail && rail.available) {
    const railTime = distanceKm / TRANSPORT_MODES.RAIL.baseSpeedKmh + 2; // +2h for loading
    const railCost = distanceKm * TRANSPORT_MODES.RAIL.costPerKm * (cargoWeight / 1000);
    options.push({
      mode: 'rail',
      name: 'Rail Freight',
      icon: '🚂',
      available: true,
      estimatedTime: formatDuration(railTime),
      estimatedTimeHours: railTime,
      estimatedCost: `₹${Math.round(railCost).toLocaleString()}`,
      costValue: Math.round(railCost),
      details: `${rail.trainName} — ${rail.frequency}. ${rail.stops} intermediate stops.`,
      advantages: ['Cost-effective', 'Eco-friendly', 'Punctual schedule'],
      disadvantages: ['Fixed schedule', 'Limited routes', 'Last-mile needed'],
      co2: `${(distanceKm * TRANSPORT_MODES.RAIL.co2PerKm).toFixed(1)} kg CO₂`,
      riskLevel: 'LOW',
      frequency: rail.frequency
    });
  }

  // Add optimization recommendations
  const cheapest = [...options].sort((a, b) => a.costValue - b.costValue)[0];
  const fastest = [...options].sort((a, b) => a.estimatedTimeHours - b.estimatedTimeHours)[0];
  const balanced = options.find(o => o.mode === 'rail') || cheapest;

  return {
    options,
    recommendation: {
      cheapest: cheapest.mode,
      fastest: fastest.mode,
      balanced: balanced.mode
    }
  };
}

function formatDuration(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

module.exports = { getTransportOptions };

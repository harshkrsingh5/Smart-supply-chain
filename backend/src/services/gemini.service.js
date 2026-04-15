const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

async function generateRiskAnalysis({ origin, destination, riskScore, riskLevel, trafficScore, weatherScore, newsScore, weatherCondition, newsHeadlines }) {
  try {
    const prompt = `You are a logistics AI assistant for a smart supply chain management system in India.

Analyze this route and provide a concise risk assessment:
- Route: ${origin} → ${destination}
- Disruption Score: ${riskScore}/100 (${riskLevel} Risk)
- Traffic Score: ${trafficScore}/100 (weight: 35%)
- Weather Score: ${weatherScore}/100 (weight: 30%) - Current: ${weatherCondition}
- News/Disruption Score: ${newsScore}/100 (weight: 25%)
- Top News: ${newsHeadlines?.slice(0, 2).join('; ') || 'No major disruptions'}

Provide a JSON response with exactly these fields:
{
  "summary": "2-sentence summary of current route conditions",
  "primaryConcern": "main risk factor in 10 words",
  "recommendation": "specific action recommendation for the driver in 15 words",
  "alternateRouteAdvised": true or false,
  "estimatedDelay": "delay estimate like '45 minutes' or 'None'",
  "driverTip": "one practical safety tip for this specific route"
}

Be specific, practical, and concise. Reference actual conditions.`;

    const response = await axios.post(GEMINI_URL, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 400 }
    }, { timeout: 10000 });

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return getFallbackAnalysis(riskScore, riskLevel, origin, destination);
  } catch (err) {
    console.error('Gemini API error:', err.message);
    return getFallbackAnalysis(riskScore, riskLevel, origin, destination);
  }
}

async function generateRouteOptimization({ routes, shipmentId, cargo }) {
  try {
    const routeSummary = routes.map(r => `${r.name}: Score ${r.riskScore || 50}/100, ${r.duration}, ₹${r.totalCost}`).join('\n');

    const prompt = `You are a route optimization AI for Indian logistics.

Shipment: Cargo = ${cargo}
Available routes:
${routeSummary}

Recommend the best route and explain why in JSON:
{
  "bestRouteId": "route_A or route_B or route_C",
  "reasoning": "2-sentence explanation",
  "estimatedSaving": "time or cost saving vs other routes",
  "confidenceLevel": "High/Medium/Low"
}`;

    const response = await axios.post(GEMINI_URL, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 200 }
    }, { timeout: 8000 });

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return getFallbackOptimization(routes, cargo);
  } catch (err) {
    console.error('Gemini optimization error:', err.message);
    return getFallbackOptimization(routes, cargo);
  }
}

function getFallbackOptimization(routes, cargo) {
  if (!routes || routes.length === 0) {
    return { bestRouteId: 'route_A', reasoning: 'Default route selected.', estimatedSaving: 'N/A', confidenceLevel: 'Low' };
  }

  // Score each route: lower riskScore is better, factor in cost and time
  const scored = routes.map(r => {
    const risk = r.riskScore || 50;
    const dist = r.distanceKm || 500;
    const mins = r.durationMinutes || 600;
    const costStr = (r.totalCost || '0').replace(/[₹,]/g, '');
    const cost = parseInt(costStr) || 5000;

    // Weighted composite: lower = better
    // For sensitive cargo, weight risk more; otherwise balance cost/speed
    let riskWeight = 0.4, timeWeight = 0.3, costWeight = 0.3;
    const cargoLower = (cargo || '').toLowerCase();
    if (cargoLower.includes('pharma') || cargoLower.includes('electronics')) {
      riskWeight = 0.55; timeWeight = 0.25; costWeight = 0.2;
    } else if (cargoLower.includes('food')) {
      riskWeight = 0.35; timeWeight = 0.45; costWeight = 0.2;
    }

    const composite = (risk / 100) * riskWeight + (mins / 2000) * timeWeight + (cost / 50000) * costWeight;
    return { ...r, composite };
  });

  scored.sort((a, b) => a.composite - b.composite);
  const best = scored[0];
  const worst = scored[scored.length - 1];

  // Calculate actual savings
  const timeSavingMins = (worst.durationMinutes || 600) - (best.durationMinutes || 600);
  const bestCost = parseInt((best.totalCost || '0').replace(/[₹,]/g, '')) || 0;
  const worstCost = parseInt((worst.totalCost || '0').replace(/[₹,]/g, '')) || 0;
  const costSaving = worstCost - bestCost;

  let savingText = '';
  if (timeSavingMins > 30 && costSaving > 500) {
    savingText = `~${Math.round(timeSavingMins)} min faster & ₹${costSaving.toLocaleString()} cheaper vs worst option`;
  } else if (timeSavingMins > 30) {
    savingText = `~${Math.round(timeSavingMins)} minutes faster than the slowest route`;
  } else if (costSaving > 500) {
    savingText = `₹${costSaving.toLocaleString()} cheaper than the most expensive option`;
  } else {
    savingText = `Lowest overall risk score at ${best.riskScore || 'N/A'}/100`;
  }

  // Generate reasoning based on WHY this route won
  const reasons = [];
  if (best.riskScore <= 35) reasons.push(`lowest risk score (${best.riskScore}/100)`);
  else if (best.riskScore <= 55) reasons.push(`moderate risk score (${best.riskScore}/100)`);
  else reasons.push(`risk score of ${best.riskScore}/100 is best available`);

  if (best.id === 'route_A') reasons.push('direct NH route offers fastest travel time');
  else if (best.id === 'route_B') reasons.push('alternate SH route avoids congestion hotspots');
  else if (best.id === 'route_C') reasons.push('expressway offers premium speed despite higher tolls');

  const cargoNote = (cargo || '').toLowerCase().includes('pharma') ? ' Critical cargo prioritizes safety over speed.'
    : (cargo || '').toLowerCase().includes('food') ? ' Perishable cargo prioritizes faster delivery.'
    : (cargo || '').toLowerCase().includes('electronics') ? ' High-value cargo prioritizes lower risk.'
    : '';

  const confidence = best.riskScore <= 30 ? 'High' : best.riskScore <= 55 ? 'Medium' : 'Low';

  return {
    bestRouteId: best.id,
    reasoning: `${best.name} selected for ${reasons.join(' and ')}.${cargoNote}`,
    estimatedSaving: savingText,
    confidenceLevel: confidence
  };
}

function getFallbackAnalysis(riskScore, riskLevel, origin, destination) {
  if (riskScore >= 70) {
    return {
      summary: `The ${origin} to ${destination} route is currently experiencing HIGH risk conditions due to combined traffic, weather, and road disruptions. Immediate attention required.`,
      primaryConcern: 'Multiple simultaneous disruptions on primary highway',
      recommendation: 'Switch to alternate route immediately and reduce speed to 40 km/h in affected zones.',
      alternateRouteAdvised: true,
      estimatedDelay: '1.5 - 2 hours',
      driverTip: 'Enable hazard lights and maintain 3x normal following distance in high-risk zones.'
    };
  } else if (riskScore >= 40) {
    return {
      summary: `The ${origin} to ${destination} route has MEDIUM risk. Some delays expected due to traffic and weather conditions. Exercise caution.`,
      primaryConcern: 'Moderate traffic congestion and weather variability',
      recommendation: 'Continue on current route. Monitor updates every 30 minutes for escalation.',
      alternateRouteAdvised: false,
      estimatedDelay: '30 - 60 minutes',
      driverTip: 'Keep fuel tank above half and check tire pressure before proceeding.'
    };
  }
  return {
    summary: `The ${origin} to ${destination} route is operating under LOW risk conditions. Traffic is moving smoothly and weather is favorable.`,
    primaryConcern: 'No significant disruptions detected',
    recommendation: 'Proceed on primary route. Maintain standard safety protocols.',
    alternateRouteAdvised: false,
    estimatedDelay: 'None expected',
    driverTip: 'Ideal driving conditions — stay hydrated and take breaks every 2 hours.'
  };
}

module.exports = { generateRiskAnalysis, generateRouteOptimization };

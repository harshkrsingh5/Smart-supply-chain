const axios = require('axios');

const NEWSAPI_KEY = process.env.NEWSAPI_KEY;

// Fetch real-time logistics disruption news
async function fetchDisruptionNews(origin = '', destination = '') {
  try {
    const query = `logistics disruption road accident India ${origin} ${destination}`.trim();
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWSAPI_KEY}`;

    const response = await axios.get(url, { timeout: 8000 });
    const articles = response.data.articles || [];

    return {
      articles: articles.map(a => ({
        title: a.title,
        description: a.description,
        url: a.url,
        source: a.source?.name,
        publishedAt: a.publishedAt,
        urlToImage: a.urlToImage
      })),
      totalResults: response.data.totalResults,
      source: 'newsapi'
    };
  } catch (err) {
    console.error('NewsAPI error:', err.message);
    return getFallbackNews(origin, destination);
  }
}

// Fetch India transport news (for dashboard)
async function fetchTransportNews() {
  try {
    const query = 'India road accident highway closure logistics supply chain disruption 2024';
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=8&apiKey=${NEWSAPI_KEY}`;

    const response = await axios.get(url, { timeout: 8000 });
    return response.data.articles || [];
  } catch (err) {
    console.error('NewsAPI transport error:', err.message);
    return getMockNewsArticles();
  }
}

// Realistic mock news when API unavailable
function getFallbackNews(origin = 'Mumbai', destination = 'Delhi') {
  return {
    articles: getMockNewsArticles(origin, destination),
    totalResults: 5,
    source: 'simulation'
  };
}

function getMockNewsArticles(origin = 'Mumbai', destination = 'Delhi') {
  return [
    {
      title: `Heavy traffic congestion reported on NH48 near ${origin} — delays expected`,
      description: 'Commuters face long queues due to ongoing road construction. Traffic moving at 15 km/h.',
      url: '#',
      source: 'Times of India',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      title: 'Truck drivers protest in Gujarat affecting supply chain routes',
      description: 'Transporters on strike demanding fuel price relief, causing disruptions on NH48.',
      url: '#',
      source: 'The Hindu',
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    },
    {
      title: `Road accident on expressway between ${origin} and ${destination}`,
      description: 'Multi-vehicle collision causing 3km tailback. Police on scene, traffic diversion in place.',
      url: '#',
      source: 'NDTV',
      publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    },
    {
      title: 'Fog-related disruptions in North India affecting visibility',
      description: 'Dense fog reducing visibility to below 100m on NH44 corridor. Multiple flights and trains delayed.',
      url: '#',
      source: 'Indian Express',
      publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    },
    {
      title: 'NHAI completes emergency road repair on key freight corridor',
      description: 'Delhi-Mumbai corridor pothole patching complete, smooth movement restored on 47km stretch.',
      url: '#',
      source: 'Business Standard',
      publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    }
  ];
}

module.exports = { fetchDisruptionNews, fetchTransportNews, getMockNewsArticles };

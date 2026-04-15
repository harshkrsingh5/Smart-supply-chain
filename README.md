<div align="center">

# 🚛 Smart Supply Chain Optimizer

### AI-Powered Logistics Disruption Prediction & Real-Time Route Optimization

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Vercel-000?style=for-the-badge&logo=vercel)](https://smart-supply-chain-gamma.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/harshkrsingh5/Smart-supply-chain)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

<br/>

> **A full-stack logistics intelligence platform** that uses AI, real-time weather data, and live news feeds to predict supply chain disruptions, optimize delivery routes, and provide multi-modal transport recommendations — all visualized on an interactive map dashboard.

</div>

---

## 📋 Table of Contents

- [✨ Key Features](#-key-features)
- [🏗️ Architecture](#️-architecture)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [📁 Project Structure](#-project-structure)
- [🔌 API Documentation](#-api-documentation)
- [🌐 Deployment](#-deployment)
- [👥 Team](#-team)
- [📄 License](#-license)

---

## ✨ Key Features

### 🧠 AI-Powered Risk Engine
- **Weighted Risk Scoring** — Combines traffic (40%), weather (35%), and news disruption (25%) signals into a real-time composite risk score
- **Gemini AI Integration** — Generates intelligent route recommendations and disruption analysis
- **Auto-fluctuating Scores** — Simulates live data feeds with periodic score updates every 8 seconds

### 🗺️ Smart Route Optimization
- **OSRM-based Routing** — Open-source routing engine for accurate road-network-based route calculation
- **Multi-route Comparison** — Primary vs. alternate routes with distance, duration, and risk analysis
- **Catmull-Rom Spline Smoothing** — Eliminates zigzag artifacts for smooth, realistic route visualization

### 🌦️ Real-Time Weather Intelligence
- **Open-Meteo API** — Free, real-time weather data for origin and destination cities
- **Weather Impact Scoring** — Translates conditions (rain, snow, fog) into logistics risk metrics
- **Automatic Fallback** — Gracefully degrades to simulation if API is unavailable

### 🚛 Fleet Management
- **Truck Registration** — Add trucks with number plate, driver name, type, and capacity
- **Fleet Overview** — Real-time status tracking (Available / In Transit / Maintenance)
- **Driver Assignment** — Associate drivers with vehicles for shipment tracking

### 📊 Role-Based Dashboards

| Role | Features |
|------|----------|
| **Manager** | Full dashboard with risk gauges, fleet management, alert system, shipment monitoring |
| **Driver** | Assigned shipments, navigation view, route details, delivery status updates |

### 🔔 Intelligent Alert System
- **Multi-severity Alerts** — HIGH / MEDIUM / LOW with visual indicators
- **Acknowledge Workflow** — Managers can acknowledge and track alert resolution
- **Real-time Banner** — Critical alerts displayed as a persistent banner

### 🚆 Multi-Modal Transport
- **4 Transport Modes** — Road, Rail, Air, Sea comparison with cost, time, and carbon estimates
- **Smart Recommendations** — AI suggests optimal mode based on cargo type, weight, and urgency

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  Login   │  │ Manager  │  │  Driver  │  │  Route  │ │
│  │  Page    │  │Dashboard │  │Interface │  │Optimizer│ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       └──────────────┼───────────┬─┘             │      │
│              ┌───────▼───────────▼───────────────▼┐     │
│              │       API Service (Axios)           │     │
│              └───────────────┬─────────────────────┘     │
└──────────────────────────────┼───────────────────────────┘
                               │ REST API
┌──────────────────────────────▼───────────────────────────┐
│                  BACKEND (Node.js + Express)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │   Auth   │  │ Shipment │  │  Route   │  │  Truck   │ │
│  │ (JWT)    │  │Controller│  │Controller│  │Controller│ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
│       └──────────────┼────────────┬┘             │       │
│              ┌───────▼────────────▼──────────────▼┐      │
│              │         Service Layer               │      │
│  ┌───────────┼─────────────────────────────────────┤      │
│  │ Weather   │  Maps/OSRM  │  Gemini AI  │  News  │      │
│  │ Service   │  Service    │  Service    │Service │      │
│  └───────────┴─────────────┴────────────┴────────┘      │
└──────────────────────────────────────────────────────────┘
                    │           │          │
          ┌────────▼┐   ┌─────▼────┐  ┌──▼───────┐
          │Open-Meteo│   │   OSRM   │  │ NewsAPI  │
          │  Weather │   │  Routing  │  │   Feed   │
          └──────────┘   └──────────┘  └──────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** | UI framework with hooks & context |
| **Vite 8** | Lightning-fast build tool |
| **MapLibre GL** | Interactive map visualization |
| **Axios** | HTTP client with interceptors |
| **React Router v7** | Client-side routing |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js** | JavaScript runtime |
| **Express 4** | REST API framework |
| **JWT** | Role-based authentication |
| **bcryptjs** | Password hashing |
| **node-cron** | Scheduled data simulation |

### External APIs
| API | Purpose |
|-----|---------|
| **Open-Meteo** | Real-time weather data (free) |
| **OSRM** | Open-source route calculation |
| **Google Gemini** | AI-powered route intelligence |
| **NewsAPI** | Supply chain news monitoring |
| **Google Maps JS** | Frontend map rendering |

### Deployment
| Service | Purpose |
|---------|---------|
| **Vercel** | Frontend hosting + Serverless functions |
| **GitHub** | Version control & CI/CD |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- API keys (optional, app works with simulation fallbacks)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/harshkrsingh5/Smart-supply-chain.git
cd Smart-supply-chain

# 2. Setup Backend
cd backend
npm install

# 3. Create environment file
cp .env.example .env
# Edit .env with your API keys (see Environment Variables below)

# 4. Setup Frontend
cd ../frontend
npm install
```

### Environment Variables

Create a `backend/.env` file:

```env
PORT=5000
JWT_SECRET=your_jwt_secret_key
NEWSAPI_KEY=your_newsapi_key
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

> **Note:** The app works without API keys using built-in simulation fallbacks.

### Running Locally

```bash
# Terminal 1 — Start Backend
cd backend
npm start
# ✅ Backend running at http://localhost:5000

# Terminal 2 — Start Frontend
cd frontend
npm run dev
# ✅ Frontend running at http://localhost:5173
```

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Manager** | `manager@sco.com` | `manager123` |
| **Driver** | `driver@sco.com` | `driver123` |
| **Driver 2** | `driver2@sco.com` | `driver123` |

---

## 📁 Project Structure

```
Smart-supply-chain/
├── api/                          # Vercel serverless entry point
│   └── index.js                  # Express app wrapper
├── backend/
│   └── src/
│       ├── controllers/
│       │   ├── auth.controller.js       # Login & JWT generation
│       │   ├── shipment.controller.js   # Shipment CRUD & stats
│       │   ├── route.controller.js      # Route generation & optimization
│       │   ├── truck.controller.js      # Fleet truck management
│       │   ├── monitoring.controller.js # Live shipment monitoring
│       │   └── alert.controller.js      # Alert management
│       ├── services/
│       │   ├── weather.service.js       # Open-Meteo weather integration
│       │   ├── maps.service.js          # OSRM routing engine
│       │   ├── gemini.service.js        # Google Gemini AI
│       │   ├── news.service.js          # NewsAPI integration
│       │   ├── scoring.service.js       # Risk scoring engine
│       │   └── transport.service.js     # Multi-modal comparison
│       ├── middleware/
│       │   └── auth.js                  # JWT verification middleware
│       ├── routes/                      # Express route definitions
│       ├── data/
│       │   └── mockData.js              # In-memory data store
│       └── index.js                     # Express app entry point
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── MapView.jsx              # Interactive map with routes
│       │   ├── Navbar.jsx               # Navigation bar
│       │   ├── RiskGauge.jsx            # Animated risk score gauge
│       │   ├── StatsCard.jsx            # Dashboard stat cards
│       │   ├── AlertBanner.jsx          # Critical alert banner
│       │   ├── RiskBadge.jsx            # Risk level badge
│       │   ├── RouteCard.jsx            # Route information card
│       │   └── TransportModal.jsx       # Transport mode comparison
│       ├── pages/
│       │   ├── Login.jsx                # Authentication page
│       │   ├── ManagerDashboard.jsx     # Manager control center
│       │   ├── DriverInterface.jsx      # Driver shipment view
│       │   └── RouteOptimizer.jsx       # AI route optimization
│       ├── context/
│       │   └── AuthContext.jsx          # JWT auth state management
│       ├── services/
│       │   └── api.js                   # Axios API service layer
│       ├── App.jsx                      # Root component with routing
│       └── index.css                    # Global design system
├── vercel.json                          # Vercel deployment config
└── package.json                         # Root dependencies
```

---

## 🔌 API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Login with email & password |

### Shipments
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/shipments` | List shipments (filtered by role) |
| `POST` | `/api/shipments` | Create new shipment |

### Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/routes/generate` | Generate optimized routes |
| `POST` | `/api/routes/transport` | Compare transport modes |

### Fleet (Trucks)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/trucks` | List all trucks with stats |
| `POST` | `/api/trucks` | Add new truck |
| `DELETE` | `/api/trucks/:id` | Remove truck from fleet |
| `PATCH` | `/api/trucks/:id/status` | Update truck status |

### Monitoring
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/monitor/:id` | Live monitoring data for shipment |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/alerts` | List all alerts |
| `POST` | `/api/alerts/ack` | Acknowledge an alert |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server health check |

> 🔒 All endpoints except `/api/auth/login` and `/api/health` require a Bearer JWT token in the `Authorization` header.

---

## 🌐 Deployment

The application is deployed on **Vercel** as a monorepo:

- **Frontend** → Static build (Vite)
- **Backend** → Serverless function (`@vercel/node`)

### Deploy Your Own

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Set environment variables
vercel env add JWT_SECRET production
vercel env add NEWSAPI_KEY production
vercel env add GEMINI_API_KEY production
vercel env add GOOGLE_MAPS_API_KEY production
```

---

## 👥 Team

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/harshkrsingh5">
        <img src="https://github.com/harshkrsingh5.png" width="100px;" alt=""/><br />
        <sub><b>Harsh Kumar Singh</b></sub>
      </a><br />
      <sub>Project Lead & Backend Architecture</sub>
    </td>
    <td align="center">
      <a href="https://github.com/Goutam-2702">
        <img src="https://github.com/Goutam-2702.png" width="100px;" alt=""/><br />
        <sub><b>Goutam Kumar Ghosal</b></sub>
      </a><br />
      <sub>Frontend Development & UI Design</sub>
    </td>
    <td align="center">
      <a href="https://github.com/garvit5347">
        <img src="https://github.com/garvit5347.png" width="100px;" alt=""/><br />
        <sub><b>Garvit</b></sub>
      </a><br />
      <sub>AI Services & Route Optimization</sub>
    </td>
  </tr>
</table>

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for smarter logistics**

[⬆ Back to Top](#-smart-supply-chain-optimizer)

</div>

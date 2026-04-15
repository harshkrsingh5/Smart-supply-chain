const bcrypt = require('bcryptjs');

// Pre-hashed passwords for demo users
const users = [
  {
    id: 'usr_001',
    name: 'Rajesh Kumar',
    email: 'manager@sco.com',
    password: bcrypt.hashSync('manager123', 10),
    role: 'manager',
    avatar: 'RK',
    phone: '+91-9876543210'
  },
  {
    id: 'usr_002',
    name: 'Arjun Singh',
    email: 'driver@sco.com',
    password: bcrypt.hashSync('driver123', 10),
    role: 'driver',
    avatar: 'AS',
    phone: '+91-9876541234',
    vehicleId: 'MH-12-AB-1234',
    assignedShipment: 'SHP_001'
  },
  {
    id: 'usr_003',
    name: 'Priya Patel',
    email: 'driver2@sco.com',
    password: bcrypt.hashSync('driver123', 10),
    role: 'driver',
    avatar: 'PP',
    phone: '+91-9876549876',
    vehicleId: 'KA-01-CD-5678',
    assignedShipment: 'SHP_003'
  }
];

// Fleet trucks
let trucks = [
  {
    id: 'TRK_001',
    truckNumber: 'MH-12-AB-1234',
    driverName: 'Arjun Singh',
    truckType: 'Heavy',
    capacity: '10,000 kg',
    status: 'In Transit',
    addedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'TRK_002',
    truckNumber: 'KA-01-CD-5678',
    driverName: 'Priya Patel',
    truckType: 'Medium',
    capacity: '5,000 kg',
    status: 'In Transit',
    addedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'TRK_003',
    truckNumber: 'KA-05-EF-9012',
    driverName: 'Vikram Sharma',
    truckType: 'Light',
    capacity: '3,000 kg',
    status: 'Available',
    addedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'TRK_004',
    truckNumber: 'WB-02-GH-3456',
    driverName: 'Suresh Das',
    truckType: 'Heavy',
    capacity: '12,000 kg',
    status: 'In Transit',
    addedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'TRK_005',
    truckNumber: 'GJ-01-IJ-7890',
    driverName: 'Mohan Verma',
    truckType: 'Medium',
    capacity: '6,000 kg',
    status: 'Available',
    addedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Shipments with Indian city routes
let shipments = [
  {
    id: 'SHP_001',
    trackingId: 'SCO-2024-001',
    origin: 'Mumbai',
    destination: 'Delhi',
    originCoords: [19.0760, 72.8777],
    destCoords: [28.6139, 77.2090],
    cargo: 'Electronics',
    weight: '2500 kg',
    driver: 'Arjun Singh',
    driverId: 'usr_002',
    vehicleId: 'MH-12-AB-1234',
    status: 'In Transit',
    riskScore: 72,
    riskLevel: 'HIGH',
    eta: '14h 30m',
    distance: '1414 km',
    startTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    estimatedArrival: new Date(Date.now() + 14.5 * 60 * 60 * 1000).toISOString(),
    currentLocation: { lat: 22.3072, lng: 73.1812, city: 'Vadodara' }
  },
  {
    id: 'SHP_002',
    trackingId: 'SCO-2024-002',
    origin: 'Bangalore',
    destination: 'Chennai',
    originCoords: [12.9716, 77.5946],
    destCoords: [13.0827, 80.2707],
    cargo: 'Pharmaceuticals',
    weight: '800 kg',
    driver: 'Vikram Sharma',
    driverId: 'usr_004',
    vehicleId: 'KA-05-EF-9012',
    status: 'In Transit',
    riskScore: 28,
    riskLevel: 'LOW',
    eta: '3h 15m',
    distance: '346 km',
    startTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    estimatedArrival: new Date(Date.now() + 3.25 * 60 * 60 * 1000).toISOString(),
    currentLocation: { lat: 12.8374, lng: 79.1020, city: 'Vellore' }
  },
  {
    id: 'SHP_003',
    trackingId: 'SCO-2024-003',
    origin: 'Hyderabad',
    destination: 'Pune',
    originCoords: [17.3850, 78.4867],
    destCoords: [18.5204, 73.8567],
    cargo: 'Automotive Parts',
    weight: '3200 kg',
    driver: 'Priya Patel',
    driverId: 'usr_003',
    vehicleId: 'KA-01-CD-5678',
    status: 'In Transit',
    riskScore: 55,
    riskLevel: 'MEDIUM',
    eta: '9h 45m',
    distance: '562 km',
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    estimatedArrival: new Date(Date.now() + 9.75 * 60 * 60 * 1000).toISOString(),
    currentLocation: { lat: 17.6688, lng: 75.9006, city: 'Solapur' }
  },
  {
    id: 'SHP_004',
    trackingId: 'SCO-2024-004',
    origin: 'Kolkata',
    destination: 'Bhubaneswar',
    originCoords: [22.5726, 88.3639],
    destCoords: [20.2961, 85.8245],
    cargo: 'Textiles',
    weight: '1500 kg',
    driver: 'Suresh Das',
    driverId: 'usr_005',
    vehicleId: 'WB-02-GH-3456',
    status: 'Delayed',
    riskScore: 63,
    riskLevel: 'MEDIUM',
    eta: '7h 20m',
    distance: '440 km',
    startTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    estimatedArrival: new Date(Date.now() + 7.33 * 60 * 60 * 1000).toISOString(),
    currentLocation: { lat: 21.4942, lng: 86.0782, city: 'Balasore' }
  },
  {
    id: 'SHP_005',
    trackingId: 'SCO-2024-005',
    origin: 'Ahmedabad',
    destination: 'Jaipur',
    originCoords: [23.0225, 72.5714],
    destCoords: [26.9124, 75.7873],
    cargo: 'Food Products',
    weight: '2000 kg',
    driver: 'Mohan Verma',
    driverId: 'usr_006',
    vehicleId: 'GJ-01-IJ-7890',
    status: 'On Schedule',
    riskScore: 22,
    riskLevel: 'LOW',
    eta: '5h 10m',
    distance: '656 km',
    startTime: new Date(Date.now() - 0.5 * 60 * 60 * 1000).toISOString(),
    estimatedArrival: new Date(Date.now() + 5.17 * 60 * 60 * 1000).toISOString(),
    currentLocation: { lat: 24.5854, lng: 73.7125, city: 'Udaipur' }
  }
];

// Alerts history
let alerts = [
  {
    id: 'ALT_001',
    shipmentId: 'SHP_001',
    trackingId: 'SCO-2024-001',
    type: 'HIGH_RISK',
    message: '🚨 Accident detected near Vadodara on NH48 — heavy congestion 12km ahead. Rerouting via SH63 suggested.',
    severity: 'HIGH',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    acknowledged: false,
    route: 'Mumbai → Delhi',
    driver: 'Arjun Singh'
  },
  {
    id: 'ALT_002',
    shipmentId: 'SHP_003',
    trackingId: 'SCO-2024-003',
    type: 'WEATHER',
    message: '⛈️ Heavy rain forecast near Solapur for next 3 hours. Expect 45-min delay on current route.',
    severity: 'MEDIUM',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    acknowledged: true,
    route: 'Hyderabad → Pune',
    driver: 'Priya Patel'
  },
  {
    id: 'ALT_003',
    shipmentId: 'SHP_004',
    trackingId: 'SCO-2024-004',
    type: 'DISRUPTION',
    message: '⚠️ Road blockade reported near Balasore — estimated clearance in 2 hours. Consider alternate via NH16.',
    severity: 'MEDIUM',
    timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    acknowledged: false,
    route: 'Kolkata → Bhubaneswar',
    driver: 'Suresh Das'
  },
  {
    id: 'ALT_004',
    shipmentId: 'SHP_001',
    trackingId: 'SCO-2024-001',
    type: 'TRAFFIC',
    message: '🚗 Severe traffic congestion detected at Surat bypass — 8km queue. Estimated delay: 1h 20m.',
    severity: 'HIGH',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    acknowledged: true,
    route: 'Mumbai → Delhi',
    driver: 'Arjun Singh'
  },
  {
    id: 'ALT_005',
    shipmentId: 'SHP_002',
    trackingId: 'SCO-2024-002',
    type: 'INFO',
    message: '✅ Route optimized successfully. Saved 28 minutes via Krishnagiri bypass.',
    severity: 'LOW',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    acknowledged: true,
    route: 'Bangalore → Chennai',
    driver: 'Vikram Sharma'
  }
];

// Route waypoints for map visualization
const routeWaypoints = {
  'Mumbai-Delhi': {
    primary: [
      [19.0760, 72.8777], // Mumbai
      [21.1702, 72.8311], // Surat
      [22.3072, 73.1812], // Vadodara
      [23.0225, 72.5714], // Ahmedabad
      [24.5854, 73.7125], // Udaipur
      [26.9124, 75.7873], // Jaipur
      [28.6139, 77.2090]  // Delhi
    ],
    alternate: [
      [19.0760, 72.8777], // Mumbai
      [19.9975, 73.7898], // Nashik
      [20.0059, 74.7496], // Dhule
      [21.7645, 72.1519], // Bharuch
      [22.7196, 75.8577], // Indore
      [23.1765, 77.4343], // Bhopal
      [24.5706, 80.8322], // Panna
      [25.4484, 78.5685], // Jhansi
      [27.1767, 78.0081], // Agra
      [28.6139, 77.2090]  // Delhi
    ]
  },
  'Bangalore-Chennai': {
    primary: [
      [12.9716, 77.5946], // Bangalore
      [12.8374, 79.1020], // Vellore
      [12.9165, 79.1325], // Ranipet
      [13.0827, 80.2707]  // Chennai
    ],
    alternate: [
      [12.9716, 77.5946], // Bangalore
      [12.2253, 76.4040], // Mysore
      [11.6643, 78.1460], // Salem
      [11.1085, 77.3411], // Erode
      [11.0168, 76.9558], // Coimbatore
      [13.0827, 80.2707]  // Chennai
    ]
  },
  'Hyderabad-Pune': {
    primary: [
      [17.3850, 78.4867], // Hyderabad
      [17.3616, 76.8200], // Gulbarga
      [17.6688, 75.9006], // Solapur
      [18.5204, 73.8567]  // Pune
    ],
    alternate: [
      [17.3850, 78.4867], // Hyderabad
      [16.5062, 80.6480], // Vijayawada
      [15.8497, 78.0400], // Kurnool
      [17.3616, 76.8200], // Gulbarga
      [18.5204, 73.8567]  // Pune
    ]
  },
  'Kolkata-Bhubaneswar': {
    primary: [
      [22.5726, 88.3639], // Kolkata
      [21.4942, 86.0782], // Balasore
      [20.9517, 85.0985], // Cuttack
      [20.2961, 85.8245]  // Bhubaneswar
    ],
    alternate: [
      [22.5726, 88.3639], // Kolkata
      [22.1701, 87.7480], // Kharagpur
      [21.9273, 87.1417], // Jhargram
      [21.2514, 86.0014], // Jajpur
      [20.2961, 85.8245]  // Bhubaneswar
    ]
  },
  'Ahmedabad-Jaipur': {
    primary: [
      [23.0225, 72.5714], // Ahmedabad
      [24.5854, 73.7125], // Udaipur
      [25.1462, 74.6399], // Chittorgarh
      [26.9124, 75.7873]  // Jaipur
    ],
    alternate: [
      [23.0225, 72.5714], // Ahmedabad
      [23.6843, 72.9689], // Mehsana
      [24.1868, 72.4366], // Palanpur
      [24.7964, 72.1148], // Sadri
      [25.7521, 73.3141], // Pali
      [26.9124, 75.7873]  // Jaipur
    ]
  }
};

module.exports = { users, shipments, alerts, routeWaypoints, trucks };

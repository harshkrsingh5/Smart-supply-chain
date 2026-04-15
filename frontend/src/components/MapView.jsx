import { useMemo } from 'react';
import Map, { Source, Layer, Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import './MapView.css';

const routeColors = {
  primary: '#3b82f6',
  alternate: '#f59e0b',
  expressway: '#8b5cf6'
};

// Free dark basemap (no API key, no quota limits)
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// ─── Catmull-Rom Spline Interpolation ───
// Converts a set of control points into a smooth curve
function catmullRomSpline(points, numSegmentPoints = 8) {
  if (!points || points.length < 2) return points || [];
  if (points.length === 2) {
    // For just 2 points, linearly interpolate
    const result = [];
    for (let t = 0; t <= 1; t += 1 / numSegmentPoints) {
      result.push([
        points[0][0] + (points[1][0] - points[0][0]) * t,
        points[0][1] + (points[1][1] - points[0][1]) * t
      ]);
    }
    result.push(points[1]);
    return result;
  }

  const result = [];
  // Pad the start and end
  const padded = [points[0], ...points, points[points.length - 1]];

  for (let i = 1; i < padded.length - 2; i++) {
    const p0 = padded[i - 1];
    const p1 = padded[i];
    const p2 = padded[i + 1];
    const p3 = padded[i + 2];

    for (let t = 0; t < 1; t += 1 / numSegmentPoints) {
      const t2 = t * t;
      const t3 = t2 * t;

      const lng = 0.5 * (
        (2 * p1[0]) +
        (-p0[0] + p2[0]) * t +
        (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
        (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3
      );
      const lat = 0.5 * (
        (2 * p1[1]) +
        (-p0[1] + p2[1]) * t +
        (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
        (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3
      );

      result.push([lng, lat]);
    }
  }

  // Always include final point
  result.push([padded[padded.length - 2][0], padded[padded.length - 2][1]]);
  return result;
}

// Determine if route has enough points from OSRM (doesn't need smoothing)
// or is sparse (fallback/synthetic) and needs spline interpolation
function smoothRouteCoordinates(waypoints) {
  if (!waypoints || waypoints.length === 0) return [];

  // Convert from [lat, lng] to [lng, lat] for MapLibre
  const coords = waypoints.map(w => [w[1], w[0]]);

  // If we have many points (OSRM data), they're already smooth
  if (coords.length > 50) return coords;

  // For sparse waypoints, apply Catmull-Rom smoothing
  const segPoints = Math.max(6, Math.round(60 / coords.length));
  return catmullRomSpline(coords, segPoints);
}

export default function MapView({ routes = [], selectedRoute, currentLocation, height = '400px' }) {
  if (routes.length === 0) return null;

  const firstRoute = routes[0];
  const waypoints = firstRoute.waypoints || [];

  // Calculate center and zoom from bounding box
  const { center, zoom } = useMemo(() => {
    if (waypoints.length === 0) {
      return { center: { latitude: 22.5, longitude: 78.5 }, zoom: 5.5 };
    }

    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;

    // Scan all routes for bounds
    for (const route of routes) {
      for (const w of (route.waypoints || [])) {
        minLat = Math.min(minLat, w[0]);
        maxLat = Math.max(maxLat, w[0]);
        minLng = Math.min(minLng, w[1]);
        maxLng = Math.max(maxLng, w[1]);
      }
    }

    const lat = (minLat + maxLat) / 2;
    const lng = (minLng + maxLng) / 2;

    // Estimate zoom from bounds span
    const latSpan = maxLat - minLat;
    const lngSpan = maxLng - minLng;
    const maxSpan = Math.max(latSpan, lngSpan);

    let z = 5.5;
    if (maxSpan < 1) z = 9;
    else if (maxSpan < 3) z = 7.5;
    else if (maxSpan < 6) z = 6.5;
    else if (maxSpan < 10) z = 5.8;
    else if (maxSpan < 15) z = 5.2;
    else z = 4.5;

    return { center: { latitude: lat, longitude: lng }, zoom: z };
  }, [routes, waypoints]);

  // Build smooth GeoJSON for each route
  const routeGeoJSON = useMemo(() => {
    return routes.map((route) => {
      const smoothCoords = smoothRouteCoordinates(route.waypoints || []);

      return {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { id: route.id, type: route.type },
            geometry: {
              type: 'LineString',
              coordinates: smoothCoords
            }
          }
        ]
      };
    });
  }, [routes]);

  // Origin & destination markers
  const originPos = waypoints.length > 0
    ? { latitude: waypoints[0][0], longitude: waypoints[0][1] }
    : null;
  const destPos = waypoints.length > 1
    ? { latitude: waypoints[waypoints.length - 1][0], longitude: waypoints[waypoints.length - 1][1] }
    : null;

  // Intermediate city markers (skip first & last)
  const intermediateCities = useMemo(() => {
    if (waypoints.length <= 2) return [];
    // Only show a few intermediate points, not every coordinate
    // Pick evenly-spaced intermediate points
    const count = Math.min(5, waypoints.length - 2);
    const step = Math.floor((waypoints.length - 2) / count);
    const cities = [];
    for (let i = 1; i <= count; i++) {
      const idx = i * step;
      if (idx < waypoints.length - 1) {
        cities.push({
          latitude: waypoints[idx][0],
          longitude: waypoints[idx][1],
          index: idx
        });
      }
    }
    return cities;
  }, [waypoints]);

  return (
    <div className="map-view-container" style={{ height }}>
      <Map
        initialViewState={{ ...center, zoom }}
        style={{ width: '100%', height: '100%', borderRadius: '12px' }}
        mapStyle={MAP_STYLE}
        attributionControl={true}
      >
        <NavigationControl position="top-right" />

        {/* Route polylines — render non-selected first, selected on top */}
        {routeGeoJSON.map((geojson, idx) => {
          const route = routes[idx];
          const isSelected = selectedRoute === route.id;
          if (isSelected) return null; // render selected last
          const color = routeColors[route.type] || '#60a5fa';

          return (
            <Source key={route.id} id={`route-${route.id}`} type="geojson" data={geojson}>
              <Layer
                id={`route-line-${route.id}`}
                type="line"
                layout={{
                  'line-cap': 'round',
                  'line-join': 'round'
                }}
                paint={{
                  'line-color': color,
                  'line-width': 3,
                  'line-opacity': 0.35,
                  ...(route.type === 'expressway' ? { 'line-dasharray': [2, 1.5] } : {})
                }}
              />
            </Source>
          );
        })}

        {/* Selected route — rendered on top with glow */}
        {routeGeoJSON.map((geojson, idx) => {
          const route = routes[idx];
          const isSelected = selectedRoute === route.id;
          if (!isSelected) return null;
          const color = routeColors[route.type] || '#60a5fa';

          return (
            <Source key={`sel-${route.id}`} id={`route-sel-${route.id}`} type="geojson" data={geojson}>
              {/* Outer glow */}
              <Layer
                id={`route-glow-outer-${route.id}`}
                type="line"
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                paint={{
                  'line-color': color,
                  'line-width': 18,
                  'line-opacity': 0.08,
                  'line-blur': 12
                }}
              />
              {/* Inner glow */}
              <Layer
                id={`route-glow-inner-${route.id}`}
                type="line"
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                paint={{
                  'line-color': color,
                  'line-width': 10,
                  'line-opacity': 0.18,
                  'line-blur': 4
                }}
              />
              {/* Main route line */}
              <Layer
                id={`route-line-sel-${route.id}`}
                type="line"
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                paint={{
                  'line-color': color,
                  'line-width': 4.5,
                  'line-opacity': 1,
                  ...(route.type === 'expressway' ? { 'line-dasharray': [2, 1.5] } : {})
                }}
              />
            </Source>
          );
        })}

        {/* Intermediate waypoint dots */}
        {intermediateCities.map((city, i) => (
          <Marker key={`mid-${i}`} latitude={city.latitude} longitude={city.longitude} anchor="center">
            <div className="map-waypoint-dot" />
          </Marker>
        ))}

        {/* Origin marker */}
        {originPos && (
          <Marker latitude={originPos.latitude} longitude={originPos.longitude} anchor="bottom">
            <div className="maplibre-custom-marker marker-origin">
              <span className="marker-pulse"></span>
              <span className="marker-dot">A</span>
            </div>
          </Marker>
        )}

        {/* Destination marker */}
        {destPos && (
          <Marker latitude={destPos.latitude} longitude={destPos.longitude} anchor="bottom">
            <div className="maplibre-custom-marker marker-dest">
              <span className="marker-pulse pulse-dest"></span>
              <span className="marker-dot dot-dest">B</span>
            </div>
          </Marker>
        )}

        {/* Current location marker */}
        {currentLocation && (
          <Marker latitude={currentLocation.lat} longitude={currentLocation.lng} anchor="center">
            <div className="maplibre-current-location">
              <span className="current-loc-ring"></span>
              <span className="current-loc-dot"></span>
            </div>
          </Marker>
        )}
      </Map>

      <div className="map-legend">
        <span className="map-legend-item"><span className="legend-line" style={{ background: '#3b82f6' }}></span> NH (Primary)</span>
        <span className="map-legend-item"><span className="legend-line" style={{ background: '#f59e0b' }}></span> SH (Alternate)</span>
        <span className="map-legend-item"><span className="legend-line legend-dashed" style={{ background: '#8b5cf6' }}></span> Expressway</span>
      </div>
    </div>
  );
}

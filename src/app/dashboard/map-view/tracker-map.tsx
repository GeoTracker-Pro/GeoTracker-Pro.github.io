'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import type { Tracker } from '@/lib/storage';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue in bundled environments
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const liveIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'live-marker',
});

L.Marker.prototype.options.icon = defaultIcon;

interface TrackerMapProps {
  trackers: Tracker[];
  selectedTrackerId: string | null;
  onSelectTracker: (id: string | null) => void;
}

// Component to handle map view changes when a tracker is selected
function MapFlyTo({ trackers, selectedTrackerId }: { trackers: Tracker[]; selectedTrackerId: string | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedTrackerId) {
      const tracker = trackers.find((t) => t.id === selectedTrackerId);
      if (tracker && tracker.locations.length > 0) {
        const latest = tracker.locations[tracker.locations.length - 1];
        map.flyTo([latest.latitude, latest.longitude], 15, { duration: 1 });
      }
    }
  }, [selectedTrackerId, trackers, map]);

  return null;
}

// Component to auto-fit bounds when trackers change
function FitBounds({ trackers }: { trackers: Tracker[] }) {
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    if (hasFitted.current) return;

    const allPositions: [number, number][] = [];
    trackers.forEach((tracker) => {
      if (tracker.locations.length > 0) {
        const latest = tracker.locations[tracker.locations.length - 1];
        allPositions.push([latest.latitude, latest.longitude]);
      }
    });

    if (allPositions.length > 0) {
      const bounds = L.latLngBounds(allPositions);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      hasFitted.current = true;
    }
  }, [trackers, map]);

  return null;
}

// Color palette for tracker polylines
const POLYLINE_COLORS = [
  '#00ff88', '#00ccff', '#ff00ff', '#ffcc00', '#ff3366',
  '#66ff66', '#6699ff', '#ff66cc', '#ffff66', '#ff9933',
];

export default function TrackerMap({ trackers, selectedTrackerId, onSelectTracker }: TrackerMapProps) {
  const trackersWithLocations = trackers.filter((t) => t.locations.length > 0);

  const defaultCenter: [number, number] = trackersWithLocations.length > 0
    ? [
        trackersWithLocations[0].locations[trackersWithLocations[0].locations.length - 1].latitude,
        trackersWithLocations[0].locations[trackersWithLocations[0].locations.length - 1].longitude,
      ]
    : [20, 0];

  const defaultZoom = trackersWithLocations.length > 0 ? 10 : 2;

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      <MapFlyTo trackers={trackers} selectedTrackerId={selectedTrackerId} />
      <FitBounds trackers={trackersWithLocations} />

      {trackersWithLocations.map((tracker, trackerIndex) => {
        const latestLoc = tracker.locations[tracker.locations.length - 1];
        const isLive = Date.now() - new Date(latestLoc.timestamp).getTime() < 60000;
        const isSelected = selectedTrackerId === tracker.id;
        const polylineColor = POLYLINE_COLORS[trackerIndex % POLYLINE_COLORS.length];

        // Build polyline path from all locations
        const path: [number, number][] = tracker.locations.map((loc) => [
          loc.latitude,
          loc.longitude,
        ]);

        return (
          <div key={tracker.id}>
            {/* Polyline showing movement history */}
            {tracker.locations.length > 1 && (
              <Polyline
                positions={path}
                pathOptions={{
                  color: polylineColor,
                  weight: isSelected ? 4 : 2,
                  opacity: isSelected ? 0.9 : 0.5,
                  dashArray: isSelected ? undefined : '5, 10',
                }}
              />
            )}

            {/* Marker at latest location */}
            <Marker
              position={[latestLoc.latitude, latestLoc.longitude]}
              icon={isLive ? liveIcon : defaultIcon}
              eventHandlers={{
                click: () => onSelectTracker(tracker.id),
              }}
            >
              <Popup>
                <div style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  minWidth: '220px',
                }}>
                  <div style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#00994d',
                    marginBottom: '8px',
                    borderBottom: '1px solid #eee',
                    paddingBottom: '6px',
                  }}>
                    {tracker.name}
                    {isLive && (
                      <span style={{
                        marginLeft: '8px',
                        color: '#00cc66',
                        fontSize: '10px',
                      }}>● LIVE</span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px' }}>
                    ID: {tracker.id.substring(0, 24)}...
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                    <strong>Lat:</strong> {latestLoc.latitude.toFixed(6)}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                    <strong>Lng:</strong> {latestLoc.longitude.toFixed(6)}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                    <strong>Accuracy:</strong> ±{latestLoc.accuracy.toFixed(2)}m
                  </div>
                  {latestLoc.deviceInfo && (
                    <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                      <strong>Device:</strong> {latestLoc.deviceInfo.os} - {latestLoc.deviceInfo.browser}
                    </div>
                  )}
                  {latestLoc.ip && (
                    <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                      <strong>IP:</strong> {latestLoc.ip}
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>
                    Last update: {new Date(latestLoc.timestamp).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '11px', color: '#888' }}>
                    {tracker.locations.length} location(s) recorded
                  </div>
                </div>
              </Popup>
            </Marker>
          </div>
        );
      })}
    </MapContainer>
  );
}

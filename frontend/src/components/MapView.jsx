import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom red SOS pin icon
const sosIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Helper: auto-pan map to new signal
function MapUpdater({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 16, { animate: true, duration: 1.5 });
  }, [position, map]);
  return null;
}

export default function MapView({ signal }) {
  const defaultCenter = [28.6139, 77.2090]; // New Delhi fallback
  const position = signal ? [signal.latitude, signal.longitude] : null;

  return (
    <div style={{ width: '100%', height: '100%' }}>
        <MapContainer
        center={position || defaultCenter}
        zoom={15}
        style={{ width: '100%', height: '100%' }}
        >
        <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {position && (
            <Marker position={position} icon={sosIcon}>
            <Popup>
                <strong>🚨 SOS Signal</strong><br />
                Device: {signal.device_id}<br />
                Lat: {signal.latitude.toFixed(6)}<br />
                Lng: {signal.longitude.toFixed(6)}<br />
                Battery: {signal.battery ?? 'N/A'}%<br />
                At: {new Date(signal.received_at).toLocaleTimeString()}
            </Popup>
            </Marker>
        )}
        {position && <MapUpdater position={position} />}
        </MapContainer>
    </div>
  );
}

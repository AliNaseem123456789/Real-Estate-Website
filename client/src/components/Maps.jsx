// Maps use Leaflet + OpenStreetMap (free, no API key needed)
import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Leaflet's default pin images don't load with Vite unless we set them like this
const pinIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const PAKISTAN_CENTER = [30.3753, 69.3451];

const Tiles = () => (
  <TileLayer
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  />
);

// Read-only map with one pin (property details page)
export function PropertyMap({ location }) {
  if (!location?.lat || !location?.lng) return null;
  const position = [location.lat, location.lng];

  return (
    <MapContainer center={position} zoom={15} scrollWheelZoom={false} className="h-72 w-full rounded-2xl">
      <Tiles />
      <Marker position={position} icon={pinIcon} />
    </MapContainer>
  );
}

// Moves the map when the pin is set by the address search
function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 15);
  }, [map, position]);
  return null;
}

// Click on the map to drop / move the pin
function ClickToPin({ onPick }) {
  useMapEvents({
    click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
}

// Map for the Sell / Edit form. value = { lat, lng } or null
export function LocationPicker({ value, onChange, defaultSearch = "" }) {
  const [search, setSearch] = useState("");
  const [flyTarget, setFlyTarget] = useState(null);
  const [message, setMessage] = useState("");
  const position = value?.lat ? [value.lat, value.lng] : null;

  // Looks up an address with OpenStreetMap's free search
  const findAddress = async () => {
    const text = search || defaultSearch;
    if (!text) return;
    setMessage("Searching...");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=pk&q=${encodeURIComponent(text)}`
      );
      const [place] = await res.json();
      if (!place) return setMessage("Address not found — click on the map instead.");
      const found = { lat: Number(place.lat), lng: Number(place.lon) };
      onChange(found);
      setFlyTarget([found.lat, found.lng]);
      setMessage("");
    } catch {
      setMessage("Search failed — click on the map instead.");
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              findAddress();
            }
          }}
          placeholder={defaultSearch || "Search an address or area"}
          className="flex-1 px-3 py-2 border rounded-md"
        />
        <button type="button" onClick={findAddress} className="px-4 py-2 bg-gray-800 text-white rounded-md">
          Find
        </button>
        {position && (
          <button type="button" onClick={() => onChange(null)} className="px-4 py-2 border rounded-md">
            Remove pin
          </button>
        )}
      </div>
      {message && <p className="text-sm text-gray-500 mb-2">{message}</p>}

      <MapContainer center={position || PAKISTAN_CENTER} zoom={position ? 15 : 5} className="h-72 w-full rounded-xl">
        <Tiles />
        <ClickToPin onPick={onChange} />
        <FlyTo position={flyTarget} />
        {position && <Marker position={position} icon={pinIcon} />}
      </MapContainer>
      <p className="text-xs text-gray-500 mt-1">Click on the map to place the pin exactly.</p>
    </div>
  );
}

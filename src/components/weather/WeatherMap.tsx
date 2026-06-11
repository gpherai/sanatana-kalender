"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

const defaultIcon = L.divIcon({
  className: "weather-map-marker",
  html: '<span style="display:block;width:20px;height:20px;border-radius:9999px;background:var(--theme-primary);border:3px solid var(--theme-surface);box-shadow:0 2px 10px rgba(15,23,42,.35)"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface WeatherMapProps {
  lat: number;
  lon: number;
  layer?: "clouds_new" | "precipitation_new" | "pressure_new" | "wind_new" | "temp_new";
  className?: string;
}

// Subcomponent to update map view when coordinates change
function RecenterMap({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], map.getZoom(), { animate: true });
    // Invalidate size to prevent grey map bug on container resize
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [lat, lon, map]);
  return null;
}

export default function WeatherMap({
  lat,
  lon,
  layer = "precipitation_new",
  className,
}: WeatherMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.invalidateSize();
    }
  }, [className]);

  return (
    <div
      className={cn(
        "border-theme-border relative z-0 overflow-hidden rounded-3xl border",
        className
      )}
      style={{ height: "300px", width: "100%" }}
    >
      <MapContainer
        key={`${lat}-${lon}`}
        center={[lat, lon]}
        zoom={8}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
      >
        <RecenterMap lat={lat} lon={lon} />

        {/* Base Map (OpenStreetMap) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />

        {/* Weather Layer (OpenWeatherMap via our proxy to hide API key) */}
        <TileLayer url={`/api/weer/map/${layer}/{z}/{x}/{y}`} opacity={0.6} />

        <Marker position={[lat, lon]} icon={defaultIcon} />
      </MapContainer>
    </div>
  );
}

"use client";

import * as React from "react";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";

const DEFAULT_CENTER: LatLngExpression = [14.7, -86.5];
const DEFAULT_ZOOM = 8;

// Ensure marker icons work when rendering in Next.js.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type Coordinates = { lat: number; lng: number };

type LocationPickerMapInnerProps = {
  value: Coordinates | null;
  onChange: (coords: Coordinates) => void;
};

export default function LocationPickerMapInner({ value, onChange }: LocationPickerMapInnerProps) {
  const center = React.useMemo<LatLngExpression>(
    () => (value ? [value.lat, value.lng] : DEFAULT_CENTER),
    [value]
  );

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200">
      <MapContainer center={center} zoom={value ? 14 : DEFAULT_ZOOM} className="h-72 w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DraggablePin value={value} onChange={onChange} />
      </MapContainer>
    </div>
  );
}

function DraggablePin({
  value,
  onChange,
}: {
  value: Coordinates | null;
  onChange: (coords: Coordinates) => void;
}) {
  const markerPosition: [number, number] = value
    ? [value.lat, value.lng]
    : [DEFAULT_CENTER[0] as number, DEFAULT_CENTER[1] as number];

  useMapEvents({
    click(event) {
      onChange({
        lat: roundCoord(event.latlng.lat),
        lng: roundCoord(event.latlng.lng),
      });
    },
  });

  return (
    <Marker
      draggable
      position={markerPosition}
      eventHandlers={{
        dragend(event) {
          const marker = event.target;
          const next = marker.getLatLng();
          onChange({
            lat: roundCoord(next.lat),
            lng: roundCoord(next.lng),
          });
        },
      }}
    />
  );
}

function roundCoord(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}


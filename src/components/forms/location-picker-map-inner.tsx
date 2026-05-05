"use client";

import * as React from "react";
import { MapPin } from "lucide-react";
import type { MapMouseEvent } from "maplibre-gl";

import { Map, MapControls, MapMarker, MarkerContent, useMap } from "@/components/ui/map";

const DEFAULT_CENTER: [number, number] = [14.7, -86.5];
const DEFAULT_ZOOM = 8;

type Coordinates = { lat: number; lng: number };

type LocationPickerMapInnerProps = {
  value: Coordinates | null;
  onChange: (coords: Coordinates) => void;
};

export default function LocationPickerMapInner({ value, onChange }: LocationPickerMapInnerProps) {
  const center = React.useMemo<[number, number]>(
    () => (value ? [value.lng, value.lat] : [DEFAULT_CENTER[1], DEFAULT_CENTER[0]]),
    [value]
  );

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200">
      <Map center={center} zoom={value ? 14 : DEFAULT_ZOOM} className="h-72 w-full">
        <MapClickPicker onChange={onChange} />
        <DraggablePin value={value} onChange={onChange} />
        <MapControls showZoom showLocate />
      </Map>
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
    ? [value.lng, value.lat]
    : [DEFAULT_CENTER[1], DEFAULT_CENTER[0]];

  return (
    <MapMarker
      draggable
      longitude={markerPosition[0]}
      latitude={markerPosition[1]}
      onDrag={(lngLat) => {
        onChange({
          lat: roundCoord(lngLat.lat),
          lng: roundCoord(lngLat.lng),
        });
      }}
    >
      <MarkerContent>
        <MapPin className="size-7 fill-zinc-900 stroke-white drop-shadow" />
      </MarkerContent>
    </MapMarker>
  );
}

function MapClickPicker({ onChange }: { onChange: (coords: Coordinates) => void }) {
  const { map, isLoaded } = useMap();

  React.useEffect(() => {
    if (!map || !isLoaded) return;

    const handleClick = (event: MapMouseEvent) => {
      onChange({
        lat: roundCoord(event.lngLat.lat),
        lng: roundCoord(event.lngLat.lng),
      });
    };

    map.on("click", handleClick);

    return () => {
      map.off("click", handleClick);
    };
  }, [map, isLoaded, onChange]);

  return null;
}

function roundCoord(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

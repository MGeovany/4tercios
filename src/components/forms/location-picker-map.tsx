"use client";

import dynamic from "next/dynamic";

type Coordinates = { lat: number; lng: number };

type LocationPickerMapProps = {
  value: Coordinates | null;
  onChange: (coords: Coordinates) => void;
};

const LocationPickerMapInner = dynamic(() => import("./location-picker-map-inner"), {
  ssr: false,
});

export function LocationPickerMap({ value, onChange }: LocationPickerMapProps) {
  return <LocationPickerMapInner value={value} onChange={onChange} />;
}

"use client";

import MapLibreGL from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Locate, Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

type MapContextValue = {
  map: MapLibreGL.Map | null;
  isLoaded: boolean;
};

const MapContext = createContext<MapContextValue | null>(null);

const DEFAULT_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

type MapProps = {
  children?: ReactNode;
  className?: string;
  center?: [number, number];
  zoom?: number;
} & Omit<MapLibreGL.MapOptions, "container" | "style" | "center" | "zoom">;

export function Map({ children, className, center, zoom, ...props }: MapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initialCenterRef = useRef(center);
  const initialZoomRef = useRef(zoom);
  const initialOptionsRef = useRef(props);
  const [mapInstance, setMapInstance] = useState<MapLibreGL.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new MapLibreGL.Map({
      container: containerRef.current,
      style: DEFAULT_STYLE,
      center: initialCenterRef.current,
      zoom: initialZoomRef.current,
      attributionControl: { compact: true },
      ...initialOptionsRef.current,
    });

    const onLoad = () => setIsLoaded(true);
    map.on("load", onLoad);
    setMapInstance(map);

    return () => {
      map.off("load", onLoad);
      map.remove();
      setMapInstance(null);
      setIsLoaded(false);
    };
  }, []);

  useEffect(() => {
    if (!mapInstance || !center) return;
    mapInstance.easeTo({ center, duration: 350 });
  }, [center, mapInstance]);

  useEffect(() => {
    if (!mapInstance || typeof zoom !== "number") return;
    mapInstance.easeTo({ zoom, duration: 350 });
  }, [zoom, mapInstance]);

  const value: MapContextValue = { map: mapInstance, isLoaded };

  return (
    <MapContext.Provider value={value}>
      <div ref={containerRef} className={cn("relative h-full w-full", className)}>
        {isLoaded ? children : null}
      </div>
    </MapContext.Provider>
  );
}

export function useMap() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMap must be used inside <Map />.");
  }
  return context;
}

type MapMarkerProps = {
  longitude: number;
  latitude: number;
  draggable?: boolean;
  onDrag?: (lngLat: { lng: number; lat: number }) => void;
  children: ReactNode;
};

type MarkerContextValue = {
  marker: MapLibreGL.Marker;
};

const MarkerContext = createContext<MarkerContextValue | null>(null);

export function MapMarker({
  longitude,
  latitude,
  draggable = false,
  onDrag,
  children,
}: MapMarkerProps) {
  const { map, isLoaded } = useMap();
  const [marker] = useState<MapLibreGL.Marker | null>(() => {
    if (typeof window === "undefined") return null;
    return new MapLibreGL.Marker({
      element: document.createElement("div"),
      draggable,
    }).setLngLat([longitude, latitude]);
  });

  useEffect(() => {
    if (!marker || !map || !isLoaded) return;

    marker.addTo(map);
    const handleDrag = () => {
      const position = marker.getLngLat();
      onDrag?.({ lng: position.lng, lat: position.lat });
    };
    marker.on("drag", handleDrag);

    return () => {
      marker.off("drag", handleDrag);
      marker.remove();
    };
  }, [map, isLoaded, marker, onDrag]);

  useEffect(() => {
    if (!marker) return;
    marker.setLngLat([longitude, latitude]);
    marker.setDraggable(draggable);
  }, [longitude, latitude, draggable, marker]);

  if (!marker) return null;

  return <MarkerContext.Provider value={{ marker }}>{children}</MarkerContext.Provider>;
}

export function MarkerContent({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  const context = useContext(MarkerContext);
  if (!context) {
    throw new Error("MarkerContent must be used inside <MapMarker />.");
  }
  return createPortal(
    <div className={cn("relative cursor-pointer", className)}>{children}</div>,
    context.marker.getElement()
  );
}

type MapControlsProps = {
  showZoom?: boolean;
  showLocate?: boolean;
  className?: string;
};

export function MapControls({
  showZoom = true,
  showLocate = false,
  className,
}: MapControlsProps) {
  const { map } = useMap();

  return (
    <div
      className={cn("absolute right-2 bottom-10 z-10 flex flex-col gap-1.5", className)}
    >
      {showZoom ? (
        <div className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
          <button
            type="button"
            aria-label="Acercar"
            className="flex size-8 items-center justify-center border-b border-zinc-200 text-zinc-700 transition hover:bg-zinc-50"
            onClick={() => map?.zoomTo((map?.getZoom() ?? 10) + 1, { duration: 250 })}
          >
            <Plus className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Alejar"
            className="flex size-8 items-center justify-center text-zinc-700 transition hover:bg-zinc-50"
            onClick={() => map?.zoomTo((map?.getZoom() ?? 10) - 1, { duration: 250 })}
          >
            <Minus className="size-4" />
          </button>
        </div>
      ) : null}
      {showLocate ? (
        <div className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
          <button
            type="button"
            aria-label="Usar mi ubicación"
            className="flex size-8 items-center justify-center text-zinc-700 transition hover:bg-zinc-50"
            onClick={() => {
              if (!("geolocation" in navigator) || !map) return;
              navigator.geolocation.getCurrentPosition((position) => {
                map.flyTo({
                  center: [position.coords.longitude, position.coords.latitude],
                  zoom: 14,
                  duration: 1200,
                });
              });
            }}
          >
            <Locate className="size-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

import { NextRequest, NextResponse } from "next/server";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

export async function GET(request: NextRequest) {
  const latRaw = request.nextUrl.searchParams.get("lat");
  const lngRaw = request.nextUrl.searchParams.get("lng");

  const lat = latRaw ? Number(latRaw) : NaN;
  const lng = lngRaw ? Number(lngRaw) : NaN;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  try {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("zoom", "18");

    const response = await fetch(url.toString(), {
      headers: {
        "accept-language": "es",
        // Nominatim requests a valid user agent.
        "user-agent": "lensia-web/1.0 (reverse geocoding)",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Reverse geocoding failed" }, { status: 502 });
    }

    const payload = (await response.json()) as {
      display_name?: string;
      address?: Record<string, string | undefined>;
    };
    const address = payload.address ?? {};

    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county ||
      "";

    const venue =
      [
        address.attraction,
        address.amenity,
        address.building,
        address.leisure,
        address.road,
      ].find(Boolean) || payload.display_name?.split(",").slice(0, 2).join(", ").trim() || "";

    return NextResponse.json({ city, venue });
  } catch {
    return NextResponse.json({ error: "Reverse geocoding unavailable" }, { status: 502 });
  }
}


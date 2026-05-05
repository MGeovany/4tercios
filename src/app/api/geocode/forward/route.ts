import { NextRequest, NextResponse } from "next/server";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export async function GET(request: NextRequest) {
  const cityRaw = request.nextUrl.searchParams.get("city");
  const city = cityRaw?.trim() ?? "";

  if (city.length < 2) {
    return NextResponse.json({ error: "city is required" }, { status: 400 });
  }

  try {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "hn");
    url.searchParams.set("q", city);

    const response = await fetch(url.toString(), {
      headers: {
        "accept-language": "es",
        "user-agent": "4tercios-web/1.0 (forward geocoding)",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Forward geocoding failed" }, { status: 502 });
    }

    const payload = (await response.json()) as Array<{ lat?: string; lon?: string }>;
    const first = payload[0];
    if (!first?.lat || !first?.lon) {
      return NextResponse.json({ error: "No location found" }, { status: 404 });
    }

    const lat = Number(first.lat);
    const lng = Number(first.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: "Invalid geocode result" }, { status: 502 });
    }

    return NextResponse.json({ lat, lng });
  } catch {
    return NextResponse.json({ error: "Forward geocoding unavailable" }, { status: 502 });
  }
}

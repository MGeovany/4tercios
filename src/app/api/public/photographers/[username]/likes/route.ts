import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  getPhotographerLikeSummary,
  getPublicPhotographerProfileByUsername,
  incrementPhotographerLike,
} from "@/lib/server/public-profile";
import { resolvePublicUsername } from "@/lib/public-event-path";

const VIEWER_COOKIE = "profile_like_viewer";

function buildViewerKey() {
  return `anon_${crypto.randomUUID()}`;
}

async function getOrCreateViewerKey() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(VIEWER_COOKIE)?.value?.trim();
  if (existing) return { viewerKey: existing, isNew: false };
  return { viewerKey: buildViewerKey(), isNew: true };
}

export async function GET(_: Request, ctx: { params: Promise<{ username: string }> }) {
  const { username } = await ctx.params;
  const profile = await getPublicPhotographerProfileByUsername(resolvePublicUsername(username));
  if (!profile) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  const { viewerKey, isNew } = await getOrCreateViewerKey();
  const summary = await getPhotographerLikeSummary(profile.photographer.id, viewerKey);
  const response = NextResponse.json({
    totalClaps: summary.totalClaps,
    myClaps: summary.myClaps,
    maxClaps: 50,
    reachedLimit: summary.myClaps >= 50,
  });
  if (isNew) {
    response.cookies.set(VIEWER_COOKIE, viewerKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}

export async function POST(_: Request, ctx: { params: Promise<{ username: string }> }) {
  const { username } = await ctx.params;
  const profile = await getPublicPhotographerProfileByUsername(resolvePublicUsername(username));
  if (!profile) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  const { viewerKey, isNew } = await getOrCreateViewerKey();
  const summary = await incrementPhotographerLike(profile.photographer.id, viewerKey);
  const response = NextResponse.json({
    totalClaps: summary.totalClaps,
    myClaps: summary.myClaps,
    maxClaps: 50,
    reachedLimit: summary.reachedLimit,
  });
  if (isNew) {
    response.cookies.set(VIEWER_COOKIE, viewerKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}


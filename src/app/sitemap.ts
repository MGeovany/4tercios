import type { MetadataRoute } from "next";

const BASE_URL = "https://4tercios.thefndrs.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "/",
    "/login",
    "/register",
    "/olvide-contrasena",
    "/onboarding",
    "/terminos",
    "/privacidad",
    "/contacto",
  ];

  const now = new Date();
  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));
}

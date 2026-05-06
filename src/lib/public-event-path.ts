export function slugifyPathSegment(input: string | null | undefined) {
  return (input ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function resolvePublicUsername(input: string | null | undefined) {
  return slugifyPathSegment(input) || "fotografo";
}


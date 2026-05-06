import { PublicResultsView } from "@/app/e/[slug]/results/page";

export default async function PublicResultsByUsernamePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { username, slug } = await params;
  const sp = await searchParams;
  return PublicResultsView({ username, slug, searchParams: sp });
}


import { PublicEventView } from "@/app/e/[slug]/page";

export default async function PublicEventByUsernamePage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  const { username, slug } = await params;
  return PublicEventView({ username, slug });
}


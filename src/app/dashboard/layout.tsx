import { redirect } from "next/navigation";

import { Sidebar } from "@/components/shell/sidebar";
import { buildOnboardingPath, getOnboardingStepFromMetadata } from "@/lib/onboarding";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const initialName =
    (typeof meta.business_name === "string" && meta.business_name.trim()) ||
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    "";
  const initialEmail = user.email ?? "";
  if (meta.onboarding_completed !== true) {
    redirect(buildOnboardingPath(getOnboardingStepFromMetadata(meta)));
  }

  return (
    <div className="flex min-h-screen bg-zinc-50/60 font-sans" data-brand-font="manrope">
      <Sidebar initialName={initialName} initialEmail={initialEmail} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-white">
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

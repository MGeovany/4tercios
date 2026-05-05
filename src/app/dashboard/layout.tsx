import { redirect } from "next/navigation";

import { Sidebar } from "@/components/shell/sidebar";
import { buildOnboardingPath, getOnboardingStepFromMetadata } from "@/lib/onboarding";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  if (meta.onboarding_completed !== true) {
    redirect(buildOnboardingPath(getOnboardingStepFromMetadata(meta)));
  }

  return (
    <div className="flex min-h-screen bg-zinc-50/60">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

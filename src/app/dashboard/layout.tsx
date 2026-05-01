import { Sidebar } from "@/components/shell/sidebar";
import { OnboardingGate } from "@/components/auth/onboarding-gate";
import { Footer } from "@/components/footer";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingGate>
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <div className="min-w-0 flex-1">{children}</div>
          <Footer variant="dashboard" />
        </div>
      </div>
    </OnboardingGate>
  );
}

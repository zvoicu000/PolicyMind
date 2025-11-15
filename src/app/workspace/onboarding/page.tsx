import Link from "next/link";

import { OnboardingWizard } from "@/components/workspace/OnboardingWizard";

export default function OnboardingPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            Tailored setup
          </p>
          <h1 className="text-3xl font-semibold text-neutral-900">
            Capture the context for smarter obligations
          </h1>
          <p className="text-sm text-neutral-600">
            Company details, policy maturity, and notification preferences fuel PolicyMind recommendations.
          </p>
        </div>
        <Link href="/workspace" className="text-sm font-semibold text-blue-600">
          Skip to dashboard
        </Link>
      </div>
      <OnboardingWizard onCompletePath="/workspace" />
    </div>
  );
}

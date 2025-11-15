import Link from "next/link";
import { cache } from "react";

import { auth0 } from "@/lib/auth0";
import { InsightsPanel } from "@/components/workspace/InsightsPanel";
import { RegulationUploadPanel } from "@/components/workspace/RegulationUploadPanel";
import { getOnboardingProfile } from "@/lib/onboarding-store";

const loadOnboardingProfile = cache(async (userId: string) => getOnboardingProfile(userId));

export default async function WorkspaceHome() {
  const session = await auth0.getSession();
  const onboarding = session ? await loadOnboardingProfile(session.user.sub) : null;

  const hasProfile = Boolean(onboarding);
  const notificationLabel = onboarding?.notificationChannel === "gmail"
    ? "Gmail"
    : onboarding?.notificationChannel ?? "Gmail";
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-neutral-200 bg-white p-10 shadow-sm">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
            Welcome back
          </p>
          <h1 className="text-3xl font-semibold text-neutral-900">
            {session?.user.name ?? session?.user.email}, your compliance cockpit is ready
          </h1>
          <p className="text-neutral-600">
            {hasProfile
              ? "Review prioritized obligations, assign owners, and push tasks to your teams."
              : "Finish the onboarding checklist to tailor regulatory feeds, policy coverage, and task templates."
            }
          </p>
          {!hasProfile ? (
            <Link
              href="/workspace/onboarding"
              className="inline-flex w-fit items-center rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white"
            >
              Resume onboarding
            </Link>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-neutral-200 bg-white p-5">
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            Company
          </p>
          <p className="mt-2 text-lg font-semibold text-neutral-900">
            {onboarding?.companyName ?? "Not set"}
          </p>
          <p className="text-sm text-neutral-500">
            HQ in {onboarding?.hqCountry ?? "–"} · {onboarding?.employeeCount ?? "size unknown"}
          </p>
        </article>
        <article className="rounded-2xl border border-neutral-200 bg-white p-5">
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            Policy readiness
          </p>
          <p className="mt-2 text-lg font-semibold text-neutral-900">
            {onboarding?.policySnapshots.filter((snapshot) => snapshot.maturity === "approved" || snapshot.maturity === "monitored").length ?? 0}
            /{onboarding?.policySnapshots.length ?? policyAreaCount}
          </p>
          <p className="text-sm text-neutral-500">Areas tracked</p>
        </article>
        <article className="rounded-2xl border border-neutral-200 bg-white p-5">
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            Next action
          </p>
          <p className="mt-2 text-lg font-semibold text-neutral-900">
            {hasProfile ? "Connect tasking channels" : "Finish onboarding"}
          </p>
          <p className="text-sm text-neutral-500">
            {hasProfile ? `Notifications via ${notificationLabel}` : "3 short steps remaining"}
          </p>
        </article>
      </section>
      {hasProfile ? <InsightsPanel /> : null}

      {hasProfile ? <RegulationUploadPanel /> : null}
    </div>
  );
}

const policyAreaCount = 4;

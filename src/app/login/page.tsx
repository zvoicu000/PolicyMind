import { Metadata } from "next";
import Link from "next/link";
import {
  LoginButton,
  LogoutButton,
  ProfileSummary,
} from "@/components/auth/AuthButtons";

export const metadata: Metadata = {
  title: "Sign in • PolicyMind",
  description: "Secure Auth0 sign-in for PolicyMind compliance workflows.",
};

const workflowSteps = [
  "Source EU regulatory updates from EUR-Lex, the Commission, and sector feeds.",
  "Parse releases with NLP to extract impacted articles and summarize changes.",
  "Map each notice to internal policies and process owners automatically.",
  "Generate recommended remediations, templates, and checklists.",
  "Open workflow tasks for Legal, IT, HR, and track approvals.",
  "Maintain a full audit log and exportable reports for regulators.",
  "Tailor actions to member-state rules and industry expectations.",
  "Learn from completed actions to prioritize future alerts.",
];

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold text-neutral-900">
            PolicyMind
          </Link>
          <nav className="flex items-center gap-3 text-sm text-neutral-600">
            <Link href="/" className="hover:text-neutral-900">
              Overview
            </Link>
            <Link href="#workflow" className="hover:text-neutral-900">
              Workflow
            </Link>
            <Link href="#security" className="hover:text-neutral-900">
              Security
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-12 lg:flex-row">
        <section className="flex flex-1 flex-col gap-6 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <span className="inline-flex w-fit items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
            Secure Access
          </span>
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold text-neutral-900">
              Sign in to orchestrate end-to-end compliance
            </h1>
            <p className="text-base text-neutral-600">
              Auth0 SSO keeps your legal, risk, and operations teams inside a
              single controlled workspace. Once authenticated, you will see the
              latest EU obligations that impact your internal controls.
            </p>
          </div>
          <ProfileSummary />
          <div className="flex flex-wrap gap-3">
            <LoginButton />
            <LogoutButton />
          </div>
          <p className="text-xs text-neutral-500" id="security">
            PolicyMind uses organization-bound connections, rotating secrets,
            and signed callbacks configured in Auth0. Add your tenant values in
            <code className="rounded bg-neutral-100 px-1 py-0.5 text-[11px]">
              .env.local
            </code>{" "}
            and restart the dev server after making changes.
          </p>
        </section>

        <section
          id="workflow"
          className="flex flex-1 flex-col gap-4 rounded-2xl border border-dashed border-neutral-300 bg-white/70 p-8"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
            PolicyMind Workflow
          </p>
          <h2 className="text-2xl font-semibold text-neutral-900">
            Every login unlocks actionable regulatory intelligence
          </h2>
          <ol className="space-y-4 text-sm text-neutral-700">
            {workflowSteps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
          <p className="text-sm text-neutral-500">
            Not ready to connect Auth0 yet? Explore the public overview or
            review the implementation checklist inside the README.
          </p>
        </section>
      </main>
    </div>
  );
}
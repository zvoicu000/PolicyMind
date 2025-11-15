import { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { getOnboardingProfile } from "@/lib/onboarding-store";

interface WorkspaceLayoutProps {
  children: ReactNode;
}

async function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const session = await auth0.getSession();
  if (!session) {
    redirect("/login");
  }
  const onboarding = session ? await getOnboardingProfile(session.user.sub) : null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              PolicyMind Workspace
            </p>
            <p className="text-lg font-semibold text-neutral-900">
              {onboarding?.companyName ?? "New organization"}
            </p>
          </div>
          <nav className="flex items-center gap-4 text-sm text-neutral-600">
            <Link href="/workspace" className="hover:text-neutral-900">
              Dashboard
            </Link>
            <Link href="/workspace/onboarding" className="hover:text-neutral-900">
              Onboarding
            </Link>
            <Link href="/auth/logout" className="text-neutral-400 hover:text-neutral-900">
              Sign out
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}

export default WorkspaceLayout;

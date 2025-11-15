"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";

const CTA_CLASSES =
  "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

export function LoginButton() {
  const pathname = usePathname();
  const returnTo =
    pathname && pathname !== "/login" ? pathname : "/workspace/onboarding";

  return (
    <a
      href={`/auth/login?returnTo=${encodeURIComponent(returnTo)}`}
      className={`${CTA_CLASSES} bg-black text-white hover:bg-neutral-800`}
    >
      Sign in with Auth0
    </a>
  );
}

export function LogoutButton() {
  return (
    <Link
      href="/auth/logout"
      prefetch={false}
      className={`${CTA_CLASSES} border border-neutral-300 text-neutral-900 hover:bg-neutral-100`}
    >
      Sign out
    </Link>
  );
}

export function ProfileSummary() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <p className="text-sm text-neutral-500">Checking your session…</p>;
  }

  if (!user) {
    return (
      <p className="text-sm text-neutral-600">
        Use your corporate Auth0 account to access PolicyMind.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-neutral-200 bg-white/60 p-4 text-sm text-neutral-800 shadow-sm">
      <p className="font-semibold">Signed in as {user.name ?? user.email}</p>
      <p className="text-neutral-600">{user.email}</p>
      <Link
        href="/workspace"
        className="text-blue-600 underline-offset-2 hover:underline"
      >
        Continue to the workspace
      </Link>
    </div>
  );
}
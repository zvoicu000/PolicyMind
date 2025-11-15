import { Metadata } from "next";

import { LoginButton, ProfileSummary } from "@/components/auth/AuthButtons";

export const metadata: Metadata = {
  title: "Sign in • PolicyMind",
  description: "Secure Auth0 sign-in for PolicyMind compliance workflows.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 py-12 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-10 text-center shadow-2xl backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-neutral-400">
          PolicyMind
        </p>
        <h1 className="mt-4 text-3xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-neutral-300">
          Use your Auth0 account to jump straight into the PolicyMind workspace.
        </p>
        <div className="mt-8 flex flex-col gap-4">
          <LoginButton />
          <ProfileSummary />
        </div>
      </div>
    </div>
  );
}
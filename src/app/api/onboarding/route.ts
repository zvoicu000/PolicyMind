import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import {
  getOnboardingProfile,
  saveOnboardingProfile,
  OnboardingProfile,
} from "@/lib/onboarding-store";

function validatePayload(payload: Partial<OnboardingProfile>) {
  const requiredStrings: Array<keyof OnboardingProfile> = [
    "companyName",
    "hqCountry",
    "employeeCount",
    "riskStance",
    "notificationChannel",
    "summaryFocus",
  ];

  for (const key of requiredStrings) {
    if (!payload[key] || typeof payload[key] !== "string") {
      return `Missing or invalid field: ${key}`;
    }
  }

  if (!Array.isArray(payload.sectors)) {
    return "Sectors must be an array.";
  }

  if (!Array.isArray(payload.regulatorFeeds)) {
    return "Regulator feeds must be an array.";
  }

  if (!Array.isArray(payload.policySnapshots)) {
    return "Policy snapshots must be an array.";
  }

  return null;
}

export async function GET() {
  const session = await auth0.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getOnboardingProfile(session.user.sub);
  return NextResponse.json(profile);
}

export async function POST(request: Request) {
  const session = await auth0.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as Partial<OnboardingProfile>;
  const error = validatePayload(payload);

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  await saveOnboardingProfile(session.user, payload as OnboardingProfile);

  return NextResponse.json({ success: true });
}

import type { Prisma, Company } from "@/generated/prisma/client";
import { $Enums } from "@/generated/prisma/client";
import { prisma } from "./prisma";

export type PolicyMaturity = "none" | "draft" | "approved" | "monitored";

export interface PolicySnapshot {
  area: string;
  maturity: PolicyMaturity;
  ownerTeam: string;
  ownerContact: string;
}

export interface OnboardingProfile {
  companyName: string;
  hqCountry: string;
  employeeCount: string;
  sectors: string[];
  regulatorFeeds: string[];
  policySnapshots: PolicySnapshot[];
  riskStance: "conservative" | "balanced" | "aggressive";
  notificationChannel: "gmail";
  summaryFocus: "weekly" | "biweekly" | "monthly";
  updatedAt: string;
}

export interface SessionUserProfile {
  sub: string;
  email?: string | null;
  name?: string | null;
  picture?: string | null;
}

const riskMap: Record<OnboardingProfile["riskStance"], $Enums.RiskStance> = {
  conservative: $Enums.RiskStance.CONSERVATIVE,
  balanced: $Enums.RiskStance.BALANCED,
  aggressive: $Enums.RiskStance.AGGRESSIVE,
};

const summaryMap: Record<
  OnboardingProfile["summaryFocus"],
  $Enums.SummaryCadence
> = {
  weekly: $Enums.SummaryCadence.WEEKLY,
  biweekly: $Enums.SummaryCadence.BIWEEKLY,
  monthly: $Enums.SummaryCadence.MONTHLY,
};

const inverseRiskMap = invertRecord(riskMap);
const inverseSummaryMap = invertRecord(summaryMap);
const inverseNotificationMap: Record<$Enums.NotificationChannel, OnboardingProfile["notificationChannel"]> = {
  [$Enums.NotificationChannel.EMAIL]: "gmail",
  [$Enums.NotificationChannel.SLACK]: "gmail",
  [$Enums.NotificationChannel.TEAMS]: "gmail",
};

export async function saveOnboardingProfile(
  user: SessionUserProfile,
  profile: Omit<OnboardingProfile, "updatedAt">
): Promise<OnboardingProfile> {
  await ensureUserRecord(user);

  const company = await prisma.$transaction(async (tx) => {
    const membership = await tx.companyMember.findFirst({
      where: { userId: user.sub },
      include: { company: true },
      orderBy: { createdAt: "asc" },
    });

    const data = buildCompanyPayload(profile);

    if (membership?.company) {
      return tx.company.update({
        where: { id: membership.companyId },
        data,
      });
    }

    return tx.company.create({
      data: {
        ...data,
        createdByUserId: user.sub,
        members: {
          create: {
            userId: user.sub,
            role: $Enums.CompanyRole.OWNER,
            status: $Enums.MemberStatus.ACTIVE,
          },
        },
      },
    });
  });

  return toOnboardingProfile(company);
}

export async function getOnboardingProfile(userId: string): Promise<OnboardingProfile | null> {
  const membership = await prisma.companyMember.findFirst({
    where: { userId },
    include: { company: true },
    orderBy: { createdAt: "asc" },
  });

  if (!membership?.company) {
    return null;
  }

  return toOnboardingProfile(membership.company);
}

async function ensureUserRecord(user: SessionUserProfile) {
  await prisma.user.upsert({
    where: { id: user.sub },
    update: {
      email: user.email ?? undefined,
      name: user.name ?? undefined,
      picture: user.picture ?? undefined,
    },
    create: {
      id: user.sub,
      email: user.email,
      name: user.name,
      picture: user.picture,
    },
  });
}

type CompanyProfilePayload = {
  name: string;
  hqCountry: string;
  employeeCountBand: string;
  sectors: Prisma.InputJsonValue;
  regulatorFeeds: Prisma.InputJsonValue;
  policySnapshots: Prisma.InputJsonValue;
  riskStance: $Enums.RiskStance;
  notificationChannel: $Enums.NotificationChannel;
  summaryCadence: $Enums.SummaryCadence;
  onboardingCompletedAt: Date;
};

function buildCompanyPayload(profile: Omit<OnboardingProfile, "updatedAt">): CompanyProfilePayload {
  return {
    name: profile.companyName,
    hqCountry: profile.hqCountry,
    employeeCountBand: profile.employeeCount,
    sectors: profile.sectors as unknown as Prisma.InputJsonValue,
    regulatorFeeds: profile.regulatorFeeds as unknown as Prisma.InputJsonValue,
    policySnapshots: profile.policySnapshots as unknown as Prisma.InputJsonValue,
    riskStance: riskMap[profile.riskStance],
    notificationChannel: $Enums.NotificationChannel.EMAIL,
    summaryCadence: summaryMap[profile.summaryFocus],
    onboardingCompletedAt: new Date(),
  };
}

function toOnboardingProfile(company: Company): OnboardingProfile {
  return {
    companyName: company.name,
    hqCountry: company.hqCountry,
    employeeCount: company.employeeCountBand,
    sectors: parseStringArray(company.sectors),
    regulatorFeeds: parseStringArray(company.regulatorFeeds),
    policySnapshots: parsePolicySnapshots(company.policySnapshots),
    riskStance: inverseRiskMap[company.riskStance],
    notificationChannel: inverseNotificationMap[company.notificationChannel],
    summaryFocus: inverseSummaryMap[company.summaryCadence],
    updatedAt: company.updatedAt.toISOString(),
  } as OnboardingProfile;
}

function parseStringArray(value: Prisma.JsonValue) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

export function parsePolicySnapshots(value: Prisma.JsonValue) {
  if (!Array.isArray(value)) {
    return [] as PolicySnapshot[];
  }

  return value.reduce<PolicySnapshot[]>((snapshots, entry) => {
    if (typeof entry !== "object" || entry === null) {
      return snapshots;
    }

    const candidate = entry as Record<string, unknown>;
    if (
      typeof candidate.area === "string" &&
      typeof candidate.maturity === "string" &&
      typeof candidate.ownerTeam === "string"
    ) {
      snapshots.push({
        area: candidate.area,
        maturity: candidate.maturity as PolicyMaturity,
        ownerTeam: candidate.ownerTeam,
        ownerContact: typeof candidate.ownerContact === "string" ? candidate.ownerContact : "",
      });
    }

    return snapshots;
  }, []);
}

function invertRecord<T extends string | number | symbol, U extends string | number | symbol>(
  input: Record<T, U>
) {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [value, key])
  ) as Record<U, T>;
}

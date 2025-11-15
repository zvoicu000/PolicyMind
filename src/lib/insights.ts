import type { Prisma, RegulationInsight } from "@/generated/prisma/client";

export type SerializedInsight = {
  id: string;
  companyId?: string;
  title: string;
  summary: string;
  actionItems: string[];
  notifiedTeams: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  status: string;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export function serializeInsight(record: RegulationInsight): SerializedInsight {
  return {
    id: record.id,
    companyId: record.companyId,
    title: record.title,
    summary: record.summary,
    actionItems: parseStringArray(record.actionItems),
    notifiedTeams: parseStringArray(record.notifiedTeams),
    riskLevel: normalizeRisk(record.riskLevel),
    status: record.status,
    archivedAt: record.archivedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function parseStringArray(value: Prisma.JsonValue | null): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }
  return [];
}

function normalizeRisk(value: string) {
  if (value === "HIGH" || value === "MEDIUM") {
    return value;
  }
  return "LOW";
}

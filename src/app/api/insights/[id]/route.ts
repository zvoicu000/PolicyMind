import { NextResponse } from "next/server";

import { auth0 } from "@/lib/auth0";
import { serializeInsight } from "@/lib/insights";
import { prisma } from "@/lib/prisma";
import { $Enums } from "@/generated/prisma/client";

const ALLOWED_STATUSES = new Set<$Enums.InsightStatus>(["NEW", "ASSIGNED", "DONE"]);

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.companyMember.findFirst({
    where: { userId: session.user.sub },
    select: { companyId: true },
  });

  if (!membership) {
    return NextResponse.json({ error: "No company association" }, { status: 400 });
  }

  const payload = await request.json().catch(() => ({}));
  const statusInput = typeof payload.status === "string" ? payload.status.toUpperCase() : null;
  const requestUnarchive = payload.unarchive === true;

  if (!statusInput && !requestUnarchive) {
    return NextResponse.json({ error: "Provide a status or set unarchive to true" }, { status: 400 });
  }

  if (statusInput && !ALLOWED_STATUSES.has(statusInput as $Enums.InsightStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const insight = await prisma.regulationInsight.findUnique({ where: { id: params.id } });
  if (!insight || insight.companyId !== membership.companyId) {
    return NextResponse.json({ error: "Insight not found" }, { status: 404 });
  }

  const updateData: {
    status?: $Enums.InsightStatus;
    archivedAt?: Date | null;
  } = {};

  if (statusInput) {
    updateData.status = statusInput as $Enums.InsightStatus;
    updateData.archivedAt = statusInput === "DONE" ? new Date() : null;
  }

  if (requestUnarchive) {
    updateData.archivedAt = null;
    if (!statusInput && insight.status === "DONE") {
      updateData.status = $Enums.InsightStatus.ASSIGNED;
    }
  }

  const updated = await prisma.regulationInsight.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json(serializeInsight(updated));
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.companyMember.findFirst({
    where: { userId: session.user.sub },
    select: { companyId: true },
  });

  if (!membership) {
    return NextResponse.json({ error: "No company association" }, { status: 400 });
  }

  const insight = await prisma.regulationInsight.findUnique({ where: { id: params.id } });
  if (!insight || insight.companyId !== membership.companyId) {
    return NextResponse.json({ error: "Insight not found" }, { status: 404 });
  }

  await prisma.regulationInsight.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}

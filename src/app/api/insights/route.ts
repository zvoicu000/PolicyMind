import { NextResponse } from "next/server";

import { auth0 } from "@/lib/auth0";
import { serializeInsight } from "@/lib/insights";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const archivedParam = url.searchParams.get("archived");
  const includeArchived = archivedParam === "1" || archivedParam?.toLowerCase() === "true";

  const membership = await prisma.companyMember.findFirst({
    where: { userId: session.user.sub },
    select: { companyId: true },
  });

  if (!membership) {
    return NextResponse.json([], { status: 200 });
  }

  const insights = await prisma.regulationInsight.findMany({
    where: {
      companyId: membership.companyId,
      archivedAt: includeArchived ? { not: null } : null,
    },
    orderBy: includeArchived ? { archivedAt: "desc" } : { createdAt: "desc" },
  });

  return NextResponse.json(insights.map(serializeInsight));
}

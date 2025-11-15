import { NextResponse } from "next/server";

import { auth0 } from "@/lib/auth0";
import { serializeInsight } from "@/lib/insights";
import { getOnboardingProfile } from "@/lib/onboarding-store";
import { analyzeRegulationForCompany } from "@/lib/regulation-analyzer";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth0.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  const title = formData.get("title");

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing PDF file" }, { status: 400 });
  }

  if (file.type && file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
  }

  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "PDF too large (limit 8MB)" }, { status: 400 });
  }

  const membership = await prisma.companyMember.findFirst({
    where: { userId: session.user.sub },
    select: { companyId: true },
  });

  if (!membership) {
    return NextResponse.json({ error: "No company associated with account" }, { status: 400 });
  }

  const profile = await getOnboardingProfile(session.user.sub);
  if (!profile) {
    return NextResponse.json({ error: "Complete onboarding first" }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfParse = (await import("pdf-parse"))?.default;
    const parsed = await pdfParse(buffer);
    const text = parsed.text?.trim();

    if (!text) {
      return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 400 });
    }

    const analysis = await analyzeRegulationForCompany({
      title: typeof title === "string" ? title : undefined,
      regulationText: text,
      companyName: profile.companyName,
      sectors: profile.sectors,
      policies: profile.policySnapshots,
    });

    const record = await prisma.regulationInsight.create({
      data: {
        companyId: membership.companyId,
        title: analysis.title,
        summary: analysis.summary,
        riskLevel: analysis.riskLevel,
        actionItems: analysis.actionItems as Prisma.InputJsonValue,
        notifiedTeams: analysis.notifiedTeams as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(serializeInsight(record));
  } catch (error) {
    console.error("PDF analysis failed", error);
    return NextResponse.json({ error: "Failed to analyze PDF" }, { status: 500 });
  }
}

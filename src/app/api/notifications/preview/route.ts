import { NextResponse } from "next/server";

import { auth0 } from "@/lib/auth0";
import { serializeInsight } from "@/lib/insights";
import { parsePolicySnapshots, type PolicySnapshot } from "@/lib/onboarding-store";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import type { Prisma } from "@/generated/prisma/client";

export async function POST(request: Request) {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const insightId = typeof body.insightId === "string" ? body.insightId : null;
  if (!insightId) {
    return NextResponse.json({ error: "Insight ID required" }, { status: 400 });
  }

  const membership = await prisma.companyMember.findFirst({
    where: { userId: session.user.sub },
    select: {
      companyId: true,
      company: {
        select: {
          name: true,
          notificationChannel: true,
          policySnapshots: true,
        },
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "No company association" }, { status: 400 });
  }

  const insight = await prisma.regulationInsight.findUnique({ where: { id: insightId } });
  if (!insight || insight.companyId !== membership.companyId) {
    return NextResponse.json({ error: "Insight not found" }, { status: 404 });
  }

  const serialized = serializeInsight(insight);
  const companyName = membership.company?.name ?? "Your company";
  const rawSnapshots = membership.company?.policySnapshots as Prisma.JsonValue | undefined;
  const policySnapshots = rawSnapshots ? parsePolicySnapshots(rawSnapshots) : [];
  const recipients = resolveRecipients({
    userEmail: session.user?.email,
    notifiedTeams: serialized.notifiedTeams,
    policySnapshots,
  });

  if (!recipients.length) {
    return NextResponse.json(
      {
        error: "Add NOTIFICATION_RECIPIENTS or ensure your Auth0 profile exposes an email",
      },
      { status: 400 }
    );
  }

  const email = buildNotificationMessage(serialized, companyName);
  const result = await sendMail({
    to: recipients,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });

  return NextResponse.json({
    channel: "Email",
    recipients,
    subject: email.subject,
    messageId: result.messageId,
    previewUrl: result.previewUrl,
    transport: result.transport,
  });
}

function buildNotificationMessage(insight: ReturnType<typeof serializeInsight>, companyName: string) {
  const actionLines = insight.actionItems.length
    ? insight.actionItems
    : ["Review this update with the policy owner."];

  const notified = insight.notifiedTeams.length ? insight.notifiedTeams.join(", ") : "core compliance team";
  const subject = `${companyName} | ${insight.title} (Risk: ${insight.riskLevel})`;
  const textLines = [
    insight.summary,
    "",
    "Top actions:",
    ...actionLines.map((item) => `• ${item}`),
    "",
    `Loop in: ${notified}`,
  ];

  const html = `
    <p>${insight.summary}</p>
    <p><strong>Top actions</strong></p>
    <ul>
      ${actionLines.map((item) => `<li>${item}</li>`).join("\n")}
    </ul>
    <p><strong>Loop in:</strong> ${notified}</p>
  `.trim();

  return {
    subject,
    text: textLines.join("\n"),
    html,
  };
}

function resolveRecipients(options: {
  userEmail?: string | null;
  notifiedTeams: string[];
  policySnapshots: PolicySnapshot[];
}) {
  const configured = (process.env.NOTIFICATION_RECIPIENTS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  const ownerContacts = matchOwnerContacts(options.notifiedTeams, options.policySnapshots);
  const fallback = typeof options.userEmail === "string" && options.userEmail.length ? [options.userEmail] : [];
  const merged = [...ownerContacts, ...configured, ...fallback];
  return Array.from(new Set(merged));
}

function matchOwnerContacts(notifiedTeams: string[], policySnapshots: PolicySnapshot[]) {
  if (!policySnapshots.length) {
    return [] as string[];
  }

  const normalizedTargets = notifiedTeams
    .map((team) => team.trim().toLowerCase())
    .filter((team) => team.length > 0);

  const candidates = policySnapshots
    .map((snapshot) => snapshot.ownerContact?.trim())
    .filter((contact): contact is string => isValidEmail(contact));

  if (!normalizedTargets.length) {
    return candidates;
  }

  return policySnapshots
    .filter((snapshot) => snapshot.ownerContact && isValidEmail(snapshot.ownerContact))
    .filter((snapshot) =>
      normalizedTargets.some((target) => {
        const area = snapshot.area.trim().toLowerCase();
        const ownerTeam = snapshot.ownerTeam.trim().toLowerCase();
        return (
          (area && (area.includes(target) || target.includes(area))) ||
          (ownerTeam && (ownerTeam.includes(target) || target.includes(ownerTeam)))
        );
      })
    )
    .map((snapshot) => snapshot.ownerContact!.trim());
}

function isValidEmail(value?: string) {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

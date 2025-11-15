import OpenAI from "openai";

import type { PolicySnapshot } from "@/lib/onboarding-store";

const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export type RegulationAnalysis = {
  title: string;
  summary: string;
  actionItems: string[];
  notifiedTeams: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
};

export async function analyzeRegulationForCompany(options: {
  title?: string;
  regulationText: string;
  companyName: string;
  sectors: string[];
  policies: PolicySnapshot[];
}): Promise<RegulationAnalysis> {
  const trimmed = options.regulationText.trim();
  if (!trimmed) {
    throw new Error("Regulation text is empty");
  }

  const normalized = {
    title: options.title?.trim() || "Uploaded regulation",
    companyName: options.companyName,
    sectors: options.sectors,
    policies: options.policies,
    excerpt: trimmed.slice(0, 16000),
  };

  if (!process.env.OPENAI_API_KEY) {
    return buildFallbackAnalysis(normalized);
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt =
      "You are PolicyMind's EU compliance copilot. Given the JSON input, return JSON with keys: title, summary, actionItems (array of strings), notifiedTeams (array), riskLevel (LOW/MEDIUM/HIGH)." +
      " Focus on actionable steps tied to the company's sectors and policies. Keep output under 180 words.";

    const response = await client.responses.create({
      model: DEFAULT_MODEL,
      temperature: 0.25,
      input: `${prompt}\nInput: ${JSON.stringify(normalized)}`,
    });

    const parsed = safeParseAnalysis(extractResponseText(response));
    if (parsed) {
      return parsed;
    }
  } catch (error) {
    console.warn("Falling back to heuristic regulation summary", error);
  }

  return buildFallbackAnalysis(normalized);
}

function safeParseAnalysis(payload: string | undefined): RegulationAnalysis | null {
  if (!payload) return null;
  try {
    const cleanPayload = extractJsonBlock(payload);
    const parsed = JSON.parse(cleanPayload) as Partial<RegulationAnalysis>;
    if (!parsed.summary || !Array.isArray(parsed.actionItems) || !Array.isArray(parsed.notifiedTeams)) {
      return null;
    }
    return {
      title: parsed.title ?? "Uploaded regulation",
      summary: parsed.summary,
      actionItems: parsed.actionItems.filter((item): item is string => typeof item === "string" && item.length > 0),
      notifiedTeams: parsed.notifiedTeams.filter((item): item is string => typeof item === "string" && item.length > 0),
      riskLevel: parsed.riskLevel === "HIGH" || parsed.riskLevel === "MEDIUM" ? parsed.riskLevel : "LOW",
    } satisfies RegulationAnalysis;
  } catch (error) {
    console.warn("Unable to parse regulation analysis", error);
    return null;
  }
}

function buildFallbackAnalysis(context: {
  title: string;
  companyName: string;
  sectors: string[];
  policies: PolicySnapshot[];
  excerpt: string;
}): RegulationAnalysis {
  const shortExcerpt = context.excerpt.split(/\s+/).slice(0, 80).join(" ");
  const actionBaseline = context.policies.slice(0, 3).map((policy) => `Review ${policy.area} controls with ${policy.ownerTeam || "policy owner"}.`);
  const contactLabels = context.policies
    .map((policy) => policy.ownerTeam || policy.area)
    .filter((label): label is string => Boolean(label && label.trim()))
    .slice(0, 3);

  return {
    title: context.title,
    summary: `${context.companyName} monitoring highlights: ${shortExcerpt || "New EU mandate uploaded."}`,
    actionItems: actionBaseline.length ? actionBaseline : ["Assign an owner to review this mandate."],
    notifiedTeams: contactLabels.length ? contactLabels : context.sectors.slice(0, 3),
    riskLevel: "MEDIUM",
  };
}

function extractJsonBlock(payload: string): string {
  const trimmed = payload.trim();
  if (trimmed.startsWith("```")) {
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch?.[1]) {
      return fenceMatch[1].trim();
    }
  }
  return trimmed;
}

function extractResponseText(response: unknown) {
  const outputText = (response as { output_text?: unknown }).output_text;
  if (typeof outputText === "string") {
    return outputText;
  }
  if (Array.isArray(outputText)) {
    return outputText.join("\n");
  }
  const outputItems = (response as { output?: unknown }).output;
  if (Array.isArray(outputItems)) {
    return outputItems
      .map((item) => {
        if (typeof item === "object" && item && "content" in item) {
          return ((item as { content?: Array<{ text?: string }> }).content ?? [])
            .map((segment) => (segment?.text ?? ""))
            .join("\n");
        }
        return "";
      })
      .join("\n");
  }
  return undefined;
}

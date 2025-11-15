"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { OnboardingProfile } from "@/lib/onboarding-store";

interface StepProps {
  data: DraftProfile;
  onChange: (partial: Partial<DraftProfile>) => void;
}

const sectorOptions = [
  "Financial Services",
  "Healthcare",
  "Retail",
  "Technology",
  "Public Sector",
];

const regulatorOptions = [
  "EUR-Lex",
  "European Commission",
  "ESMA",
  "EBA",
  "EDPB",
];

const policyAreas = [
  { key: "dataPrivacy", label: "Data Privacy" },
  { key: "financialCrime", label: "Financial Crime" },
  { key: "labor", label: "Labor & HR" },
  { key: "environment", label: "Environment" },
];

type DraftPolicySnapshot = OnboardingProfile["policySnapshots"][number];

type DraftProfile = Omit<OnboardingProfile, "updatedAt">;

const defaultDraft: DraftProfile = {
  companyName: "",
  hqCountry: "",
  employeeCount: "",
  sectors: [],
  regulatorFeeds: ["EUR-Lex", "European Commission"],
  policySnapshots: policyAreas.map((area) => ({
    area: area.label,
    maturity: "draft",
    ownerTeam: "",
  })),
  riskStance: "balanced",
  notificationChannel: "slack",
  summaryFocus: "weekly",
};

function CompanyStep({ data, onChange }: StepProps) {
  return (
    <div className="space-y-6">
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-neutral-800">Company name</span>
        <input
          value={data.companyName}
          onChange={(event) => onChange({ companyName: event.target.value })}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 placeholder:text-neutral-400"
          placeholder="PolicyMind GmbH"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-neutral-800">Headquarters country</span>
        <input
          value={data.hqCountry}
          onChange={(event) => onChange({ hqCountry: event.target.value })}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 placeholder:text-neutral-400"
          placeholder="Germany"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-neutral-800">Employee band</span>
        <select
          value={data.employeeCount}
          onChange={(event) => onChange({ employeeCount: event.target.value })}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900"
        >
          <option value="">Select…</option>
          <option value="1-50">1-50</option>
          <option value="51-250">51-250</option>
          <option value="251-1k">251-1k</option>
          <option value=">1k">1k+</option>
        </select>
      </label>
      <div>
        <p className="text-sm font-medium text-neutral-900">Sectors</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {sectorOptions.map((sector) => {
            const isChecked = data.sectors.includes(sector);
            return (
              <button
                type="button"
                key={sector}
                onClick={() => {
                  const sectors = isChecked
                    ? data.sectors.filter((item) => item !== sector)
                    : [...data.sectors, sector];
                  onChange({ sectors });
                }}
                className={`rounded-full border px-4 py-1 text-sm transition-colors ${
                  isChecked
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 bg-white text-neutral-800 hover:border-neutral-400"
                }`}
              >
                {sector}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PolicyStep({ data, onChange }: StepProps) {
  const updateSnapshot = (index: number, partial: Partial<DraftPolicySnapshot>) => {
    const policySnapshots = data.policySnapshots.map((snapshot, idx) =>
      idx === index ? { ...snapshot, ...partial } : snapshot
    );
    onChange({ policySnapshots });
  };

  return (
    <div className="space-y-6">
      {data.policySnapshots.map((snapshot, index) => (
        <div key={snapshot.area} className="rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-900">
              {snapshot.area}
            </p>
            <select
              value={snapshot.maturity}
              onChange={(event) =>
                updateSnapshot(index, {
                  maturity: event.target.value as DraftPolicySnapshot["maturity"],
                })
              }
              className="rounded-lg border border-neutral-300 px-3 py-1 text-sm text-neutral-900"
            >
              <option value="none">Not covered</option>
              <option value="draft">Drafting</option>
              <option value="approved">Approved</option>
              <option value="monitored">Monitored</option>
            </select>
          </div>
          <label className="mt-3 flex flex-col gap-1 text-xs font-medium text-neutral-600">
            Owner team
            <input
              value={snapshot.ownerTeam}
              onChange={(event) => updateSnapshot(index, { ownerTeam: event.target.value })}
              placeholder="Legal Ops"
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400"
            />
          </label>
        </div>
      ))}
      <div>
        <p className="text-sm font-semibold text-neutral-900">Regulators to watch</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {regulatorOptions.map((regulator) => {
            const isChecked = data.regulatorFeeds.includes(regulator);
            return (
              <button
                type="button"
                key={regulator}
                onClick={() => {
                  const regulatorFeeds = isChecked
                    ? data.regulatorFeeds.filter((item) => item !== regulator)
                    : [...data.regulatorFeeds, regulator];
                  onChange({ regulatorFeeds });
                }}
                className={`rounded-full border px-4 py-1 text-sm ${
                  isChecked
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-neutral-300 text-neutral-700"
                }`}
              >
                {regulator}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DeliveryStep({ data, onChange }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-semibold text-neutral-900">Risk stance</p>
        <div className="flex gap-3">
          {["conservative", "balanced", "aggressive"].map((stance) => {
            const isActive = data.riskStance === stance;
            return (
              <label
                key={stance}
                className={`flex flex-1 cursor-pointer flex-col gap-2 rounded-2xl border p-4 text-sm transition-colors ${
                  isActive
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400"
                }`}
              >
                <input
                  type="radio"
                  name="riskStance"
                  value={stance}
                  checked={isActive}
                  onChange={(event) => onChange({ riskStance: event.target.value as DraftProfile["riskStance"] })}
                  className="h-4 w-4 text-neutral-900"
                />
                <span className="font-semibold capitalize">{stance}</span>
                <span className="text-xs text-neutral-400">
                  {stance === "conservative"
                    ? "Prioritize low-risk coverage"
                    : stance === "balanced"
                    ? "Blend agility and rigor"
                    : "Move fast on high-risk updates"}
                </span>
              </label>
            );
          })}
        </div>
      </div>
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-neutral-800">Notifications</span>
        <select
          value={data.notificationChannel}
          onChange={(event) =>
            onChange({ notificationChannel: event.target.value as DraftProfile["notificationChannel"] })
          }
          className="rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900"
        >
          <option value="slack">Slack</option>
          <option value="teams">Teams</option>
          <option value="email">Email</option>
        </select>
      </label>
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-neutral-800">Summary cadence</span>
        <select
          value={data.summaryFocus}
          onChange={(event) =>
            onChange({ summaryFocus: event.target.value as DraftProfile["summaryFocus"] })
          }
          className="rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900"
        >
          <option value="weekly">Weekly</option>
          <option value="biweekly">Bi-weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </label>
    </div>
  );
}

const steps = [
  { title: "Company profile", component: CompanyStep },
  { title: "Policy surface", component: PolicyStep },
  { title: "Delivery preferences", component: DeliveryStep },
];

export function OnboardingWizard({ onCompletePath }: { onCompletePath?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftProfile>(defaultDraft);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const response = await fetch("/api/onboarding");
        if (!response.ok) {
          throw new Error("Unable to load onboarding data");
        }
        const profile = (await response.json()) as OnboardingProfile | null;
        if (profile && isMounted) {
          const { updatedAt: _updatedAt, ...rest } = profile;
          void _updatedAt;
          setDraft(rest);
        }
      } catch (fetchError) {
        console.warn(fetchError);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const CurrentStep = useMemo(() => steps[stepIndex].component, [stepIndex]);

  const handleChange = (partial: Partial<DraftProfile>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        throw new Error(details.error ?? "Request failed");
      }

      if (stepIndex < steps.length - 1) {
        setStepIndex((prev) => prev + 1);
      } else if (onCompletePath) {
        router.push(onCompletePath);
      }
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-neutral-500">Loading onboarding data…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 text-sm text-neutral-600">
        {steps.map((step, index) => (
          <div key={step.title} className="flex items-center gap-2">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
              index === stepIndex
                ? "bg-neutral-900 text-white"
                : index < stepIndex
                ? "bg-green-100 text-green-700"
                : "bg-neutral-100 text-neutral-500"
            }`}>
              {index + 1}
            </span>
            <span className={index === stepIndex ? "text-neutral-900" : undefined}>
              {step.title}
            </span>
          </div>
        ))}
      </div>
      <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <CurrentStep data={draft} onChange={handleChange} />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setStepIndex((prev) => Math.max(prev - 1, 0))}
          disabled={stepIndex === 0 || saving}
          className="rounded-full border border-neutral-300 px-5 py-2 text-sm font-semibold text-neutral-700 disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-neutral-900 px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {stepIndex === steps.length - 1 ? "Finish" : "Save & Continue"}
        </button>
      </div>
    </form>
  );
}

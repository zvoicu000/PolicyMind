"use client";

import { ChangeEvent, FormEvent, useState } from "react";

export type RegulationAnalysisDto = {
  title: string;
  summary: string;
  actionItems: string[];
  notifiedTeams: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
};

export function RegulationUploadPanel() {
  const [fileName, setFileName] = useState<string>("");
  const [title, setTitle] = useState("Uploaded EU regulation");
  const [analysis, setAnalysis] = useState<RegulationAnalysisDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) {
      setFile(null);
      setFileName("");
      return;
    }
    setFile(selected);
    setFileName(selected.name);
    if (title === "Uploaded EU regulation") {
      setTitle(selected.name.replace(/\.pdf$/i, ""));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError("Attach a PDF first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/regulations/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        throw new Error(details.error || "Upload failed");
      }
      const payload = (await response.json()) as RegulationAnalysisDto;
      setAnalysis(payload);
    } catch (uploadError) {
      setAnalysis(null);
      setError((uploadError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
            Upload regulation PDF
          </p>
          <h2 className="text-2xl font-semibold text-neutral-900">Paste a delegated act for instant steps</h2>
          <p className="mt-2 text-sm text-neutral-600">Drop any EU PDF (≤8MB). PolicyMind will summarize and highlight who should act.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="flex flex-col gap-2 text-sm font-medium text-neutral-800">
          Regulation title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-neutral-900"
            placeholder="AI Act implementing decision"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-neutral-800">
          PDF attachment
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="rounded-xl border border-dashed border-neutral-300 px-4 py-4 text-neutral-700"
          />
          {fileName ? <span className="text-xs text-neutral-500">Selected: {fileName}</span> : null}
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading || !file}
            className="rounded-full bg-neutral-900 px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Analyzing…" : "Summarize PDF"}
          </button>
          {analysis ? (
            <button
              type="button"
              className="text-sm font-semibold text-neutral-600"
              onClick={() => {
                setAnalysis(null);
                setFile(null);
                setFileName("");
              }}
            >
              Reset
            </button>
          ) : null}
        </div>
      </form>

      {analysis ? (
        <div className="mt-8 rounded-2xl border border-neutral-200 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
                Uploaded briefing
              </p>
              <h3 className="text-xl font-semibold text-neutral-900">{analysis.title}</h3>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                analysis.riskLevel === "HIGH"
                  ? "bg-red-100 text-red-700"
                  : analysis.riskLevel === "MEDIUM"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {analysis.riskLevel} RISK
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-neutral-800">{analysis.summary}</p>
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Action items</p>
            <ul className="mt-2 space-y-2 text-sm text-neutral-800">
              {analysis.actionItems.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-neutral-900" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 text-sm text-neutral-600">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Notify</p>
            <p>{analysis.notifiedTeams.join(" • ") || "Assign relevant owners"}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

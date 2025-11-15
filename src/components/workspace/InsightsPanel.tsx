"use client";

import { useCallback, useEffect, useState } from "react";

export type InsightRecord = {
  id: string;
  title: string;
  summary: string;
  actionItems: string[];
  notifiedTeams: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  status: "NEW" | "ASSIGNED" | "DONE";
  archivedAt?: string | null;
  createdAt: string;
};

const STATUS_OPTIONS: InsightRecord["status"][] = ["NEW", "ASSIGNED", "DONE"];

export function InsightsPanel() {
  const [insights, setInsights] = useState<InsightRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [receiptById, setReceiptById] = useState<Record<
    string,
    {
      channel: string;
      recipients: string[];
      subject: string;
      transport: string;
      messageId: string;
      previewUrl?: string;
    }
  >>({});
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [archivedInsights, setArchivedInsights] = useState<InsightRecord[]>([]);
  const [unarchivingId, setUnarchivingId] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/insights", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Unable to load insights");
      }
      const payload = (await response.json()) as InsightRecord[];
      setInsights(payload);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchInsights();
  }, [fetchInsights]);

  const fetchArchived = useCallback(async () => {
    setArchiveLoading(true);
    setArchiveError(null);
    try {
      const response = await fetch("/api/insights?archived=1", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Unable to load archive");
      }
      const payload = (await response.json()) as InsightRecord[];
      setArchivedInsights(payload);
    } catch (err) {
      setArchiveError((err as Error).message);
    } finally {
      setArchiveLoading(false);
    }
  }, []);

  const handleStatusChange = async (id: string, status: InsightRecord["status"]) => {
    setUpdatingId(id);
    setError(null);
    try {
      const response = await fetch(`/api/insights/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        throw new Error(details.error ?? "Unable to update status");
      }
      await response.json();
      await fetchInsights();
      if (archiveOpen) {
        void fetchArchived();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleArchive = () => {
    setArchiveOpen((prev) => {
      const next = !prev;
      if (next) {
        void fetchArchived();
      }
      return next;
    });
  };

  const handleUnarchive = async (id: string) => {
    setUnarchivingId(id);
    setArchiveError(null);
    setError(null);
    try {
      const response = await fetch(`/api/insights/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unarchive: true }),
      });
      if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        throw new Error(details.error ?? "Unable to unarchive insight");
      }
      await response.json();
      await fetchInsights();
      void fetchArchived();
    } catch (err) {
      setArchiveError((err as Error).message);
    } finally {
      setUnarchivingId(null);
    }
  };

  const handleSendPreview = async (id: string) => {
    setSendingId(id);
    setError(null);
    try {
      const response = await fetch("/api/notifications/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insightId: id }),
      });
      if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        throw new Error(details.error ?? "Unable to build notification");
      }
      const payload = (await response.json()) as (typeof receiptById)[string];
      setReceiptById((prev) => ({ ...prev, [id]: payload }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSendingId(null);
    }
  };

  const handleRemove = async (id: string) => {
    const confirmed = window.confirm("Remove this insight from the queue? This action cannot be undone.");
    if (!confirmed) {
      return;
    }
    setRemovingId(id);
    setError(null);
    try {
      const response = await fetch(`/api/insights/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        throw new Error(details.error ?? "Unable to remove insight");
      }
      await fetchInsights();
      if (archiveOpen) {
        void fetchArchived();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">Action queue</p>
          <h2 className="text-2xl font-semibold text-neutral-900">Saved EU briefings</h2>
          <p className="mt-2 text-sm text-neutral-600">Every PDF summary lands here so you can assign and follow up.</p>
        </div>
        <button
          type="button"
          className="text-sm font-semibold text-neutral-500"
          onClick={() => {
            void fetchInsights();
          }}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-neutral-500">Loading insights…</p>
      ) : error ? (
        <p className="mt-6 text-sm text-red-600">{error}</p>
      ) : insights.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">No uploads yet—drop a PDF to create your first task.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {insights.map((insight) => (
            <article key={insight.id} className="rounded-2xl border border-neutral-200 p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-neutral-500">
                    {new Date(insight.createdAt).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
                  </p>
                  <h3 className="text-lg font-semibold text-neutral-900">{insight.title}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      insight.riskLevel === "HIGH"
                        ? "bg-red-100 text-red-700"
                        : insight.riskLevel === "MEDIUM"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {insight.riskLevel} RISK
                  </span>
                  <select
                    value={insight.status}
                    onChange={(event) => handleStatusChange(insight.id, event.target.value as InsightRecord["status"])}
                    disabled={updatingId === insight.id}
                    className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-semibold text-neutral-800"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="mt-3 text-sm text-neutral-700">{insight.summary}</p>
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Actions</p>
                <ul className="mt-2 space-y-2 text-sm text-neutral-800">
                  {insight.actionItems.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 inline-block h-2 w-2 rounded-full bg-neutral-900" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-4 text-sm text-neutral-600">
                <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Notify</span>
                <p>{insight.notifiedTeams.join(" • ") || "Assign relevant owners"}</p>
              </div>
              <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => handleSendPreview(insight.id)}
                    disabled={sendingId === insight.id}
                    className="text-sm font-semibold text-blue-600 disabled:opacity-50"
                  >
                    {sendingId === insight.id ? "Sending…" : "Send notification"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(insight.id)}
                    disabled={removingId === insight.id}
                    className="text-sm font-semibold text-red-600 disabled:opacity-50"
                  >
                    {removingId === insight.id ? "Removing…" : "Remove from queue"}
                  </button>
                </div>
                {receiptById[insight.id] ? (
                  <div className="rounded-xl bg-neutral-50 p-3 text-xs text-neutral-700">
                    <p>
                      Sent via {receiptById[insight.id].channel} → {receiptById[insight.id].recipients.join(", ")}
                    </p>
                    <p className="mt-1 text-[11px] text-neutral-500">
                      Message ID: {receiptById[insight.id].messageId} ({receiptById[insight.id].transport})
                    </p>
                    {receiptById[insight.id].previewUrl ? (
                      <a
                        href={receiptById[insight.id].previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-blue-600"
                      >
                        Open preview
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
      <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">Archive</p>
            <p className="text-sm text-neutral-600">Done briefings stay here for audit-ready context.</p>
          </div>
          <button
            type="button"
            onClick={toggleArchive}
            className="text-sm font-semibold text-blue-600"
          >
            {archiveOpen ? "Hide" : "View"}
          </button>
        </div>
        {archiveOpen ? (
          archiveLoading ? (
            <p className="mt-4 text-sm text-neutral-500">Loading archive…</p>
          ) : archiveError ? (
            <p className="mt-4 text-sm text-red-600">{archiveError}</p>
          ) : archivedInsights.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">Complete a briefing to see it saved here.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {archivedInsights.map((item) => (
                <article key={item.id} className="rounded-xl border border-neutral-200 bg-white p-4">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-neutral-500">
                        Archived {item.archivedAt ? new Date(item.archivedAt).toLocaleDateString("en-GB", { month: "short", day: "numeric" }) : "Recently"}
                      </p>
                      <h3 className="text-base font-semibold text-neutral-900">{item.title}</h3>
                    </div>
                    <span className="text-xs font-semibold text-neutral-500">{item.notifiedTeams.join(" • ")}</span>
                  </div>
                  <p className="mt-2 text-sm text-neutral-600">{item.summary}</p>
                  <div className="mt-3 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleUnarchive(item.id)}
                      disabled={unarchivingId === item.id}
                      className="text-xs font-semibold text-blue-600 disabled:opacity-50"
                    >
                      {unarchivingId === item.id ? "Restoring…" : "Restore to queue"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )
        ) : null}
      </div>
    </section>
  );
}

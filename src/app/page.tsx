import Link from "next/link";

const features = [
  {
    title: "Source & ingest",
    description:
      "Tap into EUR-Lex, Commission feeds, and sector regulators with streaming pipelines.",
  },
  {
    title: "Parse & classify",
    description:
      "NLP distills impacted articles, obligations, and impact areas such as privacy or finance.",
  },
  {
    title: "Map to policies",
    description:
      "Link every update to the internal controls, SOPs, and owners that must react.",
  },
  {
    title: "Recommend actions",
    description:
      "Auto-generate concise playbooks, templates, and checklists prioritized by risk and deadlines.",
  },
  {
    title: "Workflow & audit",
    description:
      "Create tasks, notify teams in Slack/Teams, and capture approvals for regulators.",
  },
  {
    title: "Learn & adapt",
    description:
      "Feedback loops fine-tune NLP models, sector nuances, and member-state requirements.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16">
        <section className="flex flex-col gap-6 rounded-3xl border border-neutral-200 bg-white/80 p-10 shadow-sm lg:flex-row lg:items-center">
          <div className="flex-1 space-y-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
              PolicyMind Platform
            </p>
            <h1 className="text-4xl font-semibold text-neutral-900">
              Step-by-step EU regulatory intelligence
            </h1>
            <p className="text-lg text-neutral-600">
              PolicyMind continuously ingests EU regulations, understands their
              impact, maps them to your internal policies, and spins up
              actionable tasks—so every audit trail stays current.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2.5 font-medium text-white hover:bg-neutral-800"
              >
                Sign in with Auth0
              </Link>
              <Link
                href="#capabilities"
                className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-5 py-2.5 font-medium text-neutral-900 hover:bg-neutral-100"
              >
                Explore workflow
              </Link>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Upcoming milestones
            </p>
            <ul className="space-y-3 text-sm text-neutral-700">
              <li>• API connectors for EUR-Lex & Commission push feeds</li>
              <li>• Regulation-aware vector models with legal terminology</li>
              <li>• Slack, Teams, and email notification bridges</li>
              <li>• Export-ready supervisory reporting packs</li>
            </ul>
          </div>
        </section>

        <section id="capabilities" className="space-y-6">
          <h2 className="text-2xl font-semibold text-neutral-900">
            Workflow backbone
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-neutral-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-neutral-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

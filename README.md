## PolicyMind

PolicyMind is a Next.js (App Router) prototype for an end-to-end EU regulatory intelligence platform. The current milestone focuses on secure Auth0 login plus a product overview derived from the eight workflow pillars:

1. Source & ingest regulatory data (EUR-Lex, Commission, sector feeds).
2. Parse updates with NLP to extract obligations and impact areas.
3. Map updates to internal policies and control owners.
4. Generate actionable recommendations, templates, and checklists.
5. Create and track tasks, notifications, and approvals.
6. Maintain audit trails and exportable compliance reports.
7. Customize by member state, industry, and internal filters.
8. Continuously learn from user feedback to tune relevance.

## Auth0 configuration

1. Create a **Regular Web Application** in the Auth0 dashboard.
2. Set the allowed callback/logout URLs to `http://localhost:3000/auth/callback` and `http://localhost:3000`.
3. Duplicate `.env.example` → `.env.local` and add your tenant values:

```bash
cp .env.example .env.local
# edit the file with your Auth0 tenant details
```

| Variable | Description |
| --- | --- |
| `AUTH0_SECRET` | Random 32+ char string used to encrypt cookies. |
| `APP_BASE_URL` | The origin serving the app (default `http://localhost:3000`). |
| `AUTH0_DOMAIN` | Your Auth0 tenant domain, e.g. `demo.eu.auth0.com`. |
| `AUTH0_CLIENT_ID` / `AUTH0_CLIENT_SECRET` | Credentials from the Auth0 application. |

The Auth0 middleware (see `src/middleware.ts`) now exposes `/auth/login`, `/auth/logout`, and `/auth/callback`, so UI links should target those paths instead of the legacy `/api/auth/*` endpoints.

Restart `npm run dev` whenever env vars change so the SDK can reload them.

## Development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` for the public workflow overview and `http://localhost:3000/login` for the Auth0-powered entry point.

Authenticated users can now navigate to `/workspace` for the policy operations cockpit or `/workspace/onboarding` to capture company, policy, and notification preferences. The onboarding wizard persists data via `/api/onboarding`, so every re-login pulls the same configuration back into your dashboard.

## Next steps

- Gate additional routes (dashboards, policy library) with `withPageAuthRequired`.
- Add ingestion connectors (EUR-Lex API, EC RSS, sector webhooks) and persistence.
- Introduce task orchestration plus notification transports (Slack/Teams/email).
- Expand audit/reporting exports and feedback-driven ranking for recommendations.

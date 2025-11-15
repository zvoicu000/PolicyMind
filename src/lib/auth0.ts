import { Auth0Client } from "@auth0/nextjs-auth0/server";

const issuerAsDomain = process.env.AUTH0_ISSUER_BASE_URL?.replace(
	/^https?:\/\//,
	""
);

export const auth0 = new Auth0Client({
	domain: process.env.AUTH0_DOMAIN ?? issuerAsDomain,
	appBaseUrl: process.env.APP_BASE_URL ?? process.env.AUTH0_BASE_URL,
});

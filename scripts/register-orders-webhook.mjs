// Registers (or verifies) the Shopify `orders/paid` webhook that drives
// Meta CAPI Purchase tracking in src/app/api/webhooks/orders/route.ts.
//
// Webhooks registered this way are signed with the app's client secret, which
// the route already falls back to — so you do NOT need to set
// SHOPIFY_WEBHOOK_SECRET when you register through this script.
//
// Usage (from the valorem/ folder):
//   node scripts/register-orders-webhook.mjs                       # uses default prod URL
//   node scripts/register-orders-webhook.mjs https://your-tunnel/api/webhooks/orders
//
// Reads credentials from .env.local (SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID,
// SHOPIFY_CLIENT_SECRET). Requires the app to have the write_webhooks scope.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const API_VERSION = "2025-07";
const TOPIC = "ORDERS_PAID";
// Canonical live domain (houseofvalorem.com 308-redirects here, and Shopify
// webhook delivery does not reliably follow redirects — always use the final
// URL). Pass a different URL as argv[2] if this changes.
const DEFAULT_URL = "https://www.valoremfragrances.com/api/webhooks/orders";

const here = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const path = join(here, "..", ".env.local");
  const env = {};
  let raw = "";
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return env;
  }
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

async function getAdminToken(domain, clientId, clientSecret) {
  const res = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()).access_token;
}

async function adminGraphql(domain, token, query, variables) {
  const res = await fetch(
    `https://${domain}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    },
  );
  const json = await res.json();
  if (!res.ok || json.errors) {
    throw new Error(`Admin API error: ${JSON.stringify(json.errors ?? json)}`);
  }
  return json.data;
}

async function main() {
  const env = { ...loadEnv(), ...process.env };
  const domain = env.SHOPIFY_STORE_DOMAIN;
  const clientId = env.SHOPIFY_CLIENT_ID;
  const clientSecret = env.SHOPIFY_CLIENT_SECRET;
  const callbackUrl = process.argv[2] || env.WEBHOOK_CALLBACK_URL || DEFAULT_URL;

  if (!domain || !clientId || !clientSecret) {
    console.error(
      "Missing SHOPIFY_STORE_DOMAIN / SHOPIFY_CLIENT_ID / SHOPIFY_CLIENT_SECRET.",
    );
    process.exit(1);
  }

  console.log(`Store:    ${domain}`);
  console.log(`Topic:    ${TOPIC}`);
  console.log(`Callback: ${callbackUrl}\n`);

  const token = await getAdminToken(domain, clientId, clientSecret);

  const existing = await adminGraphql(
    domain,
    token,
    `query {
      webhookSubscriptions(first: 50, topics: ${TOPIC}) {
        edges { node { id endpoint { __typename ... on WebhookHttpEndpoint { callbackUrl } } } }
      }
    }`,
    {},
  );

  const match = existing.webhookSubscriptions.edges.find(
    (e) => e.node.endpoint?.callbackUrl === callbackUrl,
  );
  if (match) {
    console.log(`Already registered: ${match.node.id}  ✓`);
    return;
  }

  const created = await adminGraphql(
    domain,
    token,
    `mutation Create($topic: WebhookSubscriptionTopic!, $sub: WebhookSubscriptionInput!) {
      webhookSubscriptionCreate(topic: $topic, webhookSubscription: $sub) {
        webhookSubscription { id }
        userErrors { field message }
      }
    }`,
    { topic: TOPIC, sub: { callbackUrl, format: "JSON" } },
  );

  const { webhookSubscription, userErrors } =
    created.webhookSubscriptionCreate;
  if (userErrors.length) {
    console.error("Failed:", JSON.stringify(userErrors, null, 2));
    process.exit(1);
  }
  console.log(`Registered: ${webhookSubscription.id}  ✓`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

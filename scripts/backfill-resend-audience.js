// One-off migration: add every existing Supabase subscriber to a Resend Audience.
// Run this once after creating the Audience in Resend and setting RESEND_AUDIENCE_ID
// in Cloudflare Pages. New signups from that point on are added automatically by
// functions/api/signup.js — this script only backfills people who signed up before
// the Audience existed.
//
// Usage (values come from the same Cloudflare Pages environment variables used by
// functions/api/signup.js — copy them from the Pages dashboard for this one run):
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... RESEND_API_KEY=... RESEND_AUDIENCE_ID=... \
//     node scripts/backfill-resend-audience.js

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY', 'RESEND_AUDIENCE_ID'];
const missing = required.filter(key => !process.env[key]);
if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, RESEND_AUDIENCE_ID } = process.env;

async function fetchAllSubscribers() {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/subscribers?select=email&confirmed=eq.true`;
  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Range: '0-9999',
    },
  });
  if (!response.ok) {
    throw new Error(`Supabase fetch failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function addToAudience(email) {
  const response = await fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ email, unsubscribed: false }),
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${await response.text()}`);
  }
}

(async () => {
  const subscribers = await fetchAllSubscribers();
  console.log(`Found ${subscribers.length} subscriber(s). Adding to Resend audience ${RESEND_AUDIENCE_ID}...`);
  let ok = 0;
  let failed = 0;
  for (const { email } of subscribers) {
    try {
      await addToAudience(email);
      ok++;
    } catch (err) {
      failed++;
      console.error(`Failed for ${email}:`, err.message);
    }
    await new Promise(resolve => setTimeout(resolve, 250)); // stay well under Resend's rate limit
  }
  console.log(`Done. ${ok} added, ${failed} failed.`);
})();

# TipJar.live – Google Search Console (Domain Property)

This guide is for getting **tipjar.live** listed in Google using the **domain property** in Search Console (e.g. `sc-domain:tipjar.live`).

---

## Important: Domain property = DNS verification only

Your property type is **Domain** (covers `tipjar.live` and all subdomains, e.g. `www.tipjar.live`).

- **Domain property** → verification is **only** via a **DNS TXT record**.  
  HTML file and meta tag do **not** work for domain properties.
- **URL-prefix property** (e.g. `https://www.tipjar.live`) → can use HTML tag or DNS.  
  The TipJar app already outputs a `google-site-verification` meta tag for URL-prefix use.

---

## Step 1: Verify ownership (DNS)

1. Open [Google Search Console](https://search.google.com/search-console).
2. Select the **domain** property for **tipjar.live** (or add it: “Add property” → “Domain” → `tipjar.live`).
3. In the verification screen, choose **“DNS record”**.
4. Copy the **TXT record** Google shows (e.g. `google-site-verification=XXXXXXXXXXXXXXXX`).
5. In your DNS provider (e.g. Vercel, Cloudflare, Namecheap):
   - Add a **TXT** record:
     - **Host / Name:** `@` or `tipjar.live` (or as your provider requires for the apex domain).
     - **Value:** the full string from Google (e.g. `google-site-verification=...`).
   - Save.
6. Wait for DNS to propagate (often 5–30 minutes; can be up to 48 hours).
7. Back in Search Console, click **“Verify”**.

---

## Step 2: Submit the sitemap

1. In Search Console, go to **Sitemaps** (left sidebar).
2. Under “Add a new sitemap”, enter:  
   `sitemap.xml`  
   (full URL will be `https://www.tipjar.live/sitemap.xml`).
3. Click **Submit**.
4. Wait for status to show “Success” (can take a few minutes to a few hours).

The app serves a **domain-aware** sitemap: when requested from `tipjar.live` or `www.tipjar.live`, it returns only TipJar URLs (homepage, support, features, pricing, how-it-works, signup, signin, embed).

---

## Step 3: Request indexing for key URLs (optional)

1. In Search Console, open **URL Inspection** (search bar at top or left).
2. Enter a URL, e.g.:
   - `https://www.tipjar.live`
   - `https://www.tipjar.live/tipjar/support`
   - `https://www.tipjar.live/features`
3. Click **“Test live URL”** (wait for “URL is on Google” or “URL is not on Google”).
4. If eligible, click **“Request indexing”**.

Repeat for other important pages. Indexing can take from a few days to a few weeks.

---

## What’s already in place (codebase)

- **Sitemap:** `app/sitemap.ts` returns TipJar-specific URLs when `Host` is `tipjar.live` or `www.tipjar.live`.  
  No middleware rewrite: requests to `/sitemap.xml` on tipjar.live hit this handler.
- **Robots:** `app/robots.ts` returns domain-appropriate rules and points to `https://www.tipjar.live/sitemap.xml` on TipJar.
- **Meta tag:** TipJar layout (`app/(marketing)/tipjar/layout.tsx`) includes `verification.google` for **URL-prefix** property verification only. Domain property still requires DNS.

---

## Checklist

- [ ] Add DNS TXT record for `tipjar.live` with the value from Search Console.
- [ ] Click “Verify” in Search Console (domain property).
- [ ] Submit sitemap: `sitemap.xml` (for `https://www.tipjar.live/sitemap.xml`).
- [ ] (Optional) Use URL Inspection + “Request indexing” for homepage and key pages (e.g. `/`, `/tipjar/support`, `/features`).

---

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| Verification fails | TXT record exact value; DNS propagation (dig/host/nslookup for `tipjar.live` TXT). |
| Sitemap “Couldn’t fetch” | Ensure `https://www.tipjar.live/sitemap.xml` opens in a browser and returns XML. |
| URLs not indexed | Use URL Inspection; fix any crawl errors; wait 1–2+ weeks after sitemap submit. |

For more detail on support page SEO and sitemap entries, see `GOOGLE_SEARCH_CONSOLE_QUICK_START.md` and `GOOGLE_SEARCH_CONSOLE_SETUP_GUIDE.md`.

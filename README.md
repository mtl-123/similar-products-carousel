# Northstar Commerce

Custom bilingual commerce MVP for a US-focused independent store. The application includes a public storefront, product and order operations, creator attribution and commission reporting, plus a unified email/Chatwoot support inbox.

## Run locally

```powershell
npm install
npm run db:migrate:local
npm run dev:local
```

Open `http://127.0.0.1:9400`.

Local development uses Cloudflare D1 and KV emulation under `.wrangler/`. The migration creates sample products, orders, a creator account and support conversations.

## Demo accounts

| Workspace | Email | Password |
| --- | --- | --- |
| Operations | `admin@northstar.demo` | `northstar-admin` |
| Creator | `maya@northstar.demo` | `creator-demo` |
| Support | `support@northstar.demo` | `support-demo` |

## Implemented workflows

- English and Simplified Chinese storefront content
- Product catalog, categories, inventory and bilingual product creation
- Cloudflare KV image uploads, multi-image galleries, product attributes and featured merchandising
- Admin-configured similar-product recommendations with responsive storefront carousels
- Persistent cart and server-verified checkout totals
- Stripe, PayPal, Apple Pay and ACH provider slots with sandbox status
- Orders and fulfillment status management
- Backend-configured creator attribution window, click tracking, conversion tracking and commission records
- Creator clicks, revenue, pending/available/paid earnings dashboard
- Admin payout action
- Web support form and unified email/Chatwoot inbox
- Inbound webhooks at `/api/email/inbound` and `/api/chatwoot/webhook`
- Role-based signed local sessions

## Cloudflare deployment

The production runtime is OpenNext on Cloudflare Workers, with D1 for commerce data and KV for product images.

```powershell
npx wrangler login
npx wrangler d1 create northstar-commerce --location enam
npx wrangler kv namespace create northstar-product-uploads
npm run db:migrate:remote
npx wrangler secret put SESSION_SECRET
npx wrangler secret put INBOUND_WEBHOOK_TOKEN
npm run deploy
```

After creating D1, place its database ID in `wrangler.jsonc`. Keep `cloudflare-env.d.ts` aligned whenever bindings change.

Stripe, PayPal, Apple Pay, ACH, outbound email and Chatwoot are currently merchant integration slots and demo workflows. Before accepting real payments or sending messages, configure the provider credentials and implement provider-specific checkout, webhook verification and delivery handling.

## Verification

```powershell
npm run check
npm run test:e2e
npm run preview
```

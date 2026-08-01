# Northstar Commerce

Custom bilingual commerce MVP for a US-focused independent store. The application includes a public storefront, product and order operations, creator attribution and commission reporting, plus a unified email/Chatwoot support inbox.

## Run locally

```powershell
npm install
npm run dev:local
```

Open `http://127.0.0.1:9400`.

The SQLite database is created automatically in `.data/northstar.db` with sample products, orders, a creator account and support conversations.

## Demo accounts

| Workspace | Email | Password |
| --- | --- | --- |
| Operations | `admin@northstar.demo` | `northstar-admin` |
| Creator | `maya@northstar.demo` | `creator-demo` |
| Support | `support@northstar.demo` | `support-demo` |

## Implemented workflows

- English and Simplified Chinese storefront content
- Product catalog, categories, inventory and bilingual product creation
- Local image uploads, multi-image galleries, product attributes and featured merchandising
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

## Production integrations

Copy `.env.example` to `.env.local` and provide production secrets. The current payment and outbound messaging handoffs remain in demo mode until provider credentials and merchant-specific redirect/webhook behavior are configured. Product files are stored in `public/uploads` for local use; production deployments should move uploads to S3, R2 or equivalent object storage. Use PostgreSQL or MySQL instead of SQLite for multi-instance production deployments.

## Verification

```powershell
npm run check
```

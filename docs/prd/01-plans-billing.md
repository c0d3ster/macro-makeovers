# PRD 01: Plans and billing

**Plan:** Free. This PRD builds the gate every Fit and Studio feature uses.

**Status:** Phase 1 built, launch steps open. Phases 2 and 3 not started.

| Phase | What | Status |
| --- | --- | --- |
| 1 | Accounts and the Fit subscription | Built, migrations applied (Nov 24). Open: Stripe setup and `STRIPE_*` in Vercel, Resend auth emails, delete the public `recipe-book` release |
| 2 | Studio plan level | Not started. Build with PRD 04 phase 1 |
| 3 | Partner entitlement (ForgeFit) | Later |

## Problem

Anyone can create a free account today, with Google or email. There is no way to pay, so there is no revenue.

## Goal

Visitors can sign up free, subscribe to Fit ($5 a month) and later Studio ($20 a month), and get that plan's features (see the plan table in the README). The owner can see who is subscribed to what.

## Phase 1: Accounts and the Fit subscription

**Status:** Built, and migrations are applied on the hosted database (Nov 24). Open before launch: set up the product, price, and webhook in Stripe and add the `STRIPE_*` values in Vercel, send auth emails through Resend, and delete the public `recipe-book` release.

### Scope

**In**

- Public sign-up with Google, or email and password with a confirmation link. Done.
- Fit as a Stripe subscription, monthly. Price set by config (the Stripe price id), not code. Studio is added as a second Stripe price when PRD 04 starts.
- Stripe Checkout for purchase and the Stripe Customer Portal for cancel, card change, and invoices.
- Webhook-driven subscription state in our database.
- A single `hasPaidAccess` check (Fit or higher) used by every Fit feature: personal targets (PRD 03 phase 1), the meal planner (PRD 03 phase 3), "Send to cart" (PRD 02 phase 4), and the book. Studio features use a plan-level check on top (PRD 04).
- Book download moved behind that check.
- Account page shows plan status and a manage billing link.

**Out**

- Annual plans, coupons, trials, teams, hard copy orders. Leave room for them, build none.
- The ForgeFit partner integration itself. Its seams are phase 3.

### Requirements

1. Hosted Supabase sign-ups are on, and new users get role `client`. Done. Auth emails come from Supabase's built-in sender until they move to Resend SMTP from hello@macromakeovers.com.
2. `subscriptions` table keyed by user: Stripe customer id, subscription id, status, current period end, cancel at period end.
3. Stripe webhooks (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`) update the table. Handlers are idempotent and verify the signature.
4. `hasPaidAccess` is true for status `active` or `trialing`, and for `past_due` inside a short grace window, on any plan. Owners always have access.
5. Paid resolvers return a typed "subscription required" error. The UI turns that into an upgrade prompt, not a crash.
6. The `recipes.access` column stays. All recipes are `free` for now, so no recipe is gated. Early access to new recipes for members was considered and is excluded for now.
7. Book download:
   - The repo is public, so the rolling `recipe-book` release is downloadable by anyone today. Stop linking it.
   - Host the PDF in the private R2 bucket (or a private release) and serve it through a signed, short-lived URL from a GraphQL mutation that checks `hasPaidAccess`.
   - Remove or privatize the public release asset before launch.
8. The pricing page shows Free, Fit, and Studio from the README plan table, lists exactly what each includes, and says plainly that every book recipe, the goal presets, the basket, favorites, and reviews stay free. Studio shows "Coming soon" until PRD 04 ships.
9. Emails (Resend, already installed): welcome, payment failed, cancellation confirmation.

### Data

`subscriptions(user_id, stripe_customer_id, stripe_subscription_id, status, current_period_end, cancel_at_period_end, created_at, updated_at)`. RLS: a user reads only their own row. Writes come from the webhook through the server connection.

### Tasks

1. Sign-up and the account page are live. Remaining: send auth emails through Resend from hello@macromakeovers.com.
2. `subscriptions` migration and model. Built.
3. Stripe products, Checkout, Portal, webhook route, idempotency. Built; the product, price, and
   webhook endpoint get set up in the Stripe dashboard (see `docs/deployment.md`). The pricing page
   reads the amount from the Stripe price.
4. `hasPaidAccess` and the typed error across resolvers. Built: paid resolvers call
   `requirePaidAccess(ctx, feature)` from `src/libs/billing`, which throws `SUBSCRIPTION_REQUIRED`.
   Paid tables use `public.has_paid_access()` in their RLS policies.
5. Move the book to private storage and gate the download. Built: the book workflow uploads to the
   private R2 bucket, and `bookDownloadUrl` signs a five-minute link. Delete the public
   `recipe-book` release before launch.
6. Pricing page, upgrade prompts, emails. Built. The meal planner and Send to cart show "Coming
   soon" on `/pricing` until PRD 03 phase 3 and PRD 02 phase 4 ship (`src/components/molecules/billing/planFeatures.ts`).
7. Tests: webhook handling, access states, gating on each paid resolver. Built.

## Phase 2: Studio plan level

**Status:** Not started. Build it as the first step of PRD 04, not before.

### Requirements

1. Add `plan` (`fit` or `studio`) to `subscriptions`, set from the Stripe price on the webhook.
2. `hasPaidAccess` stays true on either plan. `hasPlan(ctx, 'studio')` gates Studio features, in resolvers and RLS.
3. Upgrades and downgrades go through the Customer Portal and update the row through the same webhooks.
4. Studio is a second Stripe price, set by config. `/pricing` shows it as "Coming soon" until PRD 04 ships.

### Tasks

1. `subscriptions.plan` migration and model.
2. Studio price in Stripe and the webhook mapping from price to plan.
3. `hasPlan` and the typed error, with tests for each plan and status.

## Phase 3: Partner entitlement

**Status:** Later. Needs its own spec once ForgeFit has a stable API. Only these seams matter now.

ForgeFit will sell a higher tier that includes Macro Makeovers, and ForgeFit's business pays this one per user. Those members get paid access without a Stripe subscription here. Keep this possible:

- `hasPaidAccess` reads an entitlement source, not Stripe alone. Add `source` to `subscriptions` (`stripe` now, `partner` later) so a partner grant is a row, not a special case. A grant carries a `plan` like any subscription (Fit unless the contract says Studio).
- A partner member must never see our checkout or billing portal. Billing belongs to ForgeFit.
- Partner access can end (they downgrade or the contract ends), so grants carry a status and period end like any subscription.
- Per-user billing to the partner needs a usage record (active partner members per month). Decide that when the integration is specced.

## Success metrics

- Sign-up to checkout start rate.
- Checkout start to paid conversion.
- Monthly churn.
- Paid users with a webhook state mismatch: zero.

## Risks and open questions

- Price point: decided. Fit is 5 dollars a month, Studio 20 dollars a month. Revisit once there is conversion data.
- Tax handling: decided, Stripe Tax is deferred. Revisit before volume makes it a compliance issue.
- Account deletion and data export expectations once users exist.
- Bot sign-ups. Add rate limits or a captcha if abuse shows up.

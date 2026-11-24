# PRD 01: Accounts and plans

## Problem

Anyone can create a free account today, with Google or email. There is no way to pay, so there is no revenue.

## Goal

Visitors can sign up free, subscribe to Fit ($5 a month) and later Studio ($20 a month), and get that plan's features (see the plan table in the README). The owner can see who is subscribed to what.

## Scope

**In**

- Public sign-up with Google, or email and password with a confirmation link. Done.
- Fit as a Stripe subscription, monthly. Price set by config, not code. Studio is added as a second Stripe price when PRD 10 starts.
- Stripe Checkout for purchase and the Stripe Customer Portal for cancel, card change, and invoices.
- Webhook-driven subscription state in our database.
- A single `hasPaidAccess` check (Fit or higher) used by every Fit feature: personal targets (PRD 02), the meal planner (PRD 04), "Send to cart" (PRD 05), and the book. Studio features use a plan-level check on top (PRD 10).
- Book download moved behind that check.
- Account page shows plan status and a manage billing link.

**Out**

- Annual plans, coupons, trials, teams, hard copy orders. Leave room for them, build none.
- Studio itself (PRD 10). Only the `plan` column and the plan-level check below are in scope here.
- The ForgeFit partner integration itself. Only the seams below are in scope now.

**Planned, not built: partner entitlement.** ForgeFit will sell a higher tier that includes MacroMakeovers, and ForgeFit's business pays this one per user. Those members get paid access without a Stripe subscription here. Keep this possible:

- `hasPaidAccess` reads an entitlement source, not Stripe alone. Add `source` to `subscriptions` (`stripe` now, `partner` later) so a partner grant is a row, not a special case. A grant carries a `plan` like any subscription (Fit unless the contract says Studio).
- A partner member must never see our checkout or billing portal. Billing belongs to ForgeFit.
- Partner access can end (they downgrade or the contract ends), so grants carry a status and period end like any subscription.
- Per-user billing to the partner needs a usage record (active partner members per month). Decide that when the integration PRD is written.

## Requirements

1. Hosted Supabase sign-ups are on, and new users get role `client`. Done. Auth emails come from Supabase's built-in sender until they move to Resend SMTP from hello@macromakeovers.com.
2. `subscriptions` table keyed by user: Stripe customer id, subscription id, status, current period end, cancel at period end.
3. Stripe webhooks (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`) update the table. Handlers are idempotent and verify the signature.
4. `hasPaidAccess` is true for status `active` or `trialing`, and for `past_due` inside a short grace window, on any plan. Owners always have access.
4a. `subscriptions.plan` is `fit` or `studio`, set from the Stripe price on the webhook. `hasPlan(ctx, 'studio')` gates Studio features. Upgrades and downgrades go through the Customer Portal and update the row through the same webhooks.
5. Paid resolvers return a typed "subscription required" error. The UI turns that into an upgrade prompt, not a crash.
6. The `recipes.access` column stays. All recipes are `free` for now, so no recipe is gated. Early access to new recipes for members was considered and is excluded for now.
7. Book download:
   - The repo is public, so the rolling `recipe-book` release is downloadable by anyone today. Stop linking it.
   - Host the PDF in the private R2 bucket (or a private release) and serve it through a signed, short-lived URL from a GraphQL mutation that checks `hasPaidAccess`.
   - Remove or privatize the public release asset before launch.
8. The pricing page shows Free, Fit, and Studio from the README plan table, lists exactly what each includes, and says plainly that every book recipe, the goal presets, the basket, favorites, and reviews stay free. Studio shows "Coming soon" until PRD 10 ships.
9. Emails (Resend, already installed): welcome, payment failed, cancellation confirmation.

## Data

`subscriptions(user_id, stripe_customer_id, stripe_subscription_id, status, plan, current_period_end, cancel_at_period_end, created_at, updated_at)`. RLS: a user reads only their own row. Writes come from the webhook through the server connection.

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

## Tasks

1. Sign-up and the account page are live. Remaining: send auth emails through Resend from hello@macromakeovers.com.
2. `subscriptions` migration and model. Built.
3. Stripe products, Checkout, Portal, webhook route, idempotency. Built; the product, price, and
   webhook endpoint are set up in the Stripe dashboard (see `docs/deployment.md`).
4. `hasPaidAccess` and the typed error across resolvers. Built: paid resolvers call
   `requirePaidAccess(ctx, feature)` from `src/libs/billing`, which throws `SUBSCRIPTION_REQUIRED`.
   Paid tables use `public.has_paid_access()` in their RLS policies.
5. Move the book to private storage and gate the download. Built: the book workflow uploads to the
   private R2 bucket, and `bookDownloadUrl` signs a five-minute link. Delete the public
   `recipe-book` release before launch.
6. Pricing page, upgrade prompts, emails. Built. The meal planner and Send to cart show "Coming
   soon" on `/pricing` until PRD 04 and PRD 05 ship (`src/components/molecules/billing/planFeatures.ts`).
7. Tests: webhook handling, access states, gating on each paid resolver. Built.

# PRD 01: Accounts and subscription

## Problem

Only the owner can sign in today. There is no way for a visitor to create an account or pay, so there is no revenue.

## Goal

Visitors can sign up free, subscribe to one paid plan, and get the paid features. The owner can see who is subscribed.

## Scope

**In**

- Public sign-up with Google and email magic link (Google is already wired).
- One Stripe subscription plan, monthly. Price set by config, not code.
- Stripe Checkout for purchase and the Stripe Customer Portal for cancel, card change, and invoices.
- Webhook-driven subscription state in our database.
- A single `hasPaidAccess` check used by every paid feature (planner, ordering, book).
- Book download moved behind that check.
- Account page shows plan status and a manage billing link.

**Out**

- Annual plan, coupons, trials, teams, a second tier, hard copy orders. Leave room for them, build none.
- The ForgeFit partner integration itself. Only the seams below are in scope now.

**Planned, not built: partner entitlement.** ForgeFit will sell a higher tier that includes MacroMakeovers, and ForgeFit's business pays this one per user. Those members get paid access without a Stripe subscription here. Keep this possible:

- `hasPaidAccess` reads an entitlement source, not Stripe alone. Add `source` to `subscriptions` (`stripe` now, `partner` later) so a partner grant is a row, not a special case.
- A partner member must never see our checkout or billing portal. Billing belongs to ForgeFit.
- Partner access can end (they downgrade or the contract ends), so grants carry a status and period end like any subscription.
- Per-user billing to the partner needs a usage record (active partner members per month). Decide that when the integration PRD is written.

## Requirements

1. Hosted Supabase sign-ups are on. Existing owner roles are unchanged. New users get role `client`.
2. `subscriptions` table keyed by user: Stripe customer id, subscription id, status, current period end, cancel at period end.
3. Stripe webhooks (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`) update the table. Handlers are idempotent and verify the signature.
4. `hasPaidAccess` is true for status `active` or `trialing`, and for `past_due` inside a short grace window. Owners always have access.
5. Paid resolvers return a typed "subscription required" error. The UI turns that into an upgrade prompt, not a crash.
6. The `recipes.access` column stays. All recipes are `free` for now, so no recipe is gated.
7. Book download:
   - The repo is public, so the rolling `recipe-book` release is downloadable by anyone today. Stop linking it.
   - Host the PDF in the private R2 bucket (or a private release) and serve it through a signed, short-lived URL from a GraphQL mutation that checks `hasPaidAccess`.
   - Remove or privatize the public release asset before launch.
8. Pricing page and upgrade prompts list exactly what paid includes.
9. Emails (Resend, already installed): welcome, payment failed, cancellation confirmation.

## Data

`subscriptions(user_id, stripe_customer_id, stripe_subscription_id, status, current_period_end, cancel_at_period_end, created_at, updated_at)`. RLS: a user reads only their own row. Writes come from the webhook through the server connection.

## Success metrics

- Sign-up to checkout start rate.
- Checkout start to paid conversion.
- Monthly churn.
- Paid users with a webhook state mismatch: zero.

## Risks and open questions

- Price point: decided, 5 dollars a month to start. Revisit once there is conversion data.
- Tax handling: decided, Stripe Tax is deferred. Revisit before volume makes it a compliance issue.
- Account deletion and data export expectations once users exist.
- Bot sign-ups. Add rate limits or a captcha if abuse shows up.

## Tasks

1. Open sign-ups on hosted Supabase, sign-up UI, account page.
2. `subscriptions` migration and model.
3. Stripe products, Checkout, Portal, webhook route, idempotency.
4. `hasPaidAccess` and the typed error across resolvers.
5. Move the book to private storage and gate the download.
6. Pricing page, upgrade prompts, emails.
7. Tests: webhook handling, access states, gating on each paid resolver.

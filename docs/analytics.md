# Analytics and the email list

Launch gate 5 in [PRD 05 phase 1](prd/05-launch-growth.md): measure the funnel before spending on ads.

## Where to look

Vercel dashboard, project `macro-makeovers`, **Analytics** tab.

- **Visitors and page views** are automatic (`<Analytics />` in `src/app/layout.tsx`).
- **Events** panel, at the bottom of the Analytics tab, lists the custom events below. Click an
  event to break it down by property, such as `recipe_view` by `slug` or `sign_up` by `source`.
- The **Referrers** panel (and **UTM Parameters**, where the plan includes it) compares
  channels for visits. Sign-ups by channel come from the `users` table, below.
- Custom events need a Pro or Enterprise plan. On Hobby they are not recorded.
- In local development events are logged to the browser console, not sent.

## Events

All names live in `src/libs/analytics/funnelEvents.ts`. Send them with the typed helpers:

```ts
import { track } from '@/libs/analytics' // browser
import { trackServer } from '@/libs/analytics/trackServer' // route handler, webhook

track('recipe_view', { slug })
await trackServer('subscription_active', { plan: 'monthly' }, { request })
```

`trackServer` stays out of the barrel so client bundles never load the server SDK.

### Funnel (PRD 05 phase 1)

| Event | Properties | Sent from |
| --- | --- | --- |
| `visit` | `source`, `medium`, `campaign`, `path` | `VisitTracker` in the root layout, once per browser session |
| `recipe_view` | `slug` | Recipe page (`TrackEvent`) |
| `sign_up` | `method` (`email` or `google`), `source`, `medium`, `campaign` | `AuthForm` for email, `/auth/callback` for Google |
| `profile_completed` | none | Not wired yet: the profile has no editable details until PRD 03 phase 1 |
| `plan_created` | `recipes` | Not wired yet: the meal planner (PRD 03 phase 3) |
| `upgrade_prompt_seen` | `feature` | "Send to cart" on the basket (`send_to_cart`). Add one wherever a paid gate shows. |
| `checkout_started` | `plan` | Not wired yet: Stripe checkout (`feat/stripe-subscription`) |
| `subscription_active` | `plan` | Not wired yet: Stripe webhook, `customer.subscription.created` or `checkout.session.completed` |
| `subscription_canceled` | `plan` | Not wired yet: Stripe webhook, `customer.subscription.deleted` |

Stripe events should be sent server-side from the webhook with `trackServer`, since the
browser may close before a redirect lands.

### Actions

| Event | Properties | Sent from |
| --- | --- | --- |
| `basket_add` | `slug`, `build`, `placement` (`recipe_page` or `card`) | `AddToBasketButton` |
| `basket_remove` | `slug`, `placement` | `AddToBasketButton` |
| `bundle_add` | `slugs` (comma-joined) | `AddBundleButton` on the home page |
| `email_subscribe` | `path` | `EmailSignup` form |
| `email_confirmed` | none | `/subscribe/confirm` page |

## Traffic source

`VisitTracker` reads UTM tags (or, without them, an outside referrer) and keeps them in the
`mm_traffic_source` cookie for 30 days. A new tagged link or referrer replaces it; a direct visit
keeps it, so a sign-up a few visits later still credits the channel.

At sign-up the source is stored on `users` (`signup_source`, `signup_medium`,
`signup_campaign`, `signup_referrer`, `signup_landing_path`):

- Email sign-ups pass it as user metadata, and `handle_new_user` copies it onto the row.
- Google sign-ups have no metadata, so `/auth/callback` fills the row from the cookie.

Tag every link you post, for example
`https://macromakeovers.com/recipes/smash-burgers?utm_source=reddit&utm_medium=social&utm_campaign=launch`.
Conversion by channel:

```sql
select signup_source, signup_medium, count(*) from public.users
where signup_source is not null group by 1, 2 order by 3 desc;
```

## Email list

- Form: `EmailSignup` on every recipe page and the home page. Writes go through the
  `subscribeToEmails` GraphQL mutation.
- Double opt-in: a new address is `pending` and gets a confirmation link
  (`/subscribe/confirm?token=`). Confirming sends the welcome email from
  `hello@macromakeovers.com` through Resend.
- Every list email carries an unsubscribe link (`/unsubscribe?token=`) and a
  `List-Unsubscribe` header.
- Both links act in the browser, not on the GET, so mail scanners that prefetch links cannot
  confirm or unsubscribe anyone.
- The answer to the form is the same whether or not an address is on the list. A pending
  address gets at most one confirmation every 5 minutes, and a hidden honeypot field catches
  simple bots.
- `public.email_subscribers` has RLS on and no policies, so only the server reads it. Confirmed
  subscribers for the weekly send:

```sql
select email, token from public.email_subscribers where status = 'confirmed';
```

Build each weekly email's unsubscribe link from the row's token.

# PRD 07: Launch and advertising

## Problem

The site has recipes but no audience and no paying users. Features alone will not change that.

## Goal

Reach the first paying members with a message that is honest and specific, and learn which channel is worth more spend.

## Positioning

Macro-friendly versions of foods people already love, with the macros shown, protein included, so people can eat well without giving up favorites. The "makeover vs traditional" comparison is the hook. The paid plan is the planner, the grocery list and ordering, and the book.

## Launch gates (do not advertise before these)

1. PRD 01 shipped: sign-up, subscription, gated book.
2. At least one paid feature live, either the planner or the grocery list.
3. At least 25 published recipes.
4. Nutrition disclaimer, privacy policy, terms, and refund policy pages.
5. Analytics events for the funnel below.
6. Search basics: sitemap, OG images, structured data, 404 pages. Much of this exists.

## Pricing and offer

- One plan at 5 dollars a month to start. Stripe Tax is deferred.
- Free tier is generous on purpose, since recipes drive traffic and sharing.
- Consider a founding-member price for early subscribers, honored as long as they stay subscribed.

## Channels to test

| Channel                  | Why                                   | First test                                  |
| ------------------------ | ------------------------------------- | ------------------------------------------- |
| Short video (Reels, TikTok, Shorts) | Food and macro content spreads | 2 to 3 makeover clips per week, link in bio |
| Reddit and fitness communities | Macro-focused audience             | Value-first posts, follow each community's rules |
| Pinterest                | Recipe search intent, long lifespan   | Pin each recipe photo with the macros       |
| Email list               | Owned audience                        | Sign-up form on every recipe page and a weekly recipe |
| Search                   | Free over time                        | Recipe pages already have metadata          |
| Paid ads                 | Only after conversion is known        | Small budget on the best organic content    |

Do not spend on ads until organic conversion from visit to sign-up to paid is measured.

## Funnel and events

Visit, recipe view, sign-up, profile completed, plan created, upgrade prompt seen, checkout started, subscription active, subscription canceled. Use Vercel Analytics custom events or add a product analytics tool. Record the traffic source on sign-up.

## Success metrics

- Weekly visitors and sign-ups.
- Visit to sign-up and sign-up to paid conversion.
- Cost per paid member by channel.
- Monthly recurring revenue and churn.
- Break-even point: paid members needed to cover hosting, Supabase, OpenAI images, and Stripe fees. Compute this before spending on ads.

## Risks and open questions

- Health claims in ads. Stay with "macro-friendly" and avoid outcome promises.
- Photos are AI-generated placeholders. Decide whether to replace them with real photos before heavy promotion, since food ads depend on them. Disclose AI images where required.
- Time budget. One person cannot run every channel. Pick two to start.
- Does the owner have an existing audience to seed the launch?

## Tasks

1. Legal pages and disclaimer.
2. Email capture and a welcome email.
3. Funnel events and a simple dashboard.
4. Break-even model.
5. Content calendar for the first four weeks and two channel tests.
6. Founding-member offer, if chosen.

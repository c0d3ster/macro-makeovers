# PRD 05: Launch and growth

**Plan:** Free. This PRD gets paying Fit members and gives them reasons to come back.

**Status:** Phase 1 in progress. Phase 2 not started. Phase 3 later.

| Phase | What | Status |
| --- | --- | --- |
| 1 | Launch and advertising | In progress. Email capture and most funnel events are built ([docs/analytics.md](../analytics.md)) |
| 2 | Favorites | Not started |
| 3 | Reviews | Later, once there is traffic |

## Problem

The site has recipes but no audience and no paying users. Features alone will not change that.

Visitors cannot tell which recipes actually work for other people, and members have no way to keep the recipes they like in one place. Recipe sites also gain search traffic and trust from ratings.

## Goal

Reach the first paying members with a message that is honest and specific, and learn which channel is worth more spend.

## Phase 1: Launch and advertising

**Status:** In progress.

### Positioning

Macro-friendly versions of foods people already love, with the macros shown, protein included, so people can eat well without giving up favorites. The "makeover vs traditional" comparison is the hook. The basket is free and shows what bundling recipes saves. Fit, the $5 plan, is targets built for your body, the planner, ordering ("Send to cart"), and the book. Studio ($20) comes later and is not part of launch.

### Launch gates (do not advertise before these)

1. PRD 01 phase 1 shipped: sign-up, subscription, gated book.
2. The free basket (PRD 02 phase 1) live, plus at least one Fit feature beyond the book: personal targets, the planner, or ordering.
3. At least 25 published recipes.
4. Nutrition disclaimer, privacy policy, terms, and refund policy pages.
5. Analytics events for the funnel below.
6. Search basics: sitemap, OG images, structured data, 404 pages. Much of this exists.

### Pricing and offer

- Fit at 5 dollars a month to start. Studio at 20 dollars a month once PRD 04 ships. Stripe Tax is deferred.
- Free tier is generous on purpose, since recipes drive traffic and sharing.
- Consider a founding-member price for early subscribers, honored as long as they stay subscribed.

### Channels to test

| Channel                  | Why                                   | First test                                  |
| ------------------------ | ------------------------------------- | ------------------------------------------- |
| Short video (Reels, TikTok, Shorts) | Food and macro content spreads | 2 to 3 makeover clips per week, link in bio |
| Reddit and fitness communities | Macro-focused audience             | Value-first posts, follow each community's rules |
| Pinterest                | Recipe search intent, long lifespan   | Pin each recipe photo with the macros       |
| Email list               | Owned audience                        | Sign-up form on every recipe page and a weekly recipe |
| Search                   | Free over time                        | Recipe pages already have metadata          |
| Paid ads                 | Only after conversion is known        | Small budget on the best organic content    |

Do not spend on ads until organic conversion from visit to sign-up to paid is measured.

### Funnel and events

Visit, recipe view, sign-up, profile completed, plan created, upgrade prompt seen, checkout started, subscription active, subscription canceled. Use Vercel Analytics custom events or add a product analytics tool. Record the traffic source on sign-up.

Built with Vercel Analytics custom events. The event list, where each is sent, and how to read them are in [docs/analytics.md](../analytics.md).

### Success metrics

- Weekly visitors and sign-ups.
- Visit to sign-up and sign-up to paid conversion.
- Cost per paid member by channel.
- Monthly recurring revenue and churn.
- Break-even point: paid members needed to cover hosting, Supabase, OpenAI images, and Stripe fees. Compute this before spending on ads.

### Risks and open questions

- Health claims in ads. Stay with "macro-friendly" and avoid outcome promises.
- Photos are AI-generated placeholders. Decide whether to replace them with real photos before heavy promotion, since food ads depend on them. Disclose AI images where required.
- Time budget. One person cannot run every channel. Pick two to start.
- Does the owner have an existing audience to seed the launch?

### Tasks

1. Legal pages and disclaimer.
2. Email capture and a welcome email.
3. Funnel events and a simple dashboard.
4. Break-even model.
5. Content calendar for the first four weeks and two channel tests.
6. Founding-member offer, if chosen.

## Phases 2 and 3: Favorites and reviews

**Status:** Not started. Favorites (phase 2) ship first, since they have no cold start. Reviews (phase 3) wait for traffic.

### Goal

Signed-in members can favorite recipes and rate and review them. Both are free. Favorites give members a reason to sign up and come back. Reviews help new visitors choose.

### Scope

**In**

- Favorites: a heart on the recipe card and recipe page, a "Favorites" filter on `/recipes`, and a favorites list on the account page.
- Star rating (1 to 5) and optional text review per member per recipe, editable and deletable by the author.
- Rating summary on the recipe card and recipe page.
- Optional "made it" tag and a "what I changed" note, since this site is about adjusting recipes.
- Sort and filter by rating on the browse page.
- Owner moderation: hide or remove a review, and respond.
- Review structured data in page metadata for search.

**Out**

- Photo uploads. Later, and it needs storage and moderation decisions.
- Replies between members, voting on reviews.
- Anonymous reviews.
- Favorites for signed-out visitors. Tapping the heart signed out prompts sign-in.

### Requirements

1. Signed-in only. One review per member per recipe.
2. Favorites are private to the member (RLS on user id). Favoriting works the same for every recipe, free and paid members alike.
3. Basic abuse controls: rate limit, length limits, a profanity or link filter, and a report button.
4. New reviews publish immediately, and the owner can hide them after the fact. Revisit if abuse appears.
5. Aggregate rating is stored or cached per recipe, not recomputed on every render. Pages stay statically cacheable, so revalidate by tag when a review changes.
6. Do not show ratings until a recipe has at least a few, to avoid a single 5 star review looking like proof. Recommend a minimum of 3.
7. Include review structured data only when the data is real and complies with search engine guidelines.

### Data

- `recipe_favorites(user_id, recipe_id, created_at)` with a primary key on `(user_id, recipe_id)`.
- `recipe_reviews(id, recipe_id, user_id, rating, body, made_it, changes, status, created_at)` with a unique constraint on `(recipe_id, user_id)`. `recipes.rating_avg` and `recipes.rating_count` for the summary.

### Success metrics

- Share of active members with at least one favorite.
- Sign-ups that start from a favorite tap.
- Share of active members who leave a review.
- Reviews per published recipe.
- Share of reviews hidden for abuse.

### Risks and open questions

- Cold start. With few members, most recipes will show no reviews. Favorites do not have this problem, so ship them first. Consider asking for ratings in a post-cooking email or prompt.
- Moderation time. Keep the owner flow to a single list with hide and delete.
- Whether favorite counts are ever shown publicly. Recommend no for now.

### Phase 2 tasks

1. Favorites: migration, GraphQL, heart button, browse filter, account list.

### Phase 3 tasks

1. Reviews: migration, model, GraphQL types, and mutations.
2. Review form and list on the recipe page.
3. Aggregate rating, browse sort and filter.
4. Owner moderation view.
5. Structured data and abuse controls.

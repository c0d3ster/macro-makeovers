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

### Advertising and marketing

The plan is to take traffic that already goes to competitors, split it into target groups with their own message and landing page, and only scale the groups that convert. Competitors and their prices are in [`docs/meal-planning-market.md`](../meal-planning-market.md).

#### Where competitor traffic can be won

| Opening | What is happening | How we take it |
| --- | --- | --- |
| Mealime shut down (2026-10-21) | Albertsons closed Mealime and deleted every account, with no export. It claimed 7 million users. Eat This Much already runs a "switch from Mealime" page | A "Mealime alternative" page, search ads on Mealime terms, and posts where former users ask for replacements. The window closes as those users settle, so this test goes first |
| "Alternative" and "vs" searches | People search for "[app] alternative" and "[app] vs [app]" before switching | Honest comparison pages for the closest competitors (Eat This Much, MyFitnessPal's meal planner, Plan to Eat, Mealime). Facts from the market doc, dated and sourced |
| Competitor brand keywords | Google lets anyone bid on a competitor's name as a keyword, but not use it in ad text | A small, capped search test on competitor names. These clicks cost more because the brand owner wins on relevance, so measure cost per paid member before raising the cap |
| Dish searches | People search for "high protein chicken alfredo" and "healthy [dish]" on Google and Pinterest | One page per recipe already exists. Add the "makeover vs traditional" numbers to titles, descriptions, and pins |
| Communities | Macro, meal prep, and lifting communities on Reddit discuss the apps above by name | Reddit ads can target specific communities and keywords, which makes it the most precise way to reach a competitor's users. Organic posts follow each community's rules |

#### Target groups

| Group | Who | Using today | Pain | Hook | Channels | Landing page |
| --- | --- | --- | --- | --- | --- | --- |
| Displaced planners | Former Mealime users who want a week planned with a shopping list | Nothing yet, or a stopgap | Lost their saved recipes and plans | "Plan the week, send it to your cart." The free basket and Fit planner | Search, Reddit, comparison page | Mealime alternative page |
| Macro trackers | People logging food in MyFitnessPal, MacroFactor, or Cronometer | A tracker, no recipe source | Know their numbers, not what to cook | "Comfort food with the macros already worked out." Book numbers were checked against MyFitnessPal | Reddit, search, short video | `/recipes` with a goal preset set |
| Lifters on a recomp or bulk | Gym-goers chasing protein targets, some on RP or Carbon | A coach app or a spreadsheet | Hitting protein without eating plain chicken | Protein per serving, bulk builds, Fit targets from their own weight | Short video, Reddit, fitness creators | A bulk or recomp collection |
| Comfort-food dieters | People who quit diets because the food was sad | Pinterest boards, "healthy" recipe blogs | Diet food that tastes like diet food | The "makeover vs traditional" comparison | Pinterest, short video, search | The recipe page itself |
| Batch cookers on a budget | Meal preppers cooking once for the week | Recipe sites and a notes app | Cost and leftovers | Cost per serving and the pooled basket savings | Reddit, Pinterest, email | `/basket` with a starter bundle |
| AI makeover users (later) | Users of easyEats, Reci AI, and similar apps | One-tap AI swaps | Untested results | Rules from kitchen-tested recipes | Hold until PRD 04 ships | Studio page |

#### How targeting works per platform

- **Meta (Instagram, Facebook):** since 2026-01-15, Meta treats interests as suggestions and has retired many of them, so stacking interests to reach a competitor's users no longer works. The target group is set by the creative, one ad set per group, plus custom audiences (site visitors, the email list) and lookalikes built from paying members once there are enough.
- **Reddit:** target by community and keyword. Start with three to five communities per group.
- **Google Search:** competitor, "alternative", and dish keywords, each in its own campaign so cost per group stays readable.
- **Pinterest:** keyword and interest targeting on the pins that already do well organically.
- **Creators:** high-protein recipe and fitness creators whose audience matches one group. Pay per post or by affiliate link, with FTC disclosure.

#### Rules

- No competitor names in ad text. Comparison pages may name competitors, but only to state facts, each with a date and a source, and with no implied endorsement.
- No health or weight-loss outcome promises (see risks).
- Every ad and post links with UTM tags (`utm_source`, `utm_medium`, `utm_campaign`), and `utm_campaign` names the target group, so sign-ups and paid members can be read per group from the traffic source on `users` (see [docs/analytics.md](../analytics.md)).
- Set a cost ceiling per paid member before spending. At $5 a month with a three-month payback, that is about $15. Raise it only with churn data.
- Pause a group after its test budget is spent with no paid members, and move the budget to the group that converts.

Sources (checked 2026-11-25): [Mealime closing notice](https://www.mealime.com/closing), [Eat This Much switch page](https://www.eatthismuch.com/switch-from-mealime), [Google Ads trademark policy](https://support.google.com/adspolicy/answer/6118), [Meta targeting change, January 2026](https://advlaunch.us/blog/meta-detailed-targeting-removed-2026), [Reddit ad targeting](https://sproutsocial.com/insights/reddit-advertising/).

### Funnel and events

Visit, recipe view, sign-up, profile completed, plan created, upgrade prompt seen, checkout started, subscription active, subscription canceled. Use Vercel Analytics custom events or add a product analytics tool. Record the traffic source on sign-up.

Built with Vercel Analytics custom events. The event list, where each is sent, and how to read them are in [docs/analytics.md](../analytics.md).

### Success metrics

- Weekly visitors and sign-ups.
- Visit to sign-up and sign-up to paid conversion.
- Cost per paid member by channel and by target group.
- Monthly recurring revenue and churn.
- Break-even point: paid members needed to cover hosting, Supabase, OpenAI images, and Stripe fees. Compute this before spending on ads.

### Risks and open questions

- Health claims in ads. Stay with "macro-friendly" and avoid outcome promises.
- Photos are AI-generated placeholders. Decide whether to replace them with real photos before heavy promotion, since food ads depend on them. Disclose AI images where required.
- Time budget. One person cannot run every channel. Pick two to start.
- Does the owner have an existing audience to seed the launch?
- Trademark risk on comparison pages. Have the copy checked before they go live.
- Competitor search clicks can be expensive. Keep that test capped until cost per paid member is known.

### Tasks

1. Legal pages and disclaimer.
2. Email capture and a welcome email.
3. Funnel events and a simple dashboard.
4. Break-even model.
5. Content calendar for the first four weeks and two channel tests.
6. Founding-member offer, if chosen.
7. Mealime alternative page and the first search and Reddit test against it.
8. Comparison pages for the closest competitors, sourced from the market doc.
9. One landing page and one ad set per target group, with UTM campaigns named by group.
10. Cost ceiling per paid member, and a per-group report from `users` traffic source.
11. Creator shortlist per target group.

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

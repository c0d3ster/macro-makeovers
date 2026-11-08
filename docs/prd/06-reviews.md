# PRD 06: Favorites and reviews (later)

## Problem

Visitors cannot tell which recipes actually work for other people, and members have no way to keep the recipes they like in one place. Recipe sites also gain search traffic and trust from ratings.

## Goal

Signed-in members can favorite recipes and rate and review them. Both are free. Favorites give members a reason to sign up and come back. Reviews help new visitors choose.

## Scope

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

## Requirements

1. Signed-in only. One review per member per recipe.
2. Favorites are private to the member (RLS on user id). Favoriting works the same for every recipe, free and paid members alike.
3. Basic abuse controls: rate limit, length limits, a profanity or link filter, and a report button.
4. New reviews publish immediately, and the owner can hide them after the fact. Revisit if abuse appears.
5. Aggregate rating is stored or cached per recipe, not recomputed on every render. Pages stay statically cacheable, so revalidate by tag when a review changes.
6. Do not show ratings until a recipe has at least a few, to avoid a single 5 star review looking like proof. Recommend a minimum of 3.
7. Include review structured data only when the data is real and complies with search engine guidelines.

## Data

- `recipe_favorites(user_id, recipe_id, created_at)` with a primary key on `(user_id, recipe_id)`.
- `recipe_reviews(id, recipe_id, user_id, rating, body, made_it, changes, status, created_at)` with a unique constraint on `(recipe_id, user_id)`. `recipes.rating_avg` and `recipes.rating_count` for the summary.

## Success metrics

- Share of active members with at least one favorite.
- Sign-ups that start from a favorite tap.
- Share of active members who leave a review.
- Reviews per published recipe.
- Share of reviews hidden for abuse.

## Risks and open questions

- Cold start. With few members, most recipes will show no reviews. Favorites do not have this problem, so ship them first. Consider asking for ratings in a post-cooking email or prompt.
- Moderation time. Keep the owner flow to a single list with hide and delete.
- Whether favorite counts are ever shown publicly. Recommend no for now.

## Tasks

1. Favorites: migration, GraphQL, heart button, browse filter, account list.
2. Reviews: migration, model, GraphQL types, and mutations.
3. Review form and list on the recipe page.
4. Aggregate rating, browse sort and filter.
5. Owner moderation view.
6. Structured data and abuse controls.

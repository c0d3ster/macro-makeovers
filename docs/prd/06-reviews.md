# PRD 06: Reviews

## Problem

Visitors cannot tell which recipes actually work for other people. Recipe sites also gain search traffic and trust from ratings.

## Goal

Signed-in members can rate and review recipes. Reviews are free and help new visitors choose.

## Scope

**In**

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

## Requirements

1. Signed-in only. One review per member per recipe.
2. Basic abuse controls: rate limit, length limits, a profanity or link filter, and a report button.
3. New reviews publish immediately, and the owner can hide them after the fact. Revisit if abuse appears.
4. Aggregate rating is stored or cached per recipe, not recomputed on every render. Pages stay statically cacheable, so revalidate by tag when a review changes.
5. Do not show ratings until a recipe has at least a few, to avoid a single 5 star review looking like proof. Recommend a minimum of 3.
6. Include review structured data only when the data is real and complies with search engine guidelines.

## Data

`recipe_reviews(id, recipe_id, user_id, rating, body, made_it, changes, status, created_at)` with a unique constraint on `(recipe_id, user_id)`. `recipes.rating_avg` and `recipes.rating_count` for the summary.

## Success metrics

- Share of active members who leave a review.
- Reviews per published recipe.
- Share of reviews hidden for abuse.

## Risks and open questions

- Cold start. With few members, most recipes will show nothing. That is why this is last in the build order. Consider asking for ratings in a post-cooking email or prompt.
- Moderation time. Keep the owner flow to a single list with hide and delete.

## Tasks

1. Migration, model, GraphQL types, and mutations.
2. Review form and list on the recipe page.
3. Aggregate rating, browse sort and filter.
4. Owner moderation view.
5. Structured data and abuse controls.

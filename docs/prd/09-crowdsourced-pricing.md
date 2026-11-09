# PRD 09: Crowdsourced pricing

## Problem

Basket prices are a hand-built snapshot (`docs/cost-estimates.md`, October 22 to 29, 2026): the owner's Martin's receipt, the Martin's shelf, and retailer product pages read by hand, with BLS averages as a comparison column. It goes stale, it's one region, and refreshing it takes hours. The paid store comparison in PRD 05 needs prices per chain, and the grocer APIs can't supply them on their terms (`docs/grocery-services.md`, "Store price comparison"). Scraping store sites breaks their terms too.

## Goal

Members share their grocery receipts, and the site turns them into current prices per chain and store. Those prices keep the basket's estimates fresh for everyone, and they power the paid store comparison. Every price comes from a receipt a member chose to share, so no store's site or API is involved.

This is how the snapshot was built already: the owner's receipts are the first source. This PRD automates that and opens it to members.

## Scope

**In**

- Share a receipt two ways: upload a photo or PDF, or forward the store's email receipt (Walmart and Kroger both send itemized ones) to an inbound address on our domain.
- Parse each receipt into store, date, and lines (description, quantity or weight, price paid, any discount line).
- Match lines to basket item keys. High-confidence matches go in automatically. The rest go to a review queue in `/admin`.
- Price records per item, chain, store, and date, with regular and sale prices kept apart.
- Aggregated prices: a recent typical price per item for each chain and store.
- The owner's receipts go through the same pipeline from `/admin`, which replaces the hand-built receipt rows.
- A monthly BLS check: compare each default price with the BLS regional average for matching series and flag big gaps for review.
- A member page listing their shared receipts, with delete.
- Measuring checkout drift: the receipt total against the basket estimate for the same trip, when a member shares a receipt after "Send to cart".

**Out**

- Scraping, or prices from any grocer API.
- Licensed price data. Revisit once revenue supports it (`docs/grocery-services.md`).
- Showing one member's receipt to another member.
- Coupons and loyalty discounts as separate prices. Record them, but compare on the price before coupons.

## Who gets what

- **Free:** sharing receipts (signed in), and fresher basket estimates for everyone.
- **Paid:** the store comparison in PRD 05, built from these prices.

## Requirements

1. **Parsing.** Claude reads photos, PDFs, and email bodies into a typed result: store name and address, date, lines, subtotal. Reject a receipt that isn't a grocery receipt, is older than 90 days, or is a duplicate (same store, date, and total).
2. **Privacy.** Strip loyalty numbers, card digits, names, and cashier info before anything is stored. Delete the image or email after parsing, and keep only the parsed lines. The privacy policy says what we keep and why.
3. **Matching.** Map receipt abbreviations (for example "KRO SHRD CHED 8OZ") to an item key and a pack size. Keep a per-chain alias table so a confirmed match is automatic next time. Lines that don't map to a basket item are dropped, not stored.
4. **Units.** Store every price per pack and per unit (per oz, per lb, each) so different pack sizes compare fairly. Items sold by weight use the weight on the receipt.
5. **Aggregation.** For each item and chain, the typical price is the median of regular prices from the last 60 days, with outliers dropped. Sale prices are shown separately and never replace the regular price. Store-level prices use the same rule once a store has enough receipts.
6. **Default basket prices.** The default stays "lowest typical price found", now from receipts. Changes to defaults go through owner review in `/admin` before they publish, since they move the `$` tiers on recipe pages. Show the price date on the basket, as today.
7. **Coverage rule for the comparison.** A chain appears in the PRD 05 comparison only when receipt prices from the last 60 days cover at least 80% of the basket's cost. Show the coverage and the date range: "Based on member receipts from the last 30 days."
8. **Abuse.** Cap receipts per member per week, ignore a member whose prices are consistently far from everyone else's, and require prices from at least two members before a chain's price is shown in the comparison. The owner's receipts count from the start.
9. **Incentive.** Thank members on the receipt page with the items their receipt updated. Whether to offer a reward (for example a free month for a few receipts) is open below, since PRD 01 leaves coupons and trials out for now.
10. **BLS check.** Monthly job against the BLS Average Price Data API for items with a matching series (chicken breast, cheddar, eggs, ground beef, butter and similar). Flag a default price more than 25% from the regional average. BLS is a check, never a price source for the basket.

## Data

- `receipts(id, user_id, chain, store_id, purchased_on, subtotal, source, status, created_at)`. `source` is `upload`, `email`, or `owner`.
- `receipt_lines(receipt_id, raw_text, item_key, pack_size, quantity, price_paid, discount, is_sale, match_confidence)`.
- `item_aliases(chain, raw_pattern, item_key, pack_size, confirmed_by)`.
- `item_prices(item_key, chain, store_id, typical_price, unit_price, sale_price, sample_count, member_count, window_start, window_end)`, rebuilt nightly.
- `stores(id, chain, name, address, zip)`, created from receipt addresses.
- RLS: a member reads and deletes only their own receipts and lines. Aggregates are readable by the server only, and paid resolvers expose them per PRD 05.
- Uploads go to the private R2 bucket and are removed after parsing.

## Success metrics

- Receipts shared per week, and the share of members who share one.
- Line match rate without review.
- Chains and stores that meet the coverage rule.
- Default prices updated from receipts, and their median age.
- Checkout drift per grocer, from receipts after "Send to cart".

## Risks and open questions

- Cold start. The comparison needs receipts from more than one chain near the member. Until then it shows only chains that meet the coverage rule, and may show none. The owner's receipts cover their region first.
- Regional spread. A chain's prices differ by region. Compare store-level prices when the member's store has data, otherwise the chain's prices in the same state, and say which.
- Reward or not, and what. Decide with PRD 01 if a free month or credit is worth it.
- Parsing cost per receipt. Check it against the plan price once there's volume.
- Inbound email provider: Resend inbound if it fits, otherwise a dedicated service.
- Store terms on receipts. A receipt belongs to the member, but check that we don't publish a single receipt's prices in a way that reads like a store's price list.

## Tasks

1. Migrations and RLS for receipts, lines, aliases, stores, and prices.
2. Receipt parsing with Claude: photo, PDF, and email body into the typed result, with privacy stripping.
3. Matching and the alias table, plus the `/admin` review queue.
4. Upload page and the member receipt list with delete.
5. Inbound email address and handler.
6. Nightly aggregation and the coverage rule.
7. Owner review of default price changes, wired into the basket data.
8. Monthly BLS check.
9. Load the owner's past receipts through the pipeline.

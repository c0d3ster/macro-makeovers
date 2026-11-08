# Grocery services for "Send to cart"

Research for PRD 05 (grocery ordering) and the basket in PRD 08. Checked 2026-11-08. Every figure below has a source at the bottom. Anything marked **unverified** comes from third-party sites only, or I could not confirm it at all.

## Recommendation

1. **Start with Instacart Developer Platform (IDP).** It is the only option with a documented API built for our case: we post our pooled list (`name`, quantity, unit, optional UPC or brand filter) and get back a hosted Instacart page. Instacart does the product matching, so we don't need a catalog. It reaches about 98% of US households across 1,800+ retailers, Kroger, Costco, Albertsons, Publix and Aldi included. It pays the best of anything here: **5% of the whole cart for orders completed within 7 days**, paid through Impact. Production access takes a demo review, and Instacart quotes about 30 to 40 days from request to production key. Apply now.
2. **Add Kroger next, as a direct-cart perk.** Kroger's public API puts items straight into the shopper's real Kroger cart (OAuth, add only). Instacart can't do that, since it only gives the user a list to add from. Kroger covers about 2,700 stores in 35 states. The affiliate money is unclear (unverified, and maybe limited to Kroger Ship), so treat Kroger as a UX feature, not a revenue line.
3. **Walmart third, if at all.** The add-to-cart URL fills a real cart and can be wrapped in an Impact link. The catch is that it needs Walmart item IDs, which means a mapping step through the Affiliate API. Grocery commission looks like 0 to 1%, and older reports say pickup and delivery orders pay nothing (unverified). Add it for reach, not revenue.
4. **Skip Amazon Fresh / Whole Foods for now.** PA-API 5 was retired in 2026 in favor of the Creators API, which has a sales-history gate. The old multi-ASIN cart link is undocumented now, and one 2026-11-06 report says it opened an empty cart. Grocery pays about 1%, and since 2026-04-14 Amazon only pays on the exact ASIN variant linked.
5. **Paid gate or free: make the basic handoff free.** At 5% of a $60 to $120 basket, each completed Instacart order earns about $3 to $6. A user who orders twice a month through us earns about what the $5 plan costs, and the gate would cut the number of people who ever click. Keep the plan's value in the planner, the book, saved and recurring baskets, and later the multi-retailer and direct-cart (Kroger) options. If the handoff stays paid as PRD 05 says, nothing I found in Instacart's terms forbids it (unverified, since the terms don't address paywalls), but the reviewer needs a working demo account, and only paying members generate commission.

Whichever way it goes, add an affiliate disclosure next to the button (FTC rule, and in scope for PRD 05). Keep showing our own price estimates, not prices pulled from Instacart.

## Comparison

| Service | Handoff | Matching | Access | Pays | Window | US reach | User lands in |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Instacart IDP | REST API returns a hosted page URL | Instacart search on `name`, optional UPC, brand and health filters | Self-serve dev key, production key after demo review, about 30 to 40 days | 5% of total cart | 7 days | About 98% of households, 1,800+ retailers | List page. User picks store, adds items, checks out |
| Instacart affiliate (Impact, non-API) | Tracking links | None | Application, 1 to 2 business days | Up to $10 per new customer order | Unverified | Same | Instacart home or store page |
| Kroger public API | User OAuth, then cart add API | We search Products API by store, get UPC, add | Self-serve developer account. Partner API (full cart control) needs a contract | No cart affiliate in the API. Affiliate program terms unverified | n/a | About 2,700 stores, 35 states, about 20 banners | Real Kroger cart, ready to check out |
| Walmart | `walmart.com/sc/cart/addToCart?items=ID_qty,...` wrapped in Impact link | We must map to Walmart item IDs (Affiliate API search) | Application to Impact program, approval at Walmart's discretion | Up to 4% overall, grocery reportedly 0 to 1% (unverified) | 3 days reported (unverified) | Largest US grocer, near-national | Real Walmart cart |
| Amazon Fresh / Whole Foods | Cart-add URL (undocumented now) or product links | ASINs required | Associates sign-up. Creators API needs recent qualifying sales | About 1% grocery (unverified), possible first-order bounty (unverified) | 24 hours standard | 2,300+ cities with same-day perishables | Cart if the URL still works (unverified), otherwise product pages |
| Chicory | JS widget on schema.org Recipe pages | Chicory | Sign-up form, Chicory reviews | Contextual ad revenue plus retailer affiliate. Split not published | n/a | US only, 70+ retailers | Retailer cart, per recipe |
| Target (Target Partners) | Product links | Manual | Impact application | 1 to 8% by category. Grocery may be excluded (unverified) | 7 days (unverified) | National | Product pages |
| Albertsons / Safeway, H-E-B | No public cart API or official affiliate found | n/a | n/a | n/a | n/a | Reachable through Instacart | n/a |

## Instacart Developer Platform

**How it works.** `POST` to Create shopping list page (or recipe page) with a `title` and `line_items`. Each line item carries a `name` (the search term), `line_item_measurements` (quantity and unit, several allowed), and optional `display_text`, `upcs` or `product_ids`, and `filters` (`brand_filters`, `health_filters`). The response returns a `products_link_url`. `link_type` is `shopping_list` or `recipe`. A recipe link expires after 30 days by default (365 max). A shopping list has no default expiry. Instacart says to cache the URL and only make a new one when the list changes, and `partner_linkback_url` points back to our basket.

This fits our data well. We send the pooled pack count as the measurement, for example `{ quantity: 2, unit: "each" }` for two cans, or the weight for per-lb items, and put a brand filter on brand-locked items (Tillamook, Fage, Heritage, Zatarain's). The `name` field already does the job PRD 05 assigns to "retailer search", so no catalog work is needed.

**UX.** The user lands on an Instacart list page, not a filled cart. Instacart picks a default store from location and availability, and partners can't send users to a specific store. The user can switch stores, then adds the items they want and checks out, logging in or creating an account if they aren't already. It's one or two clicks more than a real cart.

**Access.** Sign up on the developer dashboard and create a development key. Build against it, then create a production key, which triggers a review. The key stays "Pending approval" until then. Instacart asks for a short screen recording of the flow, including a click on the CTA and a live list URL so they can check matching accuracy. Their get-started page estimates 30 to 40 days from access request to production key. Review covers terms compliance, request formatting, error handling, and an Enterprise Help Desk account. The docs say nothing about traffic minimums or a business entity (unverified either way).

**Required UI and copy.** The CTA text must be "Shop ingredients" or "Shop on Instacart", 46px tall with a 29.5px radius, in a Dark, Light or White theme, with a 22px full-color logo. Don't call it a "partnership", and don't say "Free delivery" (use "$0 delivery fee" plus "Service fees apply"). Don't say "Instacart delivers" or mention delivery speed. Disclose any fees our app charges.

**Money.** Approval brings an Impact affiliate invite. Instacart appends the tracking parameters itself, so we must not hardcode them. The developer rate is 5% of total cart value for orders completed within 7 days, and it covers every item in the cart, not just ours. Alcohol, restaurants, prescriptions and gift cards are excluded. Impact pays about 55 days after the end of the month, with a $10 withdrawal minimum. The terms say Instacart may later charge fees for features that are free now, or for use above set limits.

**Coverage.** About 98% of US households, 1,800+ retailers, nearly 100,000 stores. Walmart is not on Instacart.

**Risks.**
- Instacart can change or end the API and the terms at any time (sections 2.6, 4.2, 14.1).
- No scraping, and product prices and names are "Merchant Content". Don't show Instacart's prices next to ours, and don't use them to fill our price book.
- Don't show priced items from more than one retailer on the same screen in the app. That limits any future price comparison built on Instacart data.
- The terms don't mention paywalls. Section 3.5(d), which bars using Instacart Materials "for your own benefit", is vague. Ask the Instacart rep before launch whether a paid-only handoff is fine (unverified).
- A June 2026 changelog entry (seen only on a GitHub mirror) reportedly made conversion tracking an optional last step after approval. Confirm on the official changelog.

## Instacart affiliate program (Impact, non-API)

A separate program for publishers and creators. Apply through Impact, with approval at Instacart's discretion, usually in 1 to 2 business days. It pays up to $10 flat CPA per new-customer order, or a revenue share in some cases. Creators get 10%. Rates vary. It only gives us links to Instacart, not a cart, so it is a fallback while the IDP review runs. Join it for links in newsletters and recipe copy. Cookie window not published (unverified).

## Kroger

**How it works.** The public APIs are Products, Locations, Cart and Identity. Flow: the user signs in to Kroger through OAuth (authorization code, `cart.basic:write` and `product.compact` scopes), picks a store (Locations), and we search Products per item at that `locationId` to get a UPC. Then we `PUT` the items to their cart. The public Cart API can add items but cannot read or remove them. Full cart control needs the Partner API, which means a contract with Kroger.

**Matching.** It's on us: one product search per line, and we choose the result. That's 20 to 40 calls for a basket of 20 to 40 lines. Third-party docs list app-wide limits of 10,000 Products calls and 5,000 Cart calls a day (unverified against Kroger). That caps us at a few hundred baskets a day before we need more quota.

**Access.** Self-serve developer registration (unverified; the portal pages render client-side and I couldn't read them). Production and commercial-use terms are unverified.

**Money.** The API doesn't carry affiliate attribution. The Kroger affiliate program is real, and Kroger was hiring an affiliate manager in 2026, but the network (Impact or CJ), the rate (1 to 4% cited), and whether it covers pickup and delivery or only Kroger Ship are all unverified.

**Coverage.** About 2,697 supermarkets in 35 states under about 20 banners (Ralphs, Fred Meyer, King Soopers, Fry's, Harris Teeter, Smith's, QFC, Mariano's and others), as of January 2026. Kroger is closing about 60 stores by the end of 2026, and a Giant Eagle acquisition was announced but I found no confirmation it closed.

**UX.** The best of the options: a real, filled cart at the user's own store, ready to check out.

**Risks.** The user has to sign in to Kroger. Daily quota. We own the product choice, so a wrong match is our fault. The terms are unread.

## Walmart

**How it works.** The documented add-to-cart URL is `https://www.walmart.com/sc/cart/addToCart?items=<itemId>_<qty>,<itemId>_<qty>` with an optional `storeId`. The docs show it wrapped in an Impact tracking link (`goto.walmart.com/...?u=<encoded cart URL>`). It needs Walmart item IDs (UPCs are reportedly accepted when the quantity is 1). We'd use the Walmart Affiliate API search to map each ingredient to an item ID, then cache the mapping. The walmart.io docs render client-side, so these details come from search summaries of the page (partly unverified).

**Access.** Free to join through Impact. Walmart reviews each site at its sole discretion and can remove sites at any time. No published traffic minimum.

**Money.** "Up to 4%" per eligible sale, on net sales after returns, tax and shipping. Third-party sources put grocery at about 1%, some say 0%, and one older review says grocery pickup and delivery don't pay at all (unverified). The cookie is usually reported as 3 days (unverified). Walmart Creator is a separate program with different terms.

**Coverage.** National, the largest US grocer by sales. Whether a cart link fills a pickup or delivery grocery cart or a shipping cart for a given item is unverified.

**UX.** Real cart. Walmart's 2025 checkout deal with OpenAI was dropped in March 2026 in favor of Walmart's own assistant, a sign it wants the shopper in its own surfaces.

**Risks.** Weak grocery payout. A catalog mapping to maintain. Affiliate agreement not read (price display and incentive rules unverified).

## Amazon Fresh / Whole Foods

**How it works.** The old `amazon.com/gp/aws/cart/add.html?ASIN.1=...&Quantity.1=...&AssociateTag=...` link filled a cart with several items. Its doc page now redirects to the PA-API retirement notice. A 2026-11-06 report says a link like this opened an empty cart, though that test had no associate tag. Treat it as unverified. PA-API 5 was retired in 2026, and the replacement Creators API needs an approved Associates account with recent qualifying sales. I found no cart endpoint in it. Fresh items also need ASIN mapping.

**Money.** About 1% for Amazon Fresh (unverified). One guide cites a $5 first-order bounty for Fresh or Whole Foods (unverified). The 2026-04-14 operating agreement changes pay only on the exact ASIN variant linked, and no longer on other items bought in the same visit. Amazon also cut some category rates by up to 50% from March 2026.

**Coverage.** Same-day perishables in 2,300+ US cities. Prime gets free delivery over $25. Non-Prime pays $12.99.

**Risks.** Program changes, the API gate, and the 24-hour cookie (standard Associates). Not worth building now.

## Chicory

A free shoppable-recipe widget for food publishers. It reads schema.org Recipe markup, works on custom sites through a JS SDK, and sends a recipe's ingredients to 70+ retailers. Publishers earn from contextual in-recipe ads and retailer affiliate programs. Chicory pays at month end on net-60 by ACH. It works one recipe at a time, so it can't take our pooled basket. It is a possible add-on for single recipe pages (a free "Shop this recipe" button) next to the paid basket. Revenue split and traffic minimums aren't published (unverified).

## Samsung Food (Whisk)

It sends recipe lists to retailer checkout inside its own app, and it has had Kroger and Walmart integrations. I found no current public API or publisher program. Its B2B platform sells to brands and grocers. Not usable for us (unverified as of 2026).

## Target / Shipt

Target Partners runs on Impact at 1 to 8% by category with a reported 7-day cookie. Grocery may be excluded (unverified). Product links only, no multi-item cart link found. Club Target replaced the creator program in May 2026. I found no Shipt affiliate program or public API. Not useful.

## Albertsons / Safeway, H-E-B

No public cart API or official affiliate program found. In August 2026 Albertsons launched a Safeway shopping app inside ChatGPT, a direct partnership with OpenAI, not something we can join. Its Media Collective API is for ad reporting. I found nothing for H-E-B. Both are on Instacart, which covers them.

## Other notes

- **AI assistant checkout is moving fast.** Instacart, Walmart and Albertsons all launched ChatGPT shopping in 2025 and 2026, and Walmart pulled back from in-chat checkout in March 2026. It doesn't change the plan, but it is another sign that retailers want to own checkout.
- **Our price book.** `docs/cost-estimates.md` lists the lowest price found per item. Keep those prices our own estimates (labeled as such) and never refresh them by scraping Instacart, Walmart or Amazon. All three ban scraping or tie price display to their APIs.
- **Disclosure.** FTC rules require a clear affiliate disclosure near the link. Put it next to the button, not only in the footer.

## Open questions

1. Instacart: is a paid-only handoff allowed, and how does the reviewer access a gated demo? Ask the rep after signing up.
2. Instacart: is there a traffic minimum or business-entity requirement for a production key? Not documented.
3. Instacart: how does `line_item_measurements` handle pack counts against weights (for example "2 each" vs "16 oz")? Test in development with our basket data.
4. Kroger: read the developer terms for commercial use, and confirm the daily quota and whether it can be raised.
5. Kroger affiliate: network, rate, and whether delivery and pickup orders count.
6. Walmart: confirm the grocery commission and whether pickup and delivery orders qualify. Test whether the add-to-cart URL fills a grocery pickup cart.
7. Amazon: does any cart-add path still exist under the Creators API?
8. Real conversion: no source gives click-to-order rates for recipe-to-cart links. Instrument clicks and check Impact reports before deciding the gate for good.

## Sources

Instacart
- Developer Platform overview: https://docs.instacart.com/developer_platform_api/
- Get started (30 to 40 day estimate): https://docs.instacart.com/developer_platform_api/get_started/overview
- API keys: https://docs.instacart.com/developer_platform_api/get_started/api-keys
- Create shopping list page reference: https://docs.instacart.com/developer_platform_api/api/products/create_shopping_list_page
- Shopping list concept: https://docs.instacart.com/developer_platform_api/guide/concepts/shopping_list
- Pre-launch checklist: https://docs.instacart.com/developer_platform_api/guide/concepts/launch_activities/pre-launch_checklist
- Approval process: https://docs.instacart.com/developer_platform_api/guide/concepts/launch_activities/approval_process
- Conversions and payments: https://docs.instacart.com/developer_platform_api/guide/concepts/launch_activities/conversions_and_payments
- Developer terms: https://docs.instacart.com/developer_platform_api/guide/terms_and_policies/developer_terms
- Developer guidelines: https://docs.instacart.com/developer_platform_api/guide/terms_and_policies/developer_guidelines
- FAQ: https://docs.instacart.com/developer_platform_api/faq
- Changelog: https://docs.instacart.com/developer_platform_api/api/changelog
- Changelog mirror (June 2026 entry, unofficial): https://raw.githubusercontent.com/api-evangelist/instacart/refs/heads/main/changelog/instacart-changelog.yml
- Affiliate program (5% IDP, $10 CPA, payouts): https://company.instacart.com/affiliate
- Coverage, 98% of households: https://assets.contentstack.io/v3/assets/blta100b44b847ff4ca/blt944da72e5712ddc5/6a0c6c2debf71f2e93116226/Instacart_Federal_1_Pager_2026.pdf
- Q4 2025 earnings call: https://www.fool.com/earnings/call-transcripts/2026/02/12/instacart-cart-q4-2025-earnings-call-transcript

Kroger
- kroger-api library (scopes, rate limits, third party): https://github.com/CupOfOwls/kroger-api
- kroger-mcp (public API is add-only, Partner API needs contract): https://github.com/CupOfOwls/kroger-mcp
- Store count and closures: https://www.foxbusiness.com/retail/major-supermarket-chain-closes-least-39-stores-nationwide-overhaul-takes-shape.amp
- Affiliate program (third party): https://www.flexoffers.com/affiliate-programs/kroger-affiliate-program
- Affiliate program review (third party): https://www.creator-hero.com/blog/kroger-affiliate-program-in-depth-review-pros-and-cons

Walmart
- Add to Cart docs: https://walmart.io/docs/atc/v1/add-to-cart
- Affiliate FAQ: https://affiliates.walmart.com/faqs
- Grocery commission (third party): https://blog.affilytics.io/blog/walmart-affiliate-program/
- Grocery pickup and delivery not paid (old, third party): https://affiliateprogramsguru.com/programs/walmart/
- Walmart drops OpenAI checkout: https://thepaypers.com/payments/news/walmart-drops-openai-checkout-and-deploys-sparky-on-ai-platforms

Amazon
- PA-API 5 retirement notice: https://affiliate-program.amazon.com/creatorsapi/docs/en-us/paapiv5-deprecation
- Operating agreement changes (2026-04-14): https://affiliate-program.amazon.com/help/operating/compare
- Rate cuts, May 2026: https://www.shopifreaks.com/amazon-quietly-slashed-associates-affiliate-commission-rates-by-up-to-50-across-publisher-ecosystem-and-gutted-reporting-tools/
- Commission rates (third party): https://getlasso.co/amazon-affiliate-commission-rate/
- Cart link empty, 2026-11-06 report: https://github.com/todd450/go-bag/issues/94
- Same-day perishables, 2,300+ cities: https://www.aboutamazon.com/md/news/retail/amazon-same-day-fresh-grocery-delivery-united-states
- Q2 2026 update: https://www.supermarketnews.com/finance/amazon-cites-growth-in-same-day-perishables-delivery

Others
- Chicory for food bloggers: https://chicory.co/chicory-for-food-bloggers
- Chicory and Food52 (scale): https://chicory.co/blog-feed/food52-and-chicory-partner-to-drive-revenue-and-drive-recipe-commerce
- Whisk and Kroger: https://whisk.com/blog/whisk-partners-with-kroger/
- Target affiliate (third party): https://loudcrowd.com/blog/target-affiliate-program-how-it-works/
- Albertsons Safeway in ChatGPT: https://www.grocerydive.com/news/albertsons-ai-safeway-plugin-chatgpt-technology/827147/
- Albertsons Media Collective API: https://www.businesswire.com/news/home/20250107889665/en/Albertsons-Media-Collective-Enables-Advertisers-to-Measure-Performance-with-Greater-Ease-and-Frictionless-Access-Via-New-API-Offering-and-TransUnion-Partnership

# Grocery services for "Send to cart"

Research for PRD 05 (grocery ordering) and the basket in PRD 08. Checked 2026-11-08, terms for store price comparison checked 2026-11-09. Every figure below has a source at the bottom. Anything marked **unverified** comes from third-party sites only, or I could not confirm it at all. Meal planning apps, meal kits and market data are in [`meal-planning-market.md`](./meal-planning-market.md).

## Recommendation

The owner picked a multi-grocer handoff: at "Send to cart" the user chooses where to shop. The site's value is honest costs, so the ranking puts price drift (how far checkout lands from our in-store estimate) ahead of revenue.

**Launch order**

1. **Walmart, at launch.** It has the widest US reach of anything here. The add-to-cart URL fills a real Walmart cart with no user sign-in on our side. Pickup is free over $35, and the terms say online prices match the store that packs the order. Building it is cheap: an item ID map for about 100 ingredients, plus a URL. Revenue is close to nothing (grocery reportedly 0 to 1%, unverified). Before committing, test that the link fills a pickup grocery cart, not a ship-to-home cart.
2. **Kroger, right after.** It's a real cart at the user's own store, with no markup over in-store prices, free pickup over $35, and the user's clipped digital coupons applied at checkout. That makes it the best match for honest costs. It costs more to build (Kroger OAuth, product search per store, our own matching) and has a daily API quota. Revenue is near zero through the API.
3. **Instacart, third, as "other stores and delivery".** It's the only route to Costco, Publix, Aldi, H-E-B, Safeway and regional grocers, and the only one that pays well: 5% of the cart. Every order through it costs the user more than our estimate, though: service fee, delivery fee, tip, and often markups. Label it with that, and never make it the default. Apply now, since production approval takes about 30 to 40 days.
4. **Amazon Fresh: skip.** There's no working cart path and the payout is weak.

**Default:** the grocer the user picked last time. For a first-time user, pick by zip: Kroger pickup if a Kroger-banner store is nearby, otherwise Walmart pickup. Pickup is the default mode everywhere, because it's the only mode where the checkout total roughly matches our basket cost.

**Revenue honestly:** on 100 orders of a $60 in-store basket, Instacart earns about $300 to $350. Walmart and Kroger together earn $0 to $60. That gap of about $250 to $350 per 100 orders is real. On the same $60 basket, the Instacart user pays roughly $12 to $30 more than in-store. The owner's read holds up: the 5% is paid out of a take that markups and fees fund. Lead with the honest-cost grocers and accept the lower revenue. The $5 plan, not affiliate fees, is the main revenue line.

**Paid or free:** with Walmart and Kroger earning almost nothing per order, the affiliate argument for a free handoff is gone. It's fine to keep "Send to cart" in the $5 plan as PRD 05 says. Keep the free basket's copy and share path. Disclose affiliate links next to the button.

## Comparison

Ranked on the owner's criteria. "Drift" is the likely checkout total for a basket that costs $60 at in-store shelf prices.

| Grocer path | Markup over in-store | Drift on $60 (pickup / delivery) | Reliability | Coupons and loyalty | Who handles service | Revenue per 100 orders | Build |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Kroger (API, real cart) | None, per Kroger | Pickup about $60 (free over $35), lower with digital coupons / delivery about $70+ with fee and tip (unverified) | Retailer's own app. Delivery now leans on DoorDash, Uber Eats and Instacart couriers | Digital coupons and loyalty pricing apply | Kroger | About $0 (affiliate unverified) | Medium to high: OAuth, matching, quota |
| Walmart (add-to-cart URL) | None per terms (prices follow the packing store) | Pickup about $60 (free over $35) / delivery about $68 to $75 with $7.95 to $9.95 fee and tip, or Walmart+ at $98 a year (fees unverified) | Retailer's own app | Rollbacks show automatically. No digital coupon program to speak of | Walmart | $0 to $60 (grocery 0 to 1%, unverified) | Low: ID map and URL |
| Instacart, no-markup retailer | None (Bashas, Fareway, Grocery Outlet, Raley's, Super King, more) | Delivery about $72 to $80: service fee 5 to 10%, delivery fee $3.99 to $7.99, tip | Third-party shoppers. Owner reports glitches | Retailer loyalty sometimes linked. Owner reports misapplied coupons | Instacart | About $300 (5% of cart) | Low: one API call, review |
| Instacart, markup retailer (Costco, Aldi, many others) | About 10 to 24% at Costco, about 17% at Aldi (single tests, unverified). About 15% average claimed (unverified) | Delivery about $80 to $90 | Same | Same | Instacart | About $330 to $350 | Same |
| Amazon Fresh / Whole Foods | Unverified | Prime free over $25, non-Prime $12.99 | Amazon logistics | Prime deals at Whole Foods | Amazon | About $60 at 1%, if attribution works | No working cart path |
| Target | Unverified | No cart link | n/a | Target Circle | Target | Grocery may be excluded | Not possible |

Revenue assumes 100 completed orders on the stated basket. Instacart pays 5% of the cart at Instacart's prices. Whether fees count toward "total cart value" is unverified, so the low end leaves them out.

## Checkout drift and trust

Our basket shows a trip cost and a per-serving cost built from in-store shelf prices. If "Send to cart" lands the user at a total 30% higher, the number we showed looks wrong even though it isn't. So:

- Show the grocer's likely extra costs on the picker before the handoff: "Pickup: free over $35", "Delivery: fee plus tip", "Instacart: service and delivery fees, prices may be higher than in store".
- Keep our numbers labeled "estimated in-store cost" everywhere.
- Never present an Instacart checkout total as our estimate, and don't show Instacart's item prices. Its terms bar that anyway (Merchant Content).
- Instacart's own push for "no markup" retailers is a sign of the problem. It says no-markup retailers grew 10 points faster than markup retailers in Q2 2026, and gives them a yellow banner and a tab. If Instacart ships, we could limit its picker to no-markup stores. Whether the API allows that is unverified: the FAQ says partners can't choose the merchant.

## Building the multi-grocer picker

| Piece | Walmart | Kroger | Instacart |
| --- | --- | --- | --- |
| User auth | None | Kroger OAuth per user, token storage and refresh | None |
| Matching | Our map: ingredient to Walmart item ID (about 100 items now). Seed it from the Affiliate API search, curate by hand, recheck monthly for discontinued items | Live: Products API search per line at the user's store, our ranking, cached per store | Instacart's search on `name`, plus brand filters |
| Store choice | Optional `storeId` | Locations API by zip | Instacart chooses. Partners can't direct |
| Quotas | None known | About 5,000 cart and 10,000 product calls a day app-wide (third party, unverified) | None published |
| Approval | Impact application for commission only. The link works without it | Developer registration. Commercial terms unread | Demo review, about 30 to 40 days |
| Rough build | 1 to 2 weeks | 3 to 5 weeks | 1 to 2 weeks, plus the review wait |
| Ongoing | Item map upkeep | Matching quality, quota, API changes | CTA and copy rules, API version upgrades |

Shared work: one `GrocerAdapter` interface (input is the pooled basket, output is a URL or a cart write), the picker UI, the fee notes, click logging per grocer, and the disclosure.

**Can we show competitors side by side?** Yes, as cart options without prices. None of the three forbids offering another grocer as a button next to it. Showing each store's price next to the others is a different question, covered in the next section.

## Store price comparison (terms checked 2026-11-09)

The idea: a paid feature that shows the basket's total at the user's nearest stores side by side, so they can shop at the cheapest. On the current public terms, none of the three allows it without written permission.

| Grocer | Prices from the API | What the terms say about comparing | Verdict |
| --- | --- | --- | --- |
| Kroger | Yes. Products API returns `price` (regular and promo) per `locationId` | Acceptable Use, Products API, prohibited: "Comparing products/prices among other retailers." | Blocked on the public API |
| Walmart | Unverified. The Affiliate API docs don't render, so per-store price is unconfirmed | API is for affiliates "solely for the purpose of advertising Walmart.com products online", other uses need written permission. No clause bans comparison outright, and its name may sit "adjacent to competitive brands" | Gray. Needs written permission |
| Instacart | No. No endpoint returns prices or totals | 3.5(k)(iv): no Instacart data to "display priced items from multiple retailers on the same screen". 3.5(l): no "compare ... items from one retailer basket to another retailer basket" | Blocked, and there's no price data anyway |

**Kroger** (Terms of Service, last modified 2019-04-09. Acceptable Use and Branding Guidelines, 2021-04-28):

- Acceptable Use bans comparing products or prices among retailers. It also bans storing data derived from customer searches.
- Terms 5(e): no building databases or permanent copies of API content, and no caching longer than the cache header allows. A monthly price job that keeps Kroger prices is out. Prices have to be fetched live and cached briefly.
- Terms 4(a): no "competitive, comparative or any other type of analysis to develop marketing or business strategies ... targeting Kroger customers."
- Branding: Kroger's primary logos are allowed only for the add-to-cart use "as long as your company does not directly or indirectly monetize the integration." "Send to cart" is in the paid plan, so use the generic Kroger integration logo, not the store logo.
- Rate limits: 10,000 Products calls and 5,000 Cart calls a day, app-wide. A 25-line basket at one store is about 25 calls, so live comparisons for many users would hit the cap fast.
- Path to yes: the Partner API, through a partnership request. Official partnerships are "determined on a by-partner basis."

**Walmart** (walmart.io API Terms of Use, last updated 2020-09-30):

- Use is limited to advertising Walmart.com products. Other uses need "express written permission from Walmart."
- 5,000 calls a day. Commission is 4% on most products and 1% on some categories, within 3 days of the click (these are the API terms' figures, not grocery-specific).
- No "pulls Internet traffic away from Walmart.com." A comparison that sends a user to Kroger arguably does that.
- No scraping. No redistributing product information to third parties.
- The developer.walmart.com license agreement (rev. 2026-04-17) is for Marketplace and Supplier APIs, not the Affiliate API. It's stricter (no "competitive product or service", no end-user access), but it likely doesn't apply here.

**Instacart** (Developer Platform Terms, last updated 2024-07-03):

- Endpoints: Create shopping list page and Create recipe page (both return only a link), and Get nearby retailers (zip in, retailer names, keys and logos out). No prices.
- No retailer field on the link endpoints, so we can't preselect a store. The user picks one on Instacart.
- 3.5(e) bans scraping unless authorized in writing.
- We can use nearby retailers for "available at Raley's and Bashas near you" with no prices.

**What this means.** Store comparison needs written permission: a Kroger partnership, and Walmart's consent to use its prices next to Kroger's. Until then:

- The picker shows each grocer as a cart option with fee notes and no store total.
- Instacart stays "see your total on Instacart."
- Our own estimate stays the single basket cost, from the hand-checked prices in `basketData.ts`.

Ask Kroger (partnership request) and Walmart (affilops@wal-mart.com) in writing. Ask Instacart during its production review.

## Instacart

**Why the owner dislikes it, and what's on record.**

- **FTC settlement:** in December 2025 Instacart paid $60M to settle FTC claims over misleading "free delivery" and refund handling. It didn't admit or deny them.
- **Price tests:** a Consumer Reports and Groundwork study found the same item at the same store priced differently for different shoppers, by up to 23%. The FTC reportedly opened an inquiry into the Eversight pricing tool. Instacart then ended all item price tests. Retailers can still mark up and vary prices by store.
- **Fees:** the service fee runs 5 to 10% on delivery, the delivery fee $3.99 to $7.99 for non-members, plus tip. Instacart+ costs $99 to $110 a year (third-party figures).
- **Glitches, coupons, customer service:** I found consumer review roundups but no primary data (unverified).

The direct-retailer paths avoid the markups, the service fee and Instacart's support desk. On delivery, Kroger now uses third-party couriers too, so delivery reliability can be similar. Pickup avoids that.

**Retailers on Instacart.**

- **Advertise in-store prices ("no markups"), 2026:** Bashas, Fareway, Grocery Outlet, Raley's, Super King Markets. Hy-Vee is reported but unverified. Instacart says 90%+ of US users have a no-markup retailer in their area.
- **Mark up:** Costco (about 10% with linked membership and Instacart+, about 24% without, one blogger's test) and Aldi (about 17%, conflicting source). Kroger, Publix and Safeway: I couldn't verify either way. Instacart says some partners "apply a markup to help offset the cost" of delivery.

**How it works.** `POST` Create shopping list page with `title` and `line_items`. Each item takes `name` (the search term), `line_item_measurements` (quantity and unit, several allowed), and optional `display_text`, `upcs` or `product_ids`, and `filters` (`brand_filters`, `health_filters`). The response is a `products_link_url`, which we cache and regenerate only when the list changes. Recipe links expire after 30 days by default (365 max). Shopping lists have no default expiry. `partner_linkback_url` points back to our basket. The user lands on a list page, not a filled cart: they pick a store, add items, and check out.

**Access.** Self-serve development key. Creating the production key triggers a review. Instacart asks for a short screen recording of the flow and a live list URL so it can check matching. About 30 to 40 days from request to production key, per Instacart. Nothing documented on traffic minimums or a business entity (unverified).

**Required UI and copy.** CTA text must be "Shop ingredients" or "Shop on Instacart", 46px tall with a 29.5px radius, with a 22px full-color logo. No "partner" wording, no "free delivery", no delivery speed claims.

**Money.** The developer rate is 5% of total cart value for orders completed within 7 days, paid through Impact about 55 days after month end, with a $10 minimum. A separate publisher program pays up to $10 per new-customer order. Instacart can change terms, charge for features that are free now, or end the API at any time (terms 2.6, 4.2, 14.1).

**Coverage.** About 98% of US households, 1,800+ retailers. Walmart is not on it.

## Kroger

**How it works.** Public APIs for Products, Locations, Cart and Identity. The user signs in with Kroger OAuth (`cart.basic:write`, `product.compact`) and picks a store. We search Products per item at that `locationId` to get a UPC, then add to their cart. The public Cart API can add items but can't read or remove them. Full cart control needs the Partner API, which takes a contract.

**Prices and coupons.** Kroger says pickup and delivery carry the same prices as in store. Digital coupons come off at pickup. Paper coupons can only be used in person. Pickup is free over $35, $4.95 below that (third-party figures).

**Delivery.** In November 2025 Kroger closed three Ocado automated centers and leaned more on DoorDash, Uber Eats and Instacart for last-mile delivery. Whether prices change when a third party delivers a Kroger order is unverified.

**Coverage.** About 2,697 stores in 35 states under about 20 banners (Ralphs, Fred Meyer, King Soopers, Fry's, Harris Teeter, Smith's, QFC, Mariano's and others), as of January 2026. About 60 stores are closing by the end of 2026.

**Money.** No attribution through the API. Kroger runs an affiliate program, but the network, rate (1 to 4% cited) and scope (maybe Kroger Ship only) are unverified.

**Precedents.** eMeals sends lists to Kroger banners. Whisk used a premium Kroger API for inventory and matching. Cooklist links Kroger loyalty accounts. The mechanics at eMeals aren't public.

## Walmart

**How it works.** The add-to-cart URL is `https://www.walmart.com/sc/cart/addToCart?items=<itemId>_<qty>,...` with an optional `storeId`. Walmart's docs show it wrapped in an Impact link (`goto.walmart.com/...?u=<encoded URL>`), and say the service is open to partners whether or not they're on Impact. Walmart also lists Recipes and Bundle APIs, which shop "given a list of ingredients". Their docs render client-side, and I couldn't read details or access terms (unverified). A July 2026 review found no consumer checkout or account-linking API for third parties.

**How others did it.**

- **SideChef:** has had a Walmart integration since 2020. It's API-based, with store-level inventory, and adds each ingredient to a cart at the nearest store by zip.
- **Prepear:** its help center describes a "Shop now" button that opens Walmart.com, loads the ingredients and prompts checkout. I couldn't open the page itself (403), so this comes from the search summary.
- **eMeals:** markets Walmart integration for pickup and delivery. Its mechanics aren't public, and no partnership press release turned up.

All three point to the add-to-cart service, or a negotiated version of it, rather than a separate cart API (partly unverified). Asking Walmart about the Recipes API is worth one email.

**Prices.** The terms say pickup and delivery prices follow the store that picks and packs the order, and don't match other stores. Third-party sources say online prices generally track in-store prices. Pickup is free over $35. Delivery is about $7.95 to $9.95 without Walmart+ ($12.95 a month or $98 a year). Fees are unverified.

**Money.** Up to 4% overall. Grocery is reportedly 0 to 1%, and one old review says pickup and delivery pay nothing. Cookie about 3 days. All unverified.

**Coverage.** Near-national, the largest US grocer.

## Amazon Fresh / Whole Foods

The old multi-ASIN cart link (`gp/aws/cart/add.html?ASIN.1=...`) is no longer documented. Its doc page now redirects to the PA-API retirement notice, and a 2026-11-06 test of a tagless link opened an empty cart. PA-API 5 was retired in 2026. The Creators API needs an approved Associates account with recent sales, and I found no cart endpoint in it. Grocery pays about 1% (unverified). Since 2026-04-14, Amazon pays only on the exact ASIN variant linked. Same-day perishables reach 2,300+ cities. Prime gets free delivery over $25. Non-Prime pays $12.99. Skip for now.

## Target / Shipt, Albertsons, H-E-B and regional grocers

- **Target Partners (Impact):** 1 to 8% by category, but grocery may be excluded (unverified). Product links only, no cart link. I found no Shipt affiliate program or API.
- **Albertsons / Safeway:** no public cart API or official affiliate. Its 2026 Safeway shopping app inside ChatGPT is a direct partnership with OpenAI.
- **H-E-B:** nothing found.
- **Reaching these stores:** they come through Instacart or the aggregators below.

## Recipe-to-cart aggregators

| Aggregator | Status | Retailers | Fit for a pooled basket | Money for us |
| --- | --- | --- | --- | --- |
| SideChef | Active. Sells to brands and retailers | 1,300+ claimed, including Walmart, Kroger, Amazon Fresh, Target, Instacart. "95% of US households" | One recipe per click on its button. Multi-recipe not stated. Fills a real retailer cart | Pricing by demo. Publisher revenue share not stated |
| Chicory | Active. Free for publishers | 70+ retailers | One recipe at a time | Contextual ads plus retailer affiliate, net-60 |
| Whisk / Samsung Food | Consumer app. No public API found | Had Kroger, Walmart and others. Now mainly Instacart (fridge deal, January 2025) | No | None found |
| Innit | Retailer integrations reported 2018 to 2020 (Walmart, Kroger, Target, H-E-B, Safeway, Wegmans) | Current status unverified | Unverified | Unverified |
| Cooklist | Consumer app that links loyalty accounts (Kroger, Walmart, Safeway, Wegmans and 75 more) | n/a | No public API | None |

SideChef is the one to contact if we want H-E-B, Publix or Albertsons without Instacart. Ask whether it takes a pooled multi-recipe list and what it charges.

## Open questions

1. Walmart: does the add-to-cart URL with `storeId` fill a pickup grocery cart? Can we get access to the Recipes or Bundle APIs? What does grocery pay? Does the Affiliate API return per-store prices, and will Walmart allow showing them next to Kroger's?
2. Kroger: quota increases, whether delivered orders keep in-store prices, and whether a partnership allows store price comparison and longer price caching.
3. Instacart: can the shopping list page be limited to no-markup retailers? Does "total cart value" include fees? Can a partner get store prices or preselect a retailer?
4. SideChef: multi-recipe support, cost, and which retailers fill a real cart.
5. Measure drift: once live, compare our estimate with the user's reported checkout total per grocer.

## Sources

Instacart
- Developer Platform: https://docs.instacart.com/developer_platform_api/
- Get started (30 to 40 days): https://docs.instacart.com/developer_platform_api/get_started/overview
- Create shopping list page: https://docs.instacart.com/developer_platform_api/api/products/create_shopping_list_page
- Shopping list concept: https://docs.instacart.com/developer_platform_api/guide/concepts/shopping_list
- Pre-launch checklist: https://docs.instacart.com/developer_platform_api/guide/concepts/launch_activities/pre-launch_checklist
- Approval process: https://docs.instacart.com/developer_platform_api/guide/concepts/launch_activities/approval_process
- Conversions and payments: https://docs.instacart.com/developer_platform_api/guide/concepts/launch_activities/conversions_and_payments
- Developer terms: https://docs.instacart.com/developer_platform_api/guide/terms_and_policies/developer_terms
- FAQ (merchant choice): https://docs.instacart.com/developer_platform_api/faq
- Create recipe page: https://docs.instacart.com/developer_platform_api/api/products/create_recipe_page
- Get nearby retailers: https://docs.instacart.com/developer_platform_api/api/retailers/get_nearby_retailers
- Affiliate program (5% developer rate): https://company.instacart.com/affiliate
- No-markup retailers, 2026-09-24: https://company.instacart.com/updates/more-of-your-favorite-grocers-now-have-no-markups-on-instacart
- Same, trade press: https://theshelbyreport.com/2026/09/24/more-grocers-add-no-markup-pricing-on-instacart/
- Costco markup test: https://20somethingfinance.com/costco-in-store-vs-costco-same-day-vs-costco-instacart-prices/
- Markup estimates (third party): https://www.ridester.com/are-instacart-prices-higher/
- Fees (third party): https://www.moneylion.com/learn/personal-finance/basics/is-instacart-worth-it-instacart-plus
- FTC $60M settlement: https://www.aljazeera.com/news/2025/12/18/instacart-settles-federal-trade-commissions-claim-it-deceived-us-shoppers
- Pricing probe and end of tests: https://www.techspot.com/news/110654-instacart-doesnt-manipulate-prices-using-ai-but-ftc.html
- Groundwork report and FTC: https://groundworkcollaborative.org/news/following-groundworks-bombshell-report-ftc-opens-investigation-into-instacart-price-experimentation/
- Coverage, 98%: https://assets.contentstack.io/v3/assets/blta100b44b847ff4ca/blt944da72e5712ddc5/6a0c6c2debf71f2e93116226/Instacart_Federal_1_Pager_2026.pdf

Kroger
- Terms of Service: https://developer.kroger.com/terms
- Acceptable Use (no price comparison): https://developer.kroger.com/documentation/public/getting-started/acceptable-use
- Branding Guidelines (logos, monetization): https://developer.kroger.com/documentation/public/getting-started/branding
- Products API (price per location, 10,000 a day): https://developer.kroger.com/api-products/api/product-api-public
- Cart API (5,000 a day): https://developer.kroger.com/documentation/api-products/public/cart/overview
- Pickup FAQ (same prices, coupons): https://www.kroger.com/topic/clicklist
- Pickup fee (third party): https://www.thetakeout.com/1939429/kroger-curbside-pickup-fee/
- Ocado closures, delivery partners: https://www.esmmagazine.com/technology/kroger-to-close-three-ocado-cfcs-strengthens-partnership-with-instacart-doordash-uber-eats-300529
- kroger-api (scopes, limits): https://github.com/CupOfOwls/kroger-api
- kroger-mcp (add-only, Partner API): https://github.com/CupOfOwls/kroger-mcp
- Store count: https://www.foxbusiness.com/retail/major-supermarket-chain-closes-least-39-stores-nationwide-overhaul-takes-shape.amp
- Affiliate (third party): https://www.flexoffers.com/affiliate-programs/kroger-affiliate-program
- Whisk and Kroger: https://whisk.com/blog/whisk-partners-with-kroger/

Walmart
- Add to Cart service: https://walmart.io/docs/atc/v1/add-to-cart
- API Terms of Use (affiliate, 5,000 a day): https://walmart.io/termsandcondition
- API License Agreement (Marketplace and Supplier): https://developer.walmart.com/us-marketplace/page/terms-and-conditions
- APIs list (Recipes, Bundle): https://walmart.io/apirefservices
- No consumer checkout API (third party, July 2026): https://vorplabs.com/agent-tools/walmart-marketplace-api
- Terms on pickup pricing (tracker, May 2026): https://conductatlas.com/platform/walmart/walmart-terms-of-use/provision/CA-P-016691/pickup-pricing-matches-store-not-other-retailers/
- Affiliate FAQ: https://affiliates.walmart.com/faqs
- Grocery commission (third party): https://blog.affilytics.io/blog/walmart-affiliate-program/
- Fees (third party): https://www.thepricer.org/how-much-does-walmart-grocery-delivery-cost/
- SideChef and Walmart: https://www.sidechef.com/business/client-project/walmart-recipe-ideas
- Prepear Walmart integration: https://help.prepear.com/hc/en-us/articles/360042827392-Get-your-groceries-delivered-with-Prepear-s-shopping-integration
- eMeals grocery partners: https://emeals.com/grocery-delivery-pickup/
- Walmart drops OpenAI checkout: https://thepaypers.com/payments/news/walmart-drops-openai-checkout-and-deploys-sparky-on-ai-platforms

Amazon
- PA-API retirement: https://affiliate-program.amazon.com/creatorsapi/docs/en-us/paapiv5-deprecation
- Operating agreement changes: https://affiliate-program.amazon.com/help/operating/compare
- Cart link test, 2026-11-06: https://github.com/todd450/go-bag/issues/94
- Same-day perishables: https://www.aboutamazon.com/md/news/retail/amazon-same-day-fresh-grocery-delivery-united-states

Others
- SideChef shoppable button: https://business.sidechef.com/recipe-platform/shoppable-recipe-button
- Chicory for food bloggers: https://chicory.co/chicory-for-food-bloggers
- Innit retailers (2019): https://www.businesswire.com/news/home/20190409005384/en/Innit-Unveils-Personalized-Shoppable-Recipes
- Cooklist App Store: https://apps.apple.com/us/app/id1352600944
- Samsung and Instacart: https://techradar.com/computing/artificial-intelligence/samsungs-ai-fridge-will-soon-order-your-groceries-right-from-instacart
- Target affiliate (third party): https://loudcrowd.com/blog/target-affiliate-program-how-it-works/
- Albertsons Safeway in ChatGPT: https://www.grocerydive.com/news/albertsons-ai-safeway-plugin-chatgpt-technology/827147/

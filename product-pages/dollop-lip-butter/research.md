# Dollop lip butter: research notes

Source listing: AliExpress item 1005009003621619, "Lip Balm Moisturizing Mirror Lip Gloss Lip Vanilla Pink Sugar Coffee Cake Smell Lipstick Transparent Oil Makeup" (£0.99 sale price, £5.35 list). The listing page is blocked from this environment, so everything below comes from the supplied photos and from public sources about the product it copies.

## What the product is

| Question | Finding | Source |
|---|---|---|
| What is it? | A copy of the Summer Fridays Lip Butter Balm: 15 g / 0.5 oz soft squeeze tube with a ribbed crimped end, white twist-off cap and rounded applicator. The supplied photos show the Summer Fridays wordmark printed on every tube. | Supplied photos; eBay listings of the genuine product |
| Size | Not published for the tube itself. The genuine product's box is 4.96 × 0.94 × 0.94 in (12.6 × 2.4 cm), so the tube is shorter than 12.6 cm and no wider than about 2.4 cm. In the supplier photos, length to flat-end width is about 4.5 : 1, which puts the tube at roughly 10.5 × 2.3 cm. **Measure a real sample and update `CONFIG.size` before launch.** | eBay product data; measurements from supplier photos 2, 3 and 5 |
| Shades in the photos | Iced Coffee (terracotta), Poppy (coral), Birthday Cake (pearly pale pink), Pink Sugar (bright pink), Vanilla (cream), Vanilla Beige, Brown Sugar | Supplied photos; Sephora UK and Revolve shade lists |
| Original formula (reference only) | Dimer dilinoleate esters, polybutene, shea butter, murumuru butter, waxes, sodium hyaluronate, vanillin, tocopherol, mica, iron oxides | Skinsort INCI listing for the genuine product |
| Known complaints | It can feel sticky or tacky, and some find it overhyped | Thingtesting reviews; Summer Study and Really Ree reviews |
| Counterfeit risk | Which? found about two-thirds of branded beauty items bought on marketplaces were likely fake. Counterfeit lip products have tested far above lead limits (EcoWaste Coalition: up to 36,200 ppm against a 20 ppm limit). | Which? via Retail Gazette; EcoWaste Coalition; Securing Industry |

## Decisions this changed on the page

- **Own brand and own trade dress.** The tubes in the photos carry another company's trademark, so the page uses an original brand, **dollop**, set as a lowercase grotesk wordmark. The tube label avoids the source tube's look: no tracked uppercase wordmark, no bilingual block, and the print is tone on tone. None of the supplier photos appear on the page.
- **Name and shades are generic and colour-led.** The product is "Tinted Lip Balm" (not "Lip Butter Balm"). The shades are Rose, Bare, Caramel and Peach, described by tint and by the scents the listing names: candyfloss, vanilla, coffee and vanilla cake. Every tube's print is tone on tone, and none has a pearl finish, so the line-up doesn't echo the original's get-up.
- **Every product image is rendered from one 3D model.** The live tube, the four shade stills and the swatches all come from that model, built to the photo proportions. The swatches are labelled as illustrations, because nobody has photographed the real balm on skin yet.
- **No claims that can't be backed.** No hydrating, shea, hyaluronic, vegan, cruelty-free, SPF or "non-toxic" claims. The copy sticks to what the listing and photos show: 15 g squeeze tube, twist-off cap, sheer tint, glossy finish, dessert scents.
- **Honest FAQ.** It can feel slightly tacky, softens in heat, isn't edible, has no SPF, should be patch tested and needs a wiped tip. These are what reviewers complain about, plus the real risks of a scented lip product.
- **Pricing that follows UK rules.** "Any three for £30" is described as "Save £6 vs buying separately", worked out from `CONFIG`. There's no struck-through reference price. The delivery fee for small orders is stated up front (`CONFIG.deliveryFee`, set to £2.99 as a placeholder).
- **Returns copy matches consumer law.** It offers 14 days to cancel, and a refund for faulty or not-as-described tubes within 30 days, opened or not. There's no hygiene exception, because nothing shows the tubes are sealed.
- **Nothing invented on the pack.** The back print is plain usage text. It has no LOT code, no barcode and no open-jar symbol until the real artwork exists. "Prices include VAT" is gone until VAT status is known.
- **No reviews and no star ratings** until there are real ones.

## Before this goes live

1. Source an unbranded or own-label version of the tube. Selling tubes printed with the Summer Fridays mark is selling counterfeits (in the UK, an offence under s.92 of the Trade Marks Act 1994), whatever the page says.
2. UK cosmetics rules apply: a UK Responsible Person, a Cosmetic Product Safety Report for each shade, and notification on the SCPN portal before sale.
3. In `CONFIG` at the top of the page script:
   - `size`: the measured length and width of the tube.
   - `shopifyDomain` and `variantIds`: these switch Checkout to a real Shopify cart link. The any-three price also needs a matching automatic discount in Shopify, or a code in `discountCode`.
   - `deliveryFee`: your real UK delivery charge under the free threshold.
   - `trader`: business name, geographic address and contact email. UK online sellers must show these.
4. Paste the supplier's full INCI list into the Ingredients accordion (there's a TODO comment in `index.html`).
5. Check the prices, the delivery threshold and the returns policy against what you actually offer.
6. Check each shade's tube colour and tint against a real sample, then edit `SHADES` if needed.
7. Clear the name: run a UKIPO class 3 search for DOLLOP and similar marks before printing anything. A US mark, DOLLUP BEAUTY, covers lip balm.
8. If the tubes are sealed, you may add a hygiene exception to the returns copy. Otherwise keep it as it is.
9. Replace the rendered swatches with real photos once you have samples.

## Sources

- https://skinsort.com/products/summer-fridays/lip-butter-balm-315782be-485f-4298-9387-f10406fc3cf1/iced-coffee
- https://reallyree.com/summer-fridays-lip-butter-balm-review/
- https://thesummerstudy.com/summer-fridays-lip-butter-balm-review/
- https://www.ebay.com/p/9051755503
- https://www.sephora.co.uk/p/Summer-Fridays-LIP-BUTTER-BALM-TOASTED-MARSHMALLOW-30G
- https://www.revolve.com/v/summer-fridays-lip-butter-balm
- https://thingtesting.com/brands/summer-fridays/reviews?p=3
- https://www.retailgazette.co.uk/?p=190673
- https://www.ecowastecoalition.org/watchdog-warns-consumers-against-fake/
- https://securingindustry.com/cosmetics-and-personal-care/fake-mac-mariah-carey-lipsticks-laced-with-lead-/s106/a14102

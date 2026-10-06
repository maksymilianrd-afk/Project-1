# Ocean Drive LED neon sign: research notes

Supplier listing: Alibaba 1601893462639, "GTA Vice City Neon Light Double-sided E-sports Game Decor Rockstarstyle Glowing Letters logo GTA-themed Illuminated Sign". Alibaba, AliExpress, eBay and Etsy pages were blocked from this environment, so the findings below come from search results and the five listing photos.

## What the product is

| Question | Finding | Used on the page as |
|---|---|---|
| What is it? | A 300 × 300 × 35 mm sign with a UV-printed acrylic panel (night beach, palms, skyline), LED flex around the frame, and a white R + star outlined in Ø8 mm silicone LED flex. Runs on 5 V USB, 6 W max, with a 4-step inline dimmer (100/66/33/off) and a 5.5 × 2.1 mm DC input. | Hero, anatomy, dimmer readouts |
| Same product elsewhere? | Yes. The same 30 × 30 cm sign is sold on Etsy in pink, red and yellow frame versions for about $80–100, and on eBay/Shopify stores for $59.99. | Price placeholder ($69), two frame colours |
| What does "double-sided" mean? | Other sellers say it "glows on both sides" and can hang as a pendant. The kit includes a chain, which fits. Nobody shows the back. | Mounting section, worded as "listed as double-sided", plus "ask us for a photo of the back" |
| How does it fail? | Typical USB neon complaints: dimmers failing, cracked acrylic in transit, visible LED dots on cheap flex, PVC yellowing in sunlight. Silicone flex is the better material. | "Read this first" notes; the visible LED dots are called out next to the real photo |
| Famous original / brand? | The R + star is Rockstar Games' logo. Take-Two enforces it hard, even objecting to other brands using the letter R (Remedy dispute) and the word "Rockstar". | Product renamed **Ocean Drive**. No Rockstar, GTA or Vice City wording in names or headlines. Unofficial disclaimer in "Read this first" and the footer |
| Timing | GTA VI launches 19 November 2026 (Take-Two confirmed, no further delay). | A quiet "T–44 days" counter in the header. No claims of association |
| Size reference | A 12" LP sleeve is 314 mm; A4 is 297 mm tall; a 27" 16:9 screen is about 598 × 336 mm. | True-size section |

## Things to confirm with the supplier before selling

1. **The spec sheet looks AI-generated.** Image 4 has generator prompt text printed on it ("NO Chinese characters", "KEYPLAN (Full Proof)"). Its render shows an orange sunset print and "6000K cool white", but the real photos show a purple night print with red or amber edge light. Treat every figure as unverified until a unit is measured.
2. Does 300 × 300 mm include the clear acrylic margin, or just the frame?
3. What does the back look like (the "double-sided" claim)?
4. Are red and amber separate variants, or one switchable unit? Is pink available?
5. Is a USB wall plug included? (The page says no.)
6. Lead length (2 m total per spec) and whether the dimmer remembers its level.
7. Certifications (CE / FCC / UKCA) and lead time.

## Placeholders on the page

- Price: **$69.00**. Change it in `src/index.html` (hero button and buy card).
- The cart is front-end only (count and toast). It still needs connecting to checkout.
- Supplier photos are the two lit photos with the marketplace UI cropped off. Images 3–5 (renders) are not used.

## Sources

- Identical listings, colours and price range: https://www.etsy.com/market/vice_city_neon_sign, https://www.etsy.com/market/vice_city_neon, https://gleamlayer.com/products/gta-vice-city-logo-led-light-sign, https://www.ebay.com/itm/376891870813
- UV printing on neon backboards: https://www.radikalneonsigns.com/blog/why-led-neon-signs-have-acrylic-backboards/, https://electric-confetti.helpscoutdocs.com/article/75-what-is-uv-printing
- LED neon complaints: https://ie.trustpilot.com/review/www.neonfilter.com?page=6, https://au.trustpilot.com/review/marvellousneon.com
- Take-Two trademark enforcement: https://www.thesixthaxis.com/?p=389804, https://mp1st.com/news/remedy-logo-facing-trademark-dispute-from-rockstar-games-parent-take-two-interactive
- GTA VI date: https://www.pcworld.com/article/3052217/gta-6s-release-date-confirmed-for-real-this-time-seriously.html

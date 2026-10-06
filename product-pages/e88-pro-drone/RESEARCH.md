# E88 Pro folding drone: research notes

Done before any design work, per the product-page guide (§1). Checked 6 October 2026.
The Alibaba listing itself (`Hot-Selling E88 Pro Mini Outdoor…`, id 1601240365949) could not be
fetched from the build environment, so these facts come from other sellers of the same
mould, manuals, teardowns and reviews.

## 1. What it is, exactly

| Question | Finding | Source |
|---|---|---|
| Product | Generic "E88 Pro" foldable quadcopter. Dozens of sellers use the same factory model code. The user's photo 1 shows a "P1-DRONE" print; photo 2 a "Drone Pro" print with a blue LED. Same mould, different batches. | Seller listings below |
| Size | Folded 12.5 × 8 × 5.5 cm; unfolded about 25 × 20 × 5.5 cm | Amazon UK listing B0F5QT9DVV (via search) |
| Weight | Listed 92 g; one measurement 104 g with battery, arms folded. Sellers say "under 250 g". | Amazon UK / US listings (via search) |
| Motors | 816-size coreless brushed motors (brushless is the separate "E88 Max") | Amazon UK listing; othoba.com E88 Max listing |
| Battery | 3.7 V LiPo, sold as 1800 mAh. One reviewer estimates real capacity 800–1200 mAh. | firstquadcopter.com E88 review |
| Flight time | Sellers: 10–15 min. Reviewer measured 7–12 min per battery. | firstquadcopter.com E88 review |
| Charge time | About 60 min over USB | Flipkart / xboom listings |
| Camera | Sold as "4K". Reviewer: native VGA, upscaled. Front camera tilts 90° from the remote. | firstquadcopter.com; manuals.plus E88 Pro manuals |
| Range | Sellers: 100–150 m. Owners: Wi-Fi video is line-of-sight only and drops well before that. | shopsavvy.com E88 Pro review summary |
| Electronics | Teardowns found an STM32F103-class MCU, MPU-6050 6-axis IMU, barometer for altitude hold, Wi-Fi camera module. Parts vary by batch. | circuitdigest.com, digikey.com (Maker.io), dev.to teardowns |
| Remote | 2.4 GHz, Mode 2, runs on 3 × AA (some sources say AAA), not included. Phone clip. | manuals.plus; circuitdigest teardown |

## 2. How it behaves and fails

- Drifts. No GPS, no optical flow on the basic E88 Pro. It cannot hold position in a breeze. (shopsavvy summary)
- "One-key return" is headless-based. It flies back along the take-off heading. It does not use GPS. (manuals)
- Auto-stop if it tilts past 45°. (manuals.plus)
- Emergency stop: long-press the flip button. Motors cut. (manuals.plus)
- Pairing: power on, left stick up then down, lights go steady. Calibration: sticks into the bottom corners, lights flash fast then go steady. Some leaflets say both sticks bottom-right. (manuals.plus, AliExpress wiki)
- Obstacle avoidance appears only on some batches. Owners say it doesn't work as advertised. (shopsavvy summary)
- Props are the first thing to break. Spare props and arms for E88/E88 Pro/E99 are widely sold. (wald.de and other spare-part listings)

## 3. Claims we do not make

| Listing claim | Why it's out |
|---|---|
| "4K camera" | Reviewer found VGA-class native resolution. The page says "for seeing where you're going". |
| "15 min flight" | Measured 7–12 min. The page uses 7–12. |
| "150 m range" | Video drops long before. The page says to fly by sight. |
| "Avoids obstacles" (user photo 2) | Batch-dependent and unreliable. The page says "don't count on it". |
| "MSRP $299.99" (user photo 2) | Fake anchor price. Not used. |
| "Return home" | Not GPS. The page explains what it really does. |
| Customer reviews | None exist for this store. No reviews are shown. |

## 4. Rules (as of October 2026)

- **US (FAA):** recreational flyers must pass the free TRUST test and carry proof. Under 250 g flown for fun: no registration. 400 ft ceiling, visual line of sight. (uavcoach.com, thedroneu.com)
- **UK (CAA, from 1 Jan 2026):** 100 g or more needs a Flyer ID; 100 g or more with a camera also needs an Operator ID. This drone is right at 100 g, so the page tells UK buyers to weigh theirs. 120 m ceiling. (heliguy.com, techradar.com)
- **EU (EASA):** a sub-250 g drone with a camera needs operator registration unless it is certified as a toy under Directive 2009/48/EC. 120 m ceiling. (luftfartstilsynet.no FAQ, easa.europa.eu "A drone for Christmas?")

## 5. What the research changed on the page

- The hero sells the forgiving, cheap-to-crash beginner angle (prop guards, spares) and doesn't pretend it's a camera drone.
- A "Box vs. air" table sets the listing claims against what reviewers measured.
- The camera demo shows a simulated low-res live feed next to a sharp render.
- The flight sim has wind drift, no position hold, a Wi-Fi range fade, a 45°/emergency-stop cut and a 7–12 min battery, so people learn what the real thing does.
- The folding animation uses the real order (rear arms tuck under, front arms fold over) and the to-scale size comparison uses the real 12.5 × 8 × 5.5 cm.
- Rules section per country, with the UK 100 g line called out.

## Sources

- https://www.firstquadcopter.com/reviews/e88-drone-review/
- https://www.amazon.co.uk/E88-Pro-Foldable-Quadcopter-Duration/dp/B0F5QT9DVV
- https://www.amazon.com/Foldable-Quadcopter-Altitude-Positioning-batteries/dp/B0GJFMQX1X
- https://circuitdigest.com/review/everything-you-need-to-know-about-the-e88-drone-teardown
- https://www.digikey.com/en/maker/projects/e88-drone-teardown-inside-a-beginner-quadcopter/5da89562b98e4a1b81d0f15cce2bf43e
- https://manuals.plus/kbdfa/e88-pro-wifi-fpv-drone-manual
- https://shopsavvy.com/reviews-tldr/elecci-e88-pro-drone
- https://www.heliguy.com/blogs/posts/uk-drone-rules-2026-changes/
- https://www.techradar.com/cameras/drones/uk-drone-laws-have-just-changed-if-your-drone-has-a-camera-read-this-now
- https://uavcoach.com/drone-registration/drone-registration-hero
- https://luftfartstilsynet.no/en/drones/faq---drones---all/new-eu-regulations/which-rules-apply-for-drones-that-weigh-less-than-250-grams/
- https://www.easa.europa.eu/en/node/132566

# Grow Equipment Database Report

Last updated: 2026-04-01  
Sources: mars-hydro.com, acinfinity.com, biobizz.com, plagron.com, rootpouch.com, bluelab.com + hotchilli.cz, growmarket.cz, growshop.cz

---

## Summary

| Metric | Value |
|--------|-------|
| Total products | **114** |
| Real/scraped (isGenerated: false) | **89** |
| Generated/placeholder (isGenerated: true) | **25** |
| Products with images | **54** |
| All products have CZK prices | **114 / 114** ✓ |
| Categories covered | **22** |

---

## Failed / Blocked Sources

### Czech shops
| URL | Status | Reason |
|-----|--------|--------|
| jednadvacet.cz | Wrong site | Graphic designer's portfolio — not a grow shop |
| cannapot.com | Seeds only | No grow equipment sold |
| Firecrawl all URLs | Out of credits | Switched to WebFetch fallback |

### International (from previous scrape session)
| URL | Status |
|-----|--------|
| spider-farmer.com | 404 |
| gavita.com | Empty (JS-rendered) |
| lumatek-lighting.com | 403 |
| sunmaster.com | Empty |
| rhino-filters.co.uk | Empty |
| blumat.com | Timeout |
| biotabs.nl | 404 |
| htgsupply.com, hydroponics.net | JS-rendered, empty |
| growland.eu | Timeout |
| hanna-instruments.com | Empty |
| inkbird.com | JS-rendered |

---

## Category Breakdown

| Category | Count | Has Images | Real Prices | Notes |
|----------|-------|-----------|-------------|-------|
| light_led | 18 | 8 | 18 | Mars Hydro (6 real), AC Infinity, SunPro CZ (3), Lumatek/ViparSpectra CZ (4); 6 Spider Farmer still generated |
| light_hps | 5 | 3 | 5 | Lumatek ballasts + LUMii/Lumatek lamps — all real CZK prices from hotchilli.cz |
| light_cmh | 5 | 3 | 5 | Adjust-A-Wings kit + lamps + Lumatek ballasts — real CZK from hotchilli.cz |
| light_cfl | 2 | 0 | 2* | Envirogro — generated; no CZ shop sells Envirogro |
| light_t5 | 2 | 0 | 2* | Sunblaster — generated; no CZ shop carries them |
| exhaust_fan | 7 | 2 | 7 | AC Infinity (5 real USD), Vents + Prima Klima (CZ real) |
| circulation_fan | 5 | 3 | 5 | AC Infinity (3 real USD), GENT + Garden HighPro (CZ real) |
| carbon_filter | 7 | 5 | 7 | Rhino (updated CZK), Prima Klima CZ (real), Urban CZ (real), Can-Lite CZ (real) |
| medium_soil | 7 | 3 | 7 | Biobizz/Plagron (real CZK from hotchilli/growmarket), CANNA Terra CZ |
| medium_coco | 6 | 3 | 6 | Biobizz/Plagron/CANNA (real CZK), Atami CZ, U Gro CZ |
| medium_hydro | 2 | 0 | 2* | CANNA clay + Grodan rockwool — generated |
| fabric_pot | 8 | 6 | 8 | Root Pouch (images real), Dirt Bag CZ, Pure Pot CZ, AC Infinity CZ |
| airpot | 2 | 0 | 2* | Autopot + Air-Pot — generated (no CZ shop carries them) |
| watering_blumat | 3 | 0 | 3* | Blumat — generated (Czech shops don't stock Blumat) |
| watering_drip | 1 | 0 | 1* | FloraFlex drip ring — generated |
| nutrients_organic | 7 | 3 | 7 | Biobizz (real CZK + images), Plagron Alga (real), BioTabs (generated) |
| nutrients_mineral | 7 | 1 | 7 | Plagron A&B (real USD), CANNA Terra/Aqua (real CZK), CANNA Terra Flores CZ |
| ph_meter | 5 | 2 | 5 | Bluelab (real USD), Milwaukee (real CZK), Aqua Master Tools (real CZK) |
| ec_meter | 4 | 2 | 4 | Bluelab (real USD), Aqua Master Tools + Milwaukee (real CZK) |
| thermohygrometer | 7 | 5 | 7 | Garden HighPro + VIVOSUN + Urban (real CZK), Inkbird + AC Infinity + Govee updated |
| timer | 2 | 0 | 2* | Inkbird + BN-LINK — generated (no CZ shop stock found) |
| lst_tools | 2 | 0 | 2* | Generic wire ties + clips — generated |

*\* = price still estimated/generated*

---

## Products Still isGenerated: true (25 items — need manual filling)

| Product | Category | Issue |
|---------|----------|-------|
| Spider Farmer SF-600 | light_led | No Czech stock; 404 on international |
| Spider Farmer SF-1000 | light_led | No Czech stock |
| Spider Farmer SF-2000 | light_led | No Czech stock |
| Spider Farmer SF-3000 | light_led | No Czech stock |
| Spider Farmer SE-5000 | light_led | No Czech stock |
| Spider Farmer SF-4000 | light_led | No Czech stock |
| Envirogro CFL 125W | light_cfl | Not sold in CZ |
| Envirogro CFL 200W | light_cfl | Not sold in CZ |
| Sunblaster T5 HO 24W | light_t5 | Not sold in CZ |
| Sunblaster T5 HO 54W | light_t5 | Not sold in CZ |
| Plagron Bio Lightmix | medium_soil | Price updated, no image |
| CANNA Aqua Clay Pebbles | medium_hydro | No CZ price |
| Grodan Rockwool Slabs | medium_hydro | No CZ price |
| Autopot Easy2Grow Kit | airpot | Not stocked in CZ |
| Air-Pot 15L | airpot | Not stocked in CZ |
| Blumat Classic Starter Kit | watering_blumat | No CZ distributor found |
| Tropf-Blumat 12-Plant Kit | watering_blumat | No CZ distributor found |
| Blumat Junior 2-Pack | watering_blumat | No CZ distributor found |
| FloraFlex Drip Ring | watering_drip | Not sold in CZ |
| BioTabs Starter Pack | nutrients_organic | 404 on biotabs.nl |
| BioTabs Orgatrex | nutrients_organic | 404 on biotabs.nl |
| Biobizz CalMag | nutrients_mineral | No CZ price found |
| Inkbird IHC-200 Timer | timer | No CZ price found |
| BN-LINK Mechanical Timer | timer | No CZ price found |
| Soft Plant Wire Tie Set | lst_tools | Generic, no brand price |

---

## What Needs Manual Filling

### High Priority
1. **Spider Farmer images** — go to spider-farmer.com product pages, images for SF-1000/SF-2000/SF-4000 are well known
2. **Blumat distributor** — check blumat.com/de or Czech importer (try blumshop.de or growshop.cz search)
3. **CFL/T5 alternatives** — if Envirogro/Sunblaster not in CZ, replace with what Czech shops actually stock (e.g. LUMii CFL, Garden HighPro CFL)
4. **Timers** — find Czech-stocked digital/mechanical timer; try growmarket.cz/timers
5. **BioTabs** — correct URL is biotabs.nl/products-2/ or individual product pages

### Low Priority
6. Autopot / Air-Pot — try autopot.co.uk or Dutch distributors
7. Grodan rockwool — check growshop.cz directly for slabs
8. Spider Farmer — available on Amazon.de, check prices

---

## Seed Command

```bash
pnpm tsx scripts/seed-grow-equipment.ts
```

## Update from Czech shops

```bash
pnpm tsx scripts/update-grow-equipment-cz.ts && pnpm tsx scripts/seed-grow-equipment.ts
```

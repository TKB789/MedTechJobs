# Discovery — Stage 1: FDA company list

This folder contains the "discovery pipeline" that builds a list of US medical
device companies worth scraping. The output of stage 1 (`companies.csv`) is the
input for stage 2 (ATS detection — coming next).

## Why this exists

The career-site scraper (`scrapy_spider/`) only knows about ~26 hand-curated
companies. There are thousands of US medical device makers, and the smaller
ones are the ones whose jobs *don't* show up well on LinkedIn / Indeed. This
pipeline finds them.

## What stage 1 does

1. Downloads six pipe-separated text files from FDA's public download page
   (https://www.accessdata.fda.gov/premarket/ftparea/). Files are updated
   weekly. The download is cached in `fda_cache/` so re-runs are fast.
2. Joins the files: registration ↔ owner-operator ↔ establishment-type ↔
   device-listing.
3. Filters down to:
   - **US-based establishments** only (ISO country code = `US`).
   - Establishment type **Manufacture Medical Device** (5) or **Develop
     Specifications** (9). This excludes contract sterilizers, importers,
     repackagers, and similar.
   - Companies with **5 or more distinct device listings** — chosen as a
     proxy for "real product portfolio, not a one-off registrant".
4. Aggregates by **owner-operator number**, the FDA's strongest "same legal
   entity" key. This correctly folds Medtronic's 30+ facilities into a single
   "Medtronic" row.
5. Drops obvious non-companies (individual practitioners, dental labs,
   clinics, hospitals, pharmacies).
6. Writes `companies.csv`, sorted by device count.

## Run it

```
cd discovery
pip install -r requirements.txt
python fetch_fda_companies.py
```

First run takes ~1–2 minutes (mostly downloading). Subsequent runs are
~30 seconds because the ZIPs stay cached.

The output is `discovery/companies.csv` with columns:

```
name, state, primary_city, num_us_facilities, num_devices,
owner_op_number, sample_facility_address, source
```

Expect roughly **2,000–4,000 rows** with the 5-listings filter — these are
the real US medical device manufacturers. The top of the list will be
familiar (Medtronic, J&J, Stryker, Abbott…); the long tail is the
interesting part.

## What stage 1 does NOT do

- **No websites.** FDA only has registration-time addresses, not URLs. Stage 2
  will resolve websites by trying `<companyname>.com` and verifying.
- **No ATS detection.** Also stage 2.
- **No employee counts / funding data.** Out of scope.
- **No subsidiaries.** A company that registers under multiple owner-operator
  numbers (rare, but happens after acquisitions) will appear as multiple rows.
  Manual cleanup may be needed before feeding the list to the scraper.

## Adjusting the threshold

Edit `MIN_DEVICE_LISTINGS` at the top of `fetch_fda_companies.py`:
- `5` (default) → ~2,000–4,000 companies. Good balance.
- `1` → ~15,000+ companies. Includes every one-off registrant.
- `20` → only large established companies. Maybe 300–500.

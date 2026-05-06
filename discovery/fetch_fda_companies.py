"""
Stage 1: Discover US medical device companies via the openFDA API.

Why openFDA instead of bulk download
------------------------------------
FDA's bulk-download host (accessdata.fda.gov) blocks GitHub Actions IP ranges
with abuse-detection 404s. openFDA at api.fda.gov is purpose-built for
programmatic access, returns clean JSON, and exposes the same registration
data with the joins already done.

What this script does
---------------------
1. Pages through https://api.fda.gov/device/registrationlisting.json filtered
   to US establishments only.
2. Each record represents one establishment and includes:
     - firm_name + owner_operator.firm_name + owner_operator_number
     - establishment_type (a list — same establishment can be Mfr, SpecDev, etc.)
     - iso_country_code, state_code, city, address_1
     - products: [{ product_code, openfda: {device_name, ...} }, ...]
3. Filters to:
     - US country code
     - establishment_type containing "Manufacture Medical Device" OR
       "Develop Specifications But Do Not Manufacture At This Facility"
4. Aggregates by owner_operator_number (FDA's "same legal entity" key).
5. Drops obvious junk (individual practitioners, dental labs, clinics).
6. Filters to companies with >= MIN_DEVICE_LISTINGS distinct products.
7. Writes companies.csv sorted by device count.

Output schema
-------------
name, state, primary_city, num_us_facilities, num_devices,
owner_op_number, sample_facility_address, source
"""

from __future__ import annotations

import csv
import os
import re
import sys
import time
from collections import defaultdict
from pathlib import Path

import requests


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

API_BASE = "https://api.fda.gov/device/registrationlisting.json"

MIN_DEVICE_LISTINGS = 5

# These are the strings openFDA returns in establishment_type (verbatim from
# FDA's establishment-type lookup table).
QUALIFYING_ESTAB_TYPES = {
    "Manufacture Medical Device",
    "Develop Specifications But Do Not Manufacture At This Facility",
}

PAGE_SIZE  = 1000              # max allowed by openFDA
MAX_SKIP   = 25000             # openFDA cap on `skip`; beyond this we'd need search_after
PAGE_DELAY = 0.25              # be polite — well under the 240 req/min unauthenticated limit
TIMEOUT    = 30

OUTPUT_CSV = Path(__file__).parent / "companies.csv"

USER_AGENT = (
    "Mozilla/5.0 (compatible; MedTechLedgerBot/1.0; "
    "+https://github.com/tkb789/MedTechJobs)"
)


# ---------------------------------------------------------------------------
# openFDA paging
# ---------------------------------------------------------------------------

def fetch_page(session: requests.Session, skip: int) -> tuple[list[dict], int]:
    """Fetch one page. Returns (results, total). Empty results signals end."""
    params = {
        "search": 'iso_country_code:"US"',
        "limit":  PAGE_SIZE,
        "skip":   skip,
    }
    api_key = os.environ.get("OPENFDA_API_KEY", "").strip()
    if api_key:
        params["api_key"] = api_key

    r = session.get(API_BASE, params=params, timeout=TIMEOUT)
    if r.status_code == 404:
        # openFDA returns 404 with {"error": {"code": "NOT_FOUND"}} when skip
        # exceeds the result set. That's a normal end-of-data signal, not an error.
        try:
            err = r.json().get("error", {}).get("code")
            if err in ("NOT_FOUND", "OVER_RATE_LIMIT"):
                return [], 0
        except ValueError:
            pass
    r.raise_for_status()
    body = r.json()
    return body.get("results", []), body.get("meta", {}).get("results", {}).get("total", 0)


# ---------------------------------------------------------------------------
# Junk filter
# ---------------------------------------------------------------------------

JUNK_PATTERNS = [
    re.compile(r"\b(DDS|DMD|MD|DO|DPM|OD)\b", re.I),
    re.compile(r"\b(dental (lab|laboratory)|orthodontic lab)\b", re.I),
    re.compile(r"\b(hospital|clinic|medical center|medical centre)\b", re.I),
    re.compile(r"\bpharmacy\b", re.I),
    re.compile(r"\bveterinary\b", re.I),
    re.compile(r"\b(dr\.|doctor)\s", re.I),
]

def is_junk_name(name: str) -> bool:
    if not name or len(name) < 3:
        return True
    return any(p.search(name) for p in JUNK_PATTERNS)


# ---------------------------------------------------------------------------
# Aggregation
# ---------------------------------------------------------------------------

def main() -> int:
    started = time.time()

    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT, "Accept": "application/json"})

    print(f"Fetching from openFDA: {API_BASE}")
    print(f"Filter: iso_country_code = US")
    print(f"Page size: {PAGE_SIZE}, max skip: {MAX_SKIP}")
    print()

    by_oo: dict[str, dict] = defaultdict(lambda: {
        "firm_name":       "",
        "facility_count":  0,
        "device_keys":     set(),    # use product_code+device_name as device identity
        "states":          set(),
        "cities":          set(),
        "sample_address":  "",
    })

    skip = 0
    page_num = 0
    total_records = None
    qualifying_facilities = 0
    skipped_not_mfr = 0

    while skip < MAX_SKIP:
        page_num += 1
        try:
            results, total = fetch_page(session, skip)
        except requests.exceptions.HTTPError as e:
            print(f"⚠ openFDA error on page {page_num} (skip={skip}): {e}", file=sys.stderr)
            break
        except requests.RequestException as e:
            print(f"⚠ network error on page {page_num} (skip={skip}): {e}", file=sys.stderr)
            break

        if total_records is None and total:
            total_records = total
            print(f"Total US records reported by openFDA: {total_records:,}")
            print()

        if not results:
            print(f"  page {page_num}: no more results (skip={skip})")
            break

        added = 0
        for rec in results:
            estab_types = set(rec.get("establishment_type") or [])
            if not estab_types & QUALIFYING_ESTAB_TYPES:
                skipped_not_mfr += 1
                continue

            # owner_operator can be a dict or missing
            oo = rec.get("owner_operator") or {}
            oo_num = str(oo.get("owner_operator_number") or "").strip()
            if not oo_num:
                # Fall back to firm_number if owner_operator_number missing
                oo_num = str(rec.get("firm_number") or "").strip()
            if not oo_num:
                continue

            firm_name = (oo.get("firm_name") or rec.get("firm_name") or "").strip()
            bucket = by_oo[oo_num]
            if len(firm_name) > len(bucket["firm_name"]):
                bucket["firm_name"] = firm_name

            bucket["facility_count"] += 1
            qualifying_facilities += 1

            state = (rec.get("state_code") or "").strip()
            city  = (rec.get("city") or "").strip()
            if state: bucket["states"].add(state)
            if city:  bucket["cities"].add(city)

            if not bucket["sample_address"]:
                addr1 = (rec.get("address_1") or "").strip()
                zipc  = (rec.get("zip_code") or "").strip()
                pieces = [p for p in [addr1, city, state, zipc] if p]
                if pieces:
                    bucket["sample_address"] = ", ".join(pieces[:3]) + (f" {zipc}" if zipc else "")

            # Device identity: prefer product_code; fall back to device_name
            for prod in (rec.get("products") or []):
                code = (prod.get("product_code") or "").strip()
                openfda = prod.get("openfda") or {}
                names = openfda.get("device_name") or []
                if isinstance(names, list):
                    name_key = names[0] if names else ""
                else:
                    name_key = str(names)
                key = (code, name_key.strip().lower())
                if key != ("", ""):
                    bucket["device_keys"].add(key)

            added += 1

        print(f"  page {page_num}: skip={skip:>5}  results={len(results):>4}  qualifying={added:>4}")

        skip += len(results)
        if len(results) < PAGE_SIZE:
            break
        time.sleep(PAGE_DELAY)

    print()
    print(f"Pages fetched:                    {page_num}")
    print(f"Qualifying US facilities kept:    {qualifying_facilities:,}")
    print(f"Facilities skipped (not Mfr/SD):  {skipped_not_mfr:,}")
    print(f"Distinct owner-operators:         {len(by_oo):,}")

    # Filter + emit
    rows: list[dict] = []
    skipped_few = 0
    skipped_junk = 0
    for oo_num, b in by_oo.items():
        n_devices = len(b["device_keys"])
        if n_devices < MIN_DEVICE_LISTINGS:
            skipped_few += 1
            continue
        if is_junk_name(b["firm_name"]):
            skipped_junk += 1
            continue
        primary_city = (
            next(iter(b["cities"])) if len(b["cities"]) == 1
            else (max(b["cities"], key=len) if b["cities"] else "")
        )
        rows.append({
            "name":                    b["firm_name"],
            "state":                   ";".join(sorted(b["states"])) if b["states"] else "",
            "primary_city":            primary_city,
            "num_us_facilities":       b["facility_count"],
            "num_devices":             n_devices,
            "owner_op_number":         oo_num,
            "sample_facility_address": b["sample_address"],
            "source":                  "openfda_registrationlisting",
        })

    print(f"Dropped (< {MIN_DEVICE_LISTINGS} devices):           {skipped_few:,}")
    print(f"Dropped (junk name):              {skipped_junk:,}")
    print(f"Final company count:              {len(rows):,}")

    rows.sort(key=lambda r: (-r["num_devices"], r["name"]))

    print()
    print(f"Writing {OUTPUT_CSV}")
    with OUTPUT_CSV.open("w", encoding="utf-8", newline="") as f:
        fieldnames = ["name","state","primary_city","num_us_facilities","num_devices",
                      "owner_op_number","sample_facility_address","source"]
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)

    if rows:
        print()
        print("Top 20 by device count:")
        for r in rows[:20]:
            print(f"  {r['num_devices']:>4}  {r['name'][:60]:60s}  "
                  f"({r['num_us_facilities']} facility/ies, {r['state'] or '?'})")

    elapsed = time.time() - started
    print()
    print(f"✓ Wrote {len(rows):,} companies in {elapsed:.1f}s")
    print("  Next: stage 2 will resolve websites for each company.")
    return 0 if rows else 2


if __name__ == "__main__":
    sys.exit(main())

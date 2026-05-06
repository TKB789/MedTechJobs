"""
Stage 1: Discover US medical device companies from FDA's Establishment Registration & Listing data.

What this script does
---------------------
1. Downloads six pipe-separated ZIP files from FDA's public download page.
2. Joins them: Registration ↔ Owner_Operator ↔ Listing_Estabtypes ↔ Registration_Listing.
3. Filters to:
   • US-based establishments (ISO country code = 'US')
   • Establishment type 'Manufacture Medical Device' (5) or 'Develop Specifications' (9).
     These two types are real device makers; everything else (sterilizers, importers,
     repackagers, contract manufacturers for someone else's device) is excluded.
   • Companies with >= MIN_DEVICE_LISTINGS distinct device listings.
4. Aggregates by owner_operator_number — the FDA's "same legal entity" key. This
   correctly folds together "Medtronic Inc.", "Medtronic USA, Inc.", and the dozens
   of Medtronic facilities under one company.
5. Writes companies.csv with one row per company, sorted by device count.

Output schema
-------------
name, state, primary_city, num_us_facilities, num_devices, owner_op_number,
sample_facility_address, source

Run it
------
    python fetch_fda_companies.py
The script caches downloaded ZIPs in ./fda_cache/ so re-runs are fast.
The output is written to ./companies.csv next to this script.

This script does NOT find websites. That's stage 2 (enrich_websites.py).
"""

from __future__ import annotations

import csv
import io
import os
import re
import sys
import zipfile
from collections import defaultdict
from pathlib import Path
from typing import Iterator

import requests


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

MIN_DEVICE_LISTINGS = 5             # filter threshold
US_COUNTRY_CODE     = "US"          # ISO code FDA uses
MFR_ESTAB_TYPE_IDS  = {"5", "9"}    # 5 = Manufacture Medical Device
                                    # 9 = Develop Specifications But Do Not Manufacture

# FDA download page lists these. Files are updated every Sunday night.
FDA_BASE = "https://www.accessdata.fda.gov/premarket/ftparea"
FILES = {
    "registration":         f"{FDA_BASE}/Registration.zip",
    "owner_operator":       f"{FDA_BASE}/Owner_Operator.zip",
    "listing_estabtypes":   f"{FDA_BASE}/listing_estabtypes.zip",
    "registration_listing": f"{FDA_BASE}/registration_listing.zip",
    "estabtypes":           f"{FDA_BASE}/estabtypes.zip",
}

CACHE_DIR  = Path(__file__).parent / "fda_cache"
OUTPUT_CSV = Path(__file__).parent / "companies.csv"

USER_AGENT = (
    "Mozilla/5.0 (compatible; MedTechLedgerBot/1.0; "
    "+https://github.com/tkb789/MedTechJobs)"
)


# ---------------------------------------------------------------------------
# Download + extract helpers
# ---------------------------------------------------------------------------

def download_zip(url: str, dest: Path) -> Path:
    """Download a ZIP if we don't already have a cached copy."""
    if dest.exists():
        print(f"  cached: {dest.name}")
        return dest
    print(f"  downloading: {url}")
    r = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=120, stream=True)
    r.raise_for_status()
    dest.write_bytes(r.content)
    print(f"            wrote {dest.stat().st_size:,} bytes")
    return dest


def read_pipe_file(zip_path: Path) -> Iterator[list[str]]:
    """Yield rows from the .txt file inside a FDA ZIP. Files are pipe-separated.

    FDA files use Windows-1252 encoding and sometimes have ragged rows. We're
    forgiving: anything that fails to parse is skipped with a warning, not raised.
    """
    with zipfile.ZipFile(zip_path) as zf:
        # Each FDA ZIP contains exactly one .txt file
        names = [n for n in zf.namelist() if n.lower().endswith(".txt")]
        if not names:
            raise RuntimeError(f"No .txt file inside {zip_path.name}")
        with zf.open(names[0]) as raw:
            text = io.TextIOWrapper(raw, encoding="cp1252", errors="replace", newline="")
            for line in text:
                line = line.rstrip("\r\n")
                if not line:
                    continue
                yield line.split("|")


# ---------------------------------------------------------------------------
# Loaders for each FDA file
# ---------------------------------------------------------------------------

def load_registrations(path: Path) -> dict[str, dict]:
    """
    Schema (from FDA):
      Registration key | Registration number | Status id | Initial importer flag |
      Expiry year | Address type id | Name | Address1 | Address2 | City |
      State id | ISO country code | Zip | Postal

    Returns: { reg_key: {name, city, state, country, address1, address2} }
    """
    out: dict[str, dict] = {}
    rows_seen = 0
    for r in read_pipe_file(path):
        rows_seen += 1
        if len(r) < 12:
            continue
        reg_key = r[0].strip()
        if not reg_key:
            continue
        out[reg_key] = {
            "name":      (r[6] or "").strip(),
            "address1":  (r[7] or "").strip(),
            "address2":  (r[8] or "").strip(),
            "city":      (r[9] or "").strip(),
            "state_id":  (r[10] or "").strip(),
            "country":   (r[11] or "").strip().upper(),
        }
    print(f"  registrations loaded: {len(out):,} / {rows_seen:,} rows")
    return out


def load_owner_operators(path: Path) -> dict[str, tuple[str, str]]:
    """
    Schema:
      Registration Key | Contact ID | Firm Name | Owner Operator Number

    Returns: { reg_key: (firm_name, owner_op_number) }
    """
    out: dict[str, tuple[str, str]] = {}
    for r in read_pipe_file(path):
        if len(r) < 4:
            continue
        reg_key = r[0].strip()
        firm    = (r[2] or "").strip()
        oo_num  = (r[3] or "").strip()
        if reg_key and oo_num:
            out[reg_key] = (firm, oo_num)
    print(f"  owner-operators linked: {len(out):,}")
    return out


def load_listing_estabtypes(path: Path) -> set[str]:
    """
    Schema:
      Registration Key | Registration listing Id | Establishment Type Id

    Returns set of registration keys that have at least one establishment
    type in MFR_ESTAB_TYPE_IDS (Manufacturer / Specification Developer).
    """
    qualifying: set[str] = set()
    rows = 0
    for r in read_pipe_file(path):
        rows += 1
        if len(r) < 3:
            continue
        reg_key      = r[0].strip()
        estab_type   = r[2].strip()
        if estab_type in MFR_ESTAB_TYPE_IDS and reg_key:
            qualifying.add(reg_key)
    print(f"  registrations classified Mfr/SpecDev: {len(qualifying):,} / {rows:,} listing-types")
    return qualifying


def load_registration_listings(path: Path) -> dict[str, set[str]]:
    """
    Schema:
      Registration listing id | Registration key | File ID | Premarket Submission Number

    Returns: { reg_key: {file_id, file_id, ...} }  (set of distinct devices per facility)
    """
    out: dict[str, set[str]] = defaultdict(set)
    for r in read_pipe_file(path):
        if len(r) < 3:
            continue
        reg_key = r[1].strip()
        file_id = r[2].strip()
        if reg_key and file_id:
            out[reg_key].add(file_id)
    print(f"  registrations with device listings: {len(out):,}")
    return out


# ---------------------------------------------------------------------------
# Junk filter — drop entities that aren't really device companies
# ---------------------------------------------------------------------------

JUNK_PATTERNS = [
    re.compile(r"\b(DDS|DMD|MD|DO|DPM|OD)\b", re.I),                   # individual practitioners
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
# Main pipeline
# ---------------------------------------------------------------------------

def main() -> int:
    CACHE_DIR.mkdir(exist_ok=True)

    print("Step 1: Downloading FDA files (cached after first run)")
    paths = {}
    for key, url in FILES.items():
        paths[key] = download_zip(url, CACHE_DIR / Path(url).name)

    print("\nStep 2: Loading establishment registrations")
    registrations = load_registrations(paths["registration"])

    print("\nStep 3: Loading owner-operator linkage")
    owner_ops = load_owner_operators(paths["owner_operator"])

    print("\nStep 4: Identifying Manufacturer / Specification Developer establishments")
    qualifying = load_listing_estabtypes(paths["listing_estabtypes"])

    print("\nStep 5: Counting device listings per establishment")
    listings = load_registration_listings(paths["registration_listing"])

    print("\nStep 6: Aggregating by owner-operator (= legal company)")

    # Per-company aggregation
    by_oo: dict[str, dict] = defaultdict(lambda: {
        "firm_name":         "",
        "facility_count":    0,
        "device_ids":        set(),
        "states":            set(),
        "cities":            set(),
        "us_facilities":     0,
        "sample_address":    "",
    })

    skipped_non_us = 0
    skipped_not_mfr = 0
    skipped_no_owner = 0
    total_us_mfr_facilities = 0

    for reg_key, reg in registrations.items():
        # Filter 1: must be a manufacturer or spec developer
        if reg_key not in qualifying:
            skipped_not_mfr += 1
            continue
        # Filter 2: must be US
        if reg["country"] != US_COUNTRY_CODE:
            skipped_non_us += 1
            continue
        # Filter 3: must have an owner-operator linkage
        if reg_key not in owner_ops:
            skipped_no_owner += 1
            continue

        firm_name, oo_num = owner_ops[reg_key]
        bucket = by_oo[oo_num]

        # Prefer the longest firm name we see — usually the most descriptive.
        if len(firm_name) > len(bucket["firm_name"]):
            bucket["firm_name"] = firm_name

        bucket["facility_count"] += 1
        bucket["us_facilities"]  += 1
        if reg["state_id"]: bucket["states"].add(reg["state_id"])
        if reg["city"]:     bucket["cities"].add(reg["city"])
        if not bucket["sample_address"] and reg["address1"]:
            bucket["sample_address"] = (
                f"{reg['address1']}, {reg['city']}, {reg['state_id']} {reg.get('zip','')}"
            ).strip(", ")

        for fid in listings.get(reg_key, ()):
            bucket["device_ids"].add(fid)
        total_us_mfr_facilities += 1

    print(f"  US Mfr/SpecDev facilities included: {total_us_mfr_facilities:,}")
    print(f"  skipped (not Mfr/SpecDev):          {skipped_not_mfr:,}")
    print(f"  skipped (non-US):                   {skipped_non_us:,}")
    print(f"  skipped (no owner-operator):        {skipped_no_owner:,}")
    print(f"  distinct companies aggregated:       {len(by_oo):,}")

    print(f"\nStep 7: Filtering to companies with >= {MIN_DEVICE_LISTINGS} device listings"
          f" and dropping non-company entities")

    rows: list[dict] = []
    skipped_few_devices = 0
    skipped_junk = 0

    for oo_num, b in by_oo.items():
        n_devices = len(b["device_ids"])
        if n_devices < MIN_DEVICE_LISTINGS:
            skipped_few_devices += 1
            continue
        if is_junk_name(b["firm_name"]):
            skipped_junk += 1
            continue

        primary_city = next(iter(b["cities"]), "") if len(b["cities"]) == 1 \
                       else (max(b["cities"], key=len) if b["cities"] else "")

        rows.append({
            "name":                     b["firm_name"],
            "state":                    ";".join(sorted(b["states"])) if b["states"] else "",
            "primary_city":             primary_city,
            "num_us_facilities":        b["us_facilities"],
            "num_devices":              n_devices,
            "owner_op_number":          oo_num,
            "sample_facility_address":  b["sample_address"],
            "source":                   "fda_establishment_registration",
        })

    print(f"  dropped (< {MIN_DEVICE_LISTINGS} devices):  {skipped_few_devices:,}")
    print(f"  dropped (looks like an individual/clinic): {skipped_junk:,}")
    print(f"  final company count: {len(rows):,}")

    # Sort: largest companies first
    rows.sort(key=lambda r: (-r["num_devices"], r["name"]))

    print(f"\nStep 8: Writing {OUTPUT_CSV}")
    with OUTPUT_CSV.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()) if rows else [
            "name","state","primary_city","num_us_facilities","num_devices",
            "owner_op_number","sample_facility_address","source"
        ])
        w.writeheader()
        w.writerows(rows)

    if rows:
        print("\nTop 20 by device count:")
        for r in rows[:20]:
            print(f"  {r['num_devices']:>4}  {r['name'][:60]:60s}  "
                  f"({r['num_us_facilities']} facility/ies, {r['state'] or '?'})")

    print(f"\n✓ Wrote {len(rows):,} companies to {OUTPUT_CSV}")
    print("  Next: run enrich_websites.py to attach websites to each company.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

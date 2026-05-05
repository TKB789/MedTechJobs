"""
Medical Device Jobs Scraper — API edition.

Hits Workday's CXS endpoint and Eightfold's SmartApply endpoint directly.
No HTML scraping, no JS rendering, no XPath. Just JSON in, JSON out.

Adding a new company:
  - If they're on Workday, find their tenant + site from the careers URL
    (e.g. https://stryker.wd1.myworkdayjobs.com/StrykerCareers
     -> tenant="stryker", wd_pod="wd1", site="StrykerCareers") and add a row to
    WORKDAY_COMPANIES.
  - If they're on Eightfold (URL looks like https://<slug>.eightfold.ai/careers),
    add the slug + the company's primary domain to EIGHTFOLD_COMPANIES.
"""

from __future__ import annotations

import json
import os
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Iterable

import requests


# ---------------------------------------------------------------------------
# Config — verified careers platforms for major medical-device companies.
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class WorkdayTarget:
    company: str       # display name
    tenant: str        # e.g. "stryker"
    wd_pod: str        # e.g. "wd1", "wd5"
    site: str          # e.g. "StrykerCareers"


@dataclass(frozen=True)
class EightfoldTarget:
    company: str       # display name
    slug: str          # subdomain on eightfold.ai
    domain: str        # company's primary domain, used as ?domain= param


# Verified URLs as of May 2026.
WORKDAY_COMPANIES: list[WorkdayTarget] = [
    WorkdayTarget("Medtronic",            "medtronic", "wd1", "MedtronicCareers"),
    WorkdayTarget("Stryker",              "stryker",   "wd1", "StrykerCareers"),
    WorkdayTarget("Edwards Lifesciences", "edwards",   "wd5", "edwardscareers"),
    WorkdayTarget("Abbott",               "abbott",    "wd5", "abbottcareers"),
    WorkdayTarget("ResMed",               "resmed",    "wd3", "ResMed_External_Careers"),
]

EIGHTFOLD_COMPANIES: list[EightfoldTarget] = [
    EightfoldTarget("Boston Scientific", "bostonscientific", "bostonscientific.com"),
]


# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------

USER_AGENT = (
    "Mozilla/5.0 (compatible; MedTechLedgerBot/1.0; "
    "+https://github.com/tkb789/MedTechJobs)"
)

REQUEST_TIMEOUT = 25         # seconds
PAGE_DELAY      = 0.6        # seconds between paginated calls per company
COMPANY_DELAY   = 1.5        # seconds between companies


def _session() -> requests.Session:
    s = requests.Session()
    s.headers.update({
        "User-Agent":   USER_AGENT,
        "Accept":       "application/json",
        "Content-Type": "application/json",
    })
    return s


# ---------------------------------------------------------------------------
# Workday CXS
#
# POST https://<tenant>.<pod>.myworkdayjobs.com/wday/cxs/<tenant>/<site>/jobs
# Body: {"appliedFacets": {}, "limit": N, "offset": M, "searchText": ""}
# Response: { total: int, jobPostings: [ {title, locationsText, postedOn,
#                                        externalPath, timeType, bulletFields} ] }
# ---------------------------------------------------------------------------

WORKDAY_PAGE_SIZE = 20
WORKDAY_MAX_JOBS_PER_COMPANY = 200   # safety cap so a giant tenant can't dominate


def fetch_workday(session: requests.Session, target: WorkdayTarget) -> list[dict]:
    base = f"https://{target.tenant}.{target.wd_pod}.myworkdayjobs.com"
    api  = f"{base}/wday/cxs/{target.tenant}/{target.site}/jobs"
    site_url = f"{base}/{target.site}"

    out: list[dict] = []
    offset = 0
    total: int | None = None

    while True:
        body = {
            "appliedFacets": {},
            "limit":      WORKDAY_PAGE_SIZE,
            "offset":     offset,
            "searchText": "",
        }
        try:
            r = session.post(api, json=body, timeout=REQUEST_TIMEOUT,
                             headers={"Referer": site_url})
        except requests.RequestException as e:
            print(f"  ⚠ {target.company}: network error at offset {offset}: {e}",
                  file=sys.stderr)
            break

        if r.status_code != 200:
            print(f"  ⚠ {target.company}: HTTP {r.status_code} at offset {offset}",
                  file=sys.stderr)
            break

        try:
            data = r.json()
        except ValueError:
            print(f"  ⚠ {target.company}: non-JSON response at offset {offset}",
                  file=sys.stderr)
            break

        postings = data.get("jobPostings") or []
        if total is None:
            total = data.get("total")

        for p in postings:
            ext = p.get("externalPath", "")
            if ext and not ext.startswith("/"):
                ext = "/" + ext
            out.append({
                "company_name": target.company,
                "company_id":   target.tenant,
                "job_title":    (p.get("title") or "").strip(),
                "job_link":     site_url + ext if ext else site_url,
                "location":     (p.get("locationsText") or "Not specified").strip(),
                "department":   "Not specified",   # Workday doesn't expose this in CXS
                "jobType":      (p.get("timeType") or "Not specified").strip(),
                "posting_date": (p.get("postedOn") or "").strip(),
                "scraped_date": datetime.now(timezone.utc).isoformat(),
                "source":       "workday",
            })

        if not postings:
            break
        offset += len(postings)
        if total is not None and offset >= total:
            break
        if offset >= WORKDAY_MAX_JOBS_PER_COMPANY:
            break
        time.sleep(PAGE_DELAY)

    return out


# ---------------------------------------------------------------------------
# Eightfold SmartApply
#
# GET https://<slug>.eightfold.ai/api/apply/v2/jobs?domain=<domain>&start=<n>&num=<m>
# Response: { count: int, positions: [ {id, name, location, department,
#                                       t_create, canonicalPositionUrl, ...} ] }
# ---------------------------------------------------------------------------

EIGHTFOLD_PAGE_SIZE = 25
EIGHTFOLD_MAX_JOBS_PER_COMPANY = 200


def fetch_eightfold(session: requests.Session, target: EightfoldTarget) -> list[dict]:
    base = f"https://{target.slug}.eightfold.ai"
    api  = f"{base}/api/apply/v2/jobs"

    out: list[dict] = []
    start = 0
    seen_ids: set[str] = set()

    while True:
        params = {
            "domain": target.domain,
            "start":  start,
            "num":    EIGHTFOLD_PAGE_SIZE,
            "hl":     "en",
        }
        try:
            r = session.get(api, params=params, timeout=REQUEST_TIMEOUT,
                            headers={"Referer": f"{base}/careers"})
        except requests.RequestException as e:
            print(f"  ⚠ {target.company}: network error at start {start}: {e}",
                  file=sys.stderr)
            break

        if r.status_code != 200:
            print(f"  ⚠ {target.company}: HTTP {r.status_code} at start {start}",
                  file=sys.stderr)
            break

        try:
            data = r.json()
        except ValueError:
            print(f"  ⚠ {target.company}: non-JSON response at start {start}",
                  file=sys.stderr)
            break

        positions = data.get("positions") or []
        if not positions:
            break

        new_in_page = 0
        for p in positions:
            pid = str(p.get("id") or "")
            if pid and pid in seen_ids:    # Eightfold sometimes loops; bail if it does
                continue
            if pid:
                seen_ids.add(pid)
            new_in_page += 1

            link = p.get("canonicalPositionUrl") or (
                f"{base}/careers/job/{pid}?domain={target.domain}" if pid else f"{base}/careers"
            )

            # Eightfold gives a unix timestamp in t_create; some tenants use seconds, some ms.
            posted_iso = ""
            t_create = p.get("t_create")
            if isinstance(t_create, (int, float)) and t_create > 0:
                ts = t_create / 1000.0 if t_create > 10_000_000_000 else t_create
                try:
                    posted_iso = datetime.fromtimestamp(ts, tz=timezone.utc).date().isoformat()
                except (OverflowError, OSError, ValueError):
                    posted_iso = ""

            out.append({
                "company_name": target.company,
                "company_id":   target.slug,
                "job_title":    (p.get("name") or "").strip(),
                "job_link":     link,
                "location":     (p.get("location") or "Not specified").strip(),
                "department":   (p.get("department") or "Not specified").strip(),
                "jobType":      (p.get("employment_type")
                                 or p.get("position_type")
                                 or "Not specified").strip(),
                "posting_date": posted_iso,
                "scraped_date": datetime.now(timezone.utc).isoformat(),
                "source":       "eightfold",
            })

        if new_in_page == 0:
            break
        start += len(positions)
        if start >= EIGHTFOLD_MAX_JOBS_PER_COMPANY:
            break
        total = data.get("count")
        if isinstance(total, int) and start >= total:
            break
        time.sleep(PAGE_DELAY)

    return out


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

def all_targets() -> Iterable[tuple[str, object]]:
    for w in WORKDAY_COMPANIES:
        yield "workday", w
    for e in EIGHTFOLD_COMPANIES:
        yield "eightfold", e


def run() -> int:
    started = datetime.now(timezone.utc)
    print("=" * 70)
    print("MedTech Ledger — Job Scraper")
    print(f"Started:    {started.isoformat()}")
    print(f"Targets:    {len(WORKDAY_COMPANIES)} Workday + "
          f"{len(EIGHTFOLD_COMPANIES)} Eightfold = "
          f"{len(WORKDAY_COMPANIES) + len(EIGHTFOLD_COMPANIES)} total")
    print("=" * 70)

    session = _session()
    all_jobs: list[dict] = []
    per_company: list[tuple[str, int]] = []

    for kind, target in all_targets():
        company = target.company  # type: ignore[attr-defined]
        print(f"→ {company:30s} ({kind})", end=" ", flush=True)

        try:
            if kind == "workday":
                jobs = fetch_workday(session, target)  # type: ignore[arg-type]
            else:
                jobs = fetch_eightfold(session, target)  # type: ignore[arg-type]
        except Exception as e:           # noqa: BLE001 — never let one site kill the run
            print(f"FAILED ({type(e).__name__}: {e})")
            per_company.append((company, 0))
            continue

        # Drop empty-title rows defensively
        jobs = [j for j in jobs if j.get("job_title")]
        all_jobs.extend(jobs)
        per_company.append((company, len(jobs)))
        print(f"{len(jobs):>4} jobs")
        time.sleep(COMPANY_DELAY)

    # Sort: most recent first, then by company
    def sort_key(j: dict):
        return (j.get("posting_date") or "", j.get("company_name") or "")
    all_jobs.sort(key=sort_key, reverse=True)

    finished = datetime.now(timezone.utc)
    print("=" * 70)
    print("Per-company results:")
    for name, n in per_company:
        print(f"  {name:30s} {n:>4}")
    print("-" * 70)
    print(f"Total jobs:  {len(all_jobs)}")
    print(f"Finished:    {finished.isoformat()}")
    print(f"Duration:    {(finished - started).total_seconds():.1f}s")
    print("=" * 70)

    # Always write a file, even if empty, so downstream steps have something
    # deterministic to find.
    timestamp = started.strftime("%Y%m%d_%H%M%S")
    out_path = f"medical_device_jobs_{timestamp}.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(all_jobs, f, indent=2, ensure_ascii=False)
    print(f"Wrote: {out_path} ({os.path.getsize(out_path):,} bytes)")

    # Non-zero exit if every single source failed — surfaces issues in CI
    # without blocking partial-success runs.
    if all(n == 0 for _, n in per_company) and per_company:
        print("ERROR: every source returned zero jobs", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(run())

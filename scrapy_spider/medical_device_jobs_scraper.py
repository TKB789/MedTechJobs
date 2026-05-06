"""
Medical Device Jobs Scraper — API edition.

Hits public ATS APIs directly: Workday CXS, Eightfold SmartApply, Greenhouse.
No HTML scraping, no JS rendering. JSON in, JSON out.

Adding a new company:
  • Workday   → from a URL like https://stryker.wd1.myworkdayjobs.com/StrykerCareers
                add WorkdayTarget("Stryker", "stryker", "wd1", "StrykerCareers").
  • Eightfold → from https://<slug>.eightfold.ai/careers, find the ?domain=
                query param and add EightfoldTarget("…", slug, domain).
  • Greenhouse→ from https://boards.greenhouse.io/<board>, add
                GreenhouseTarget("…", board).
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
# Targets — verified URLs as of May 2026.
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class WorkdayTarget:
    company: str
    tenant: str
    wd_pod: str
    site: str


@dataclass(frozen=True)
class EightfoldTarget:
    company: str
    slug: str
    domain: str


@dataclass(frozen=True)
class GreenhouseTarget:
    company: str
    board: str   # the slug used in https://boards-api.greenhouse.io/v1/boards/<board>/jobs


WORKDAY_COMPANIES: list[WorkdayTarget] = [
    # Top-tier multinationals
    WorkdayTarget("Medtronic",            "medtronic",      "wd1", "MedtronicCareers"),
    WorkdayTarget("Johnson & Johnson",    "jj",             "wd5", "JJ"),
    WorkdayTarget("Abbott",               "abbott",         "wd5", "abbottcareers"),
    WorkdayTarget("Stryker",              "stryker",        "wd1", "StrykerCareers"),
    WorkdayTarget("Edwards Lifesciences", "edwards",        "wd5", "edwardscareers"),
    WorkdayTarget("Becton Dickinson",     "bdx",            "wd1", "EXTERNAL_CAREER_SITE_USA"),
    WorkdayTarget("Baxter International", "baxter",         "wd1", "baxter"),
    WorkdayTarget("GE Healthcare",        "gehc",           "wd5", "GEHC_ExternalSite"),
    WorkdayTarget("Danaher",              "danaher",        "wd1", "DanaherJobs"),
    WorkdayTarget("Cardinal Health",      "cardinalhealth", "wd1", "EXT"),
    WorkdayTarget("ResMed",               "resmed",         "wd3", "ResMed_External_Careers"),

    # Specialty medtech
    WorkdayTarget("Smith+Nephew",         "smithnephew",    "wd5", "External"),
    WorkdayTarget("Henry Schein",         "henryschein",    "wd1", "External_Careers"),
    WorkdayTarget("Integra LifeSciences", "integralife",    "wd1", "Careers"),
    WorkdayTarget("LivaNova",             "livanova",       "wd5", "Search"),
    WorkdayTarget("Globus Medical",       "globusmedical",  "wd5", "GMED_Careers"),
    WorkdayTarget("Varian",               "varian",         "wd5", "varianexternal"),
    WorkdayTarget("Bioventus",            "osv-bioventus",  "wd5", "External"),

    # Diabetes & monitoring
    WorkdayTarget("Dexcom",               "dexcom",         "wd1", "Dexcom"),
    WorkdayTarget("Insulet",              "insulet",        "wd5", "insuletcareers"),
    WorkdayTarget("Tandem Diabetes Care", "tandemdiabetes", "wd12", "tandemdiabetes"),
]

EIGHTFOLD_COMPANIES: list[EightfoldTarget] = [
    EightfoldTarget("Boston Scientific", "bostonscientific", "bostonscientific.com"),
]

GREENHOUSE_COMPANIES: list[GreenhouseTarget] = [
    # Smaller / newer medtech that use Greenhouse
    GreenhouseTarget("Butterfly Network", "butterflynetwork"),
    GreenhouseTarget("Verily",            "verily"),
    GreenhouseTarget("AcuityMD",          "acuitymd"),
    GreenhouseTarget("Greenlight Guru",   "greenlightguru"),
]


# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------

USER_AGENT = (
    "Mozilla/5.0 (compatible; MedTechLedgerBot/1.0; "
    "+https://github.com/tkb789/MedTechJobs)"
)

REQUEST_TIMEOUT = 25
PAGE_DELAY      = 0.4
COMPANY_DELAY   = 1.2

WORKDAY_PAGE_SIZE              = 20
WORKDAY_MAX_JOBS_PER_COMPANY   = 300
EIGHTFOLD_PAGE_SIZE            = 25
EIGHTFOLD_MAX_JOBS_PER_COMPANY = 300
GREENHOUSE_MAX_JOBS_PER_COMPANY = 500


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
# ---------------------------------------------------------------------------

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
                "department":   "Not specified",
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
# ---------------------------------------------------------------------------

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
            if pid and pid in seen_ids:
                continue
            if pid:
                seen_ids.add(pid)
            new_in_page += 1

            link = p.get("canonicalPositionUrl") or (
                f"{base}/careers/job/{pid}?domain={target.domain}" if pid else f"{base}/careers"
            )

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
# Greenhouse public boards
#
# GET https://boards-api.greenhouse.io/v1/boards/<board>/jobs?content=true
# Returns ALL jobs in one response — no pagination needed.
# ---------------------------------------------------------------------------

def fetch_greenhouse(session: requests.Session, target: GreenhouseTarget) -> list[dict]:
    api = f"https://boards-api.greenhouse.io/v1/boards/{target.board}/jobs"
    try:
        r = session.get(api, timeout=REQUEST_TIMEOUT)
    except requests.RequestException as e:
        print(f"  ⚠ {target.company}: network error: {e}", file=sys.stderr)
        return []

    if r.status_code != 200:
        print(f"  ⚠ {target.company}: HTTP {r.status_code}", file=sys.stderr)
        return []

    try:
        data = r.json()
    except ValueError:
        print(f"  ⚠ {target.company}: non-JSON response", file=sys.stderr)
        return []

    out: list[dict] = []
    for j in (data.get("jobs") or [])[:GREENHOUSE_MAX_JOBS_PER_COMPANY]:
        # Department info is nested under a list
        depts = j.get("departments") or []
        dept_name = depts[0].get("name") if depts and isinstance(depts[0], dict) else "Not specified"

        # Greenhouse posts updated_at as an ISO string
        posted = (j.get("updated_at") or j.get("first_published") or "")[:10]

        loc = (j.get("location") or {}).get("name") or "Not specified"

        out.append({
            "company_name": target.company,
            "company_id":   target.board,
            "job_title":    (j.get("title") or "").strip(),
            "job_link":     j.get("absolute_url") or "",
            "location":     loc.strip(),
            "department":   (dept_name or "Not specified").strip(),
            "jobType":      "Not specified",   # Greenhouse public API doesn't expose this
            "posting_date": posted,
            "scraped_date": datetime.now(timezone.utc).isoformat(),
            "source":       "greenhouse",
        })
    return out


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

def all_targets() -> Iterable[tuple[str, object]]:
    for w in WORKDAY_COMPANIES:    yield "workday",    w
    for e in EIGHTFOLD_COMPANIES:  yield "eightfold",  e
    for g in GREENHOUSE_COMPANIES: yield "greenhouse", g


def run() -> int:
    started = datetime.now(timezone.utc)
    print("=" * 70)
    print("MedTech Ledger — Job Scraper")
    print(f"Started:    {started.isoformat()}")
    print(f"Targets:    {len(WORKDAY_COMPANIES)} Workday + "
          f"{len(EIGHTFOLD_COMPANIES)} Eightfold + "
          f"{len(GREENHOUSE_COMPANIES)} Greenhouse = "
          f"{len(WORKDAY_COMPANIES) + len(EIGHTFOLD_COMPANIES) + len(GREENHOUSE_COMPANIES)} total")
    print("=" * 70)

    session = _session()
    all_jobs: list[dict] = []
    per_company: list[tuple[str, int]] = []

    for kind, target in all_targets():
        company = target.company  # type: ignore[attr-defined]
        print(f"→ {company:32s} ({kind:10s})", end=" ", flush=True)

        try:
            if kind == "workday":
                jobs = fetch_workday(session, target)      # type: ignore[arg-type]
            elif kind == "eightfold":
                jobs = fetch_eightfold(session, target)    # type: ignore[arg-type]
            else:
                jobs = fetch_greenhouse(session, target)   # type: ignore[arg-type]
        except Exception as e:                             # noqa: BLE001
            print(f"FAILED ({type(e).__name__}: {e})")
            per_company.append((company, 0))
            continue

        jobs = [j for j in jobs if j.get("job_title")]
        all_jobs.extend(jobs)
        per_company.append((company, len(jobs)))
        print(f"{len(jobs):>4} jobs")
        time.sleep(COMPANY_DELAY)

    def sort_key(j: dict):
        return (j.get("posting_date") or "", j.get("company_name") or "")
    all_jobs.sort(key=sort_key, reverse=True)

    finished = datetime.now(timezone.utc)
    print("=" * 70)
    print("Per-company results:")
    for name, n in per_company:
        marker = "  " if n > 0 else "❌"
        print(f"  {marker} {name:32s} {n:>5}")
    print("-" * 70)
    print(f"Total jobs:  {len(all_jobs):,}")
    print(f"Companies with results: "
          f"{sum(1 for _, n in per_company if n > 0)}/{len(per_company)}")
    print(f"Finished:    {finished.isoformat()}")
    print(f"Duration:    {(finished - started).total_seconds():.1f}s")
    print("=" * 70)

    timestamp = started.strftime("%Y%m%d_%H%M%S")
    out_path = f"medical_device_jobs_{timestamp}.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(all_jobs, f, indent=2, ensure_ascii=False)
    print(f"Wrote: {out_path} ({os.path.getsize(out_path):,} bytes)")

    if all(n == 0 for _, n in per_company) and per_company:
        print("ERROR: every source returned zero jobs", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(run())

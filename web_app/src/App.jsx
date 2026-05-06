import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, Bookmark, MapPin, Briefcase, Building2,
  Calendar, X, Download, ArrowUpRight, Layers
} from 'lucide-react';

/* ----------------------------------------------------------------- */
/*  Demo fallback data — used only if no real JSON file is found.    */
/* ----------------------------------------------------------------- */
const demoJobs = [
  { id: 1, title: 'Senior Software Engineer — Implantables', company: 'Medtronic',          location: 'Minneapolis, MN',  department: 'Engineering', jobType: 'Full-time', postedDate: '2026-05-04' },
  { id: 2, title: 'Biomedical Engineer',                       company: 'Boston Scientific', location: 'Boston, MA',       department: 'R&D',         jobType: 'Full-time', postedDate: '2026-05-03' },
  { id: 3, title: 'Quality Assurance Manager',                 company: 'Abbott',            location: 'Abbott Park, IL',  department: 'Quality',     jobType: 'Full-time', postedDate: '2026-05-02' },
  { id: 4, title: 'Product Manager — Surgical',                company: 'Johnson & Johnson', location: 'New Brunswick, NJ',department: 'Product',     jobType: 'Full-time', postedDate: '2026-05-01' },
  { id: 5, title: 'Clinical Affairs Specialist',               company: 'Stryker',           location: 'Kalamazoo, MI',    department: 'Clinical',    jobType: 'Full-time', postedDate: '2026-04-30' },
  { id: 6, title: 'Regulatory Affairs Lead',                   company: 'Edwards Lifesciences',location: 'Irvine, CA',     department: 'Regulatory',  jobType: 'Full-time', postedDate: '2026-04-29' },
];

/* ----------------------------------------------------------------- */
/*  Helpers                                                          */
/* ----------------------------------------------------------------- */
function classNames(...xs) { return xs.filter(Boolean).join(' '); }

function formatDate(d) {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return d; }
}

function daysAgo(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  const diff = Math.floor((Date.now() - dt.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return 'today';
  if (diff === 1) return '1 day ago';
  return `${diff} days ago`;
}

// US states + 2-letter codes for detecting US locations that don't say "USA".
const US_STATE_NAMES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware',
  'Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky',
  'Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi',
  'Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico',
  'New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania',
  'Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming','District of Columbia',
];
const US_STATE_CODES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY',
  'LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND',
  'OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

// Patterns for non-US countries we commonly see in medtech postings.
// Each entry maps a regex tested against the raw location string to a country name.
const COUNTRY_PATTERNS = [
  [/\b(USA|U\.S\.A\.|U\.S\.|United States|US-)/i, 'United States'],
  [/\b(United Kingdom|UK|England|Scotland|Wales|Northern Ireland)\b/i, 'United Kingdom'],
  [/\bIreland\b/i, 'Ireland'],
  [/\b(Germany|Deutschland)\b/i, 'Germany'],
  [/\bFrance\b/i, 'France'],
  [/\bSwitzerland\b/i, 'Switzerland'],
  [/\bNetherlands\b/i, 'Netherlands'],
  [/\bBelgium\b/i, 'Belgium'],
  [/\bItaly\b/i, 'Italy'],
  [/\bSpain\b/i, 'Spain'],
  [/\bSweden\b/i, 'Sweden'],
  [/\bDenmark\b/i, 'Denmark'],
  [/\bPoland\b/i, 'Poland'],
  [/\bCanada\b/i, 'Canada'],
  [/\bMexico\b/i, 'Mexico'],
  [/\b(Costa Rica)\b/i, 'Costa Rica'],
  [/\bBrazil\b/i, 'Brazil'],
  [/\b(China|Shanghai|Beijing|Shenzhen)\b/i, 'China'],
  [/\bJapan\b/i, 'Japan'],
  [/\b(Korea|Seoul)\b/i, 'South Korea'],
  [/\b(India|Bangalore|Bengaluru|Mumbai|Pune|Hyderabad|Gurgaon)\b/i, 'India'],
  [/\bSingapore\b/i, 'Singapore'],
  [/\bAustralia\b/i, 'Australia'],
  [/\bIsrael\b/i, 'Israel'],
];

/**
 * Best-effort country detection from a free-text location string.
 * Workday writes "USA - California - Irvine", Eightfold writes "Boston, MA, United States",
 * Greenhouse writes "Boston, MA". We try patterns first, then fall back to US-state
 * detection, then "Other" so nothing is dropped.
 */
function detectCountry(loc) {
  if (!loc) return 'Other';
  if (loc === 'Not specified') return 'Other';
  if (/^remote/i.test(loc.trim())) return 'Remote';

  for (const [re, name] of COUNTRY_PATTERNS) {
    if (re.test(loc)) return name;
  }

  // Fall back: if any US state name or 2-letter code appears as a token, call it US.
  for (const s of US_STATE_NAMES) {
    if (loc.includes(s)) return 'United States';
  }
  // Token-aware match for state codes so "MA" matches but "Mali" doesn't.
  const tokens = loc.split(/[\s,;:\-]+/);
  for (const t of tokens) {
    if (US_STATE_CODES.includes(t)) return 'United States';
  }

  return 'Other';
}

/* ----------------------------------------------------------------- */
/*  Main component                                                    */
/* ----------------------------------------------------------------- */
export default function MedicalDeviceJobSearch() {
  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('demo'); // 'demo' | 'real'
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    company: '', location: '', jobType: '', department: ''
  });
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'company' | 'title'

  /* ---- Load jobs ------------------------------------------------- */
  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true);

      // Respect GitHub Pages base path. Locally PUBLIC_URL is "".
      const base = (process.env.PUBLIC_URL || '').replace(/\/$/, '');

      // 1) Manifest, if present, lists the latest filename.
      // 2) Stable filename written by the workflow.
      // 3) Legacy path some early builds used.
      const candidates = [
        `${base}/jobs-manifest.json`,
        `${base}/medical_device_jobs.json`,
        `${base}/data/medical_device_jobs.json`,
      ];

      let loaded = null;

      for (const url of candidates) {
        try {
          const res = await fetch(url, { cache: 'no-store' });
          if (!res.ok) continue;
          const data = await res.json();

          // Manifest case: { latest: "medical_device_jobs_YYYYMMDD.json" }
          if (data && !Array.isArray(data) && data.latest) {
            const inner = await fetch(`${base}/${data.latest}`, { cache: 'no-store' });
            if (inner.ok) {
              const innerData = await inner.json();
              if (Array.isArray(innerData) && innerData.length) {
                loaded = innerData;
                break;
              }
            }
            continue;
          }

          if (Array.isArray(data) && data.length) {
            loaded = data;
            break;
          }
        } catch (_) { /* try the next candidate */ }
      }

      if (loaded) {
        setDataSource('real');
      } else {
        loaded = demoJobs;
        setDataSource('demo');
      }

      const normalized = loaded.map((job, i) => ({
        id:          job.id ?? i + 1,
        title:       job.title       || job.job_title    || 'Untitled role',
        company:     job.company     || job.company_name || 'Unknown',
        location:    job.location    || 'Not specified',
        department:  job.department  || 'Not specified',
        jobType:     job.jobType     || job.job_type     || 'Not specified',
        postedDate:  job.postedDate  || job.posting_date || null,
        job_link:    job.job_link    || job.url          || '',
      }));

      setJobs(normalized);
      setLoading(false);
    };

    loadJobs();
  }, []);

  /* ---- Derived lists -------------------------------------------- */
  const companies   = useMemo(() => [...new Set(jobs.map(j => j.company))].sort(),    [jobs]);
  const jobTypes    = useMemo(() => [...new Set(jobs.map(j => j.jobType))].sort(),    [jobs]);
  const departments = useMemo(() => [...new Set(jobs.map(j => j.department))].sort(), [jobs]);

  // Locations are grouped by country. Each option is either a string (a city)
  // or an object with kind:'group' (a country header). Country pseudo-options
  // are encoded as "country:United States" so the filter logic can detect them.
  const locationOptions = useMemo(() => {
    const byCountry = new Map();           // country -> Set(rawLocation)
    for (const j of jobs) {
      const raw = j.location || 'Not specified';
      const country = detectCountry(raw);
      if (!byCountry.has(country)) byCountry.set(country, new Set());
      byCountry.get(country).add(raw);
    }
    // Sort countries with USA first, then alphabetically
    const countries = [...byCountry.keys()].sort((a, b) => {
      if (a === 'United States') return -1;
      if (b === 'United States') return 1;
      if (a === 'Other')         return 1;
      if (b === 'Other')         return -1;
      return a.localeCompare(b);
    });

    const out = [];
    for (const c of countries) {
      const cities = [...byCountry.get(c)].sort();
      out.push({ kind: 'group', label: c });
      out.push({ value: `country:${c}`, label: `All of ${c} (${cities.length})` });
      for (const city of cities) out.push(city);
    }
    return out;
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    let result = jobs;

    if (searchTerm.trim()) {
      // Split on whitespace so "regulatory boston" finds Boston-based regulatory roles.
      const tokens = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);
      result = result.filter(j => {
        const haystack = [
          j.title, j.company, j.location,
          j.department, j.jobType
        ].join(' ').toLowerCase();
        return tokens.every(t => haystack.includes(t));
      });
    }
    if (filters.company) result = result.filter(j => j.company === filters.company);

    if (filters.location) {
      if (filters.location.startsWith('country:')) {
        const c = filters.location.slice('country:'.length);
        result = result.filter(j => detectCountry(j.location) === c);
      } else {
        result = result.filter(j =>
          j.location.toLowerCase().includes(filters.location.toLowerCase())
        );
      }
    }

    if (filters.jobType)    result = result.filter(j => j.jobType === filters.jobType);
    if (filters.department) result = result.filter(j => j.department === filters.department);

    const sorted = [...result];
    if (sortBy === 'newest') {
      sorted.sort((a, b) => new Date(b.postedDate || 0) - new Date(a.postedDate || 0));
    } else if (sortBy === 'company') {
      sorted.sort((a, b) => a.company.localeCompare(b.company));
    } else if (sortBy === 'title') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
    return sorted;
  }, [jobs, searchTerm, filters, sortBy]);

  const toggleSave = (id) =>
    setSavedJobs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const clearAll = () => {
    setSearchTerm('');
    setFilters({ company: '', location: '', jobType: '', department: '' });
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(filteredJobs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medtech-jobs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---- Loading screen ------------------------------------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-ink-50 bg-grain flex items-center justify-center">
        <div className="text-center">
          <div className="font-display italic text-ink-900 text-3xl mb-3">setting type…</div>
          <div className="rule mx-auto w-32 mb-3" />
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-500">
            Loading the latest issue
          </p>
        </div>
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  /* ---- Layout ---------------------------------------------------- */
  return (
    <div className="min-h-screen bg-ink-50 bg-grain text-ink-900">
      {/* ============== MASTHEAD ============== */}
      <header className="border-b-[3px] border-ink-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-6 pb-2">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.2em] text-ink-600">
            <span>Vol. I · No. {jobs.length.toString().padStart(3, '0')}</span>
            <span className="hidden sm:inline">{todayStr}</span>
            <span>
              {dataSource === 'real'
                ? <span className="text-sage">● Live data</span>
                : <span className="text-accent">● Demo issue</span>}
            </span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-8 pb-6">
          <h1 className="font-display font-medium leading-[0.85] tracking-tight text-ink-900
                         text-[58px] sm:text-[96px] md:text-[128px] lg:text-[152px]">
            <span className="italic font-light">The</span> MedTech{' '}
            <span className="italic font-light">Ledger</span>
          </h1>
          <div className="mt-3 flex items-end justify-between gap-4 flex-wrap">
            <p className="font-display italic text-ink-500 text-lg sm:text-xl max-w-xl">
              An editorial register of open positions at the world's medical-device makers —
              compiled, filtered, and faithfully updated.
            </p>
            <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink-500 sm:text-right">
              <div>Established 2026</div>
              <div>{savedJobs.length} saved · {filteredJobs.length} listed</div>
            </div>
          </div>
        </div>
      </header>

      {/* ============== CONTROL STRIP ============== */}
      <section className="border-b border-ink-900/15 bg-ink-50">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-end">
            {/* Search */}
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.25em] text-ink-500 mb-1.5">
                Search the ledger
              </label>
              <div className="relative flex items-end gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input
                    type="text"
                    placeholder="Title, company, location, department…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        document.getElementById('listings')
                          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className="w-full bg-transparent border-0 border-b border-ink-900 pl-7 pr-8 py-2.5
                               font-display text-2xl sm:text-3xl placeholder-ink-300
                               focus:outline-none focus:border-accent transition-colors"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-ink-400 hover:text-accent"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() =>
                    document.getElementById('listings')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                  className="shrink-0 px-4 py-2.5 bg-ink-900 text-ink-50 hover:bg-accent
                             transition-colors font-mono text-[11px] uppercase tracking-[0.2em]
                             flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" /> Search
                </button>
              </div>

              {/* Live status — visible immediately, no scrolling required */}
              {searchTerm.trim() && (
                <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-600">
                  {filteredJobs.length === 0 ? (
                    <span className="text-accent">
                      No matches for "<span className="normal-case tracking-normal font-display italic">{searchTerm}</span>"
                    </span>
                  ) : (
                    <span>
                      <span className="text-ink-900 font-semibold num-tabular">
                        {filteredJobs.length}
                      </span>{' '}
                      {filteredJobs.length === 1 ? 'match' : 'matches'} for "
                      <span className="normal-case tracking-normal font-display italic text-ink-900">
                        {searchTerm}
                      </span>"
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-ink-500">
              <span>Sort</span>
              {[
                { k: 'newest',  label: 'Newest' },
                { k: 'company', label: 'Company' },
                { k: 'title',   label: 'Title' },
              ].map(opt => (
                <button
                  key={opt.k}
                  onClick={() => setSortBy(opt.k)}
                  className={classNames(
                    'px-2 py-1 border transition-colors',
                    sortBy === opt.k
                      ? 'bg-ink-900 text-ink-50 border-ink-900'
                      : 'border-ink-300 hover:border-ink-900 text-ink-700'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3 mt-6">
            <Combobox
              label="Company"
              value={filters.company}
              onChange={(v) => setFilters({ ...filters, company: v })}
              options={companies}
            />
            <Combobox
              label="Location"
              value={filters.location}
              onChange={(v) => setFilters({ ...filters, location: v })}
              options={locationOptions}
            />
            <Combobox
              label="Type"
              value={filters.jobType}
              onChange={(v) => setFilters({ ...filters, jobType: v })}
              options={jobTypes}
            />
            <Combobox
              label="Department"
              value={filters.department}
              onChange={(v) => setFilters({ ...filters, department: v })}
              options={departments}
            />
          </div>

          {/* Action row */}
          <div className="flex items-center justify-between mt-5 pt-4 rule-soft text-[11px] font-mono uppercase tracking-[0.2em]">
            <div className="text-ink-600">
              <span className="num-tabular text-ink-900 font-semibold">{filteredJobs.length}</span>{' '}
              of {jobs.length} listings
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearAll}
                className="px-3 py-1.5 border border-ink-300 hover:border-ink-900 text-ink-700 hover:text-ink-900 transition-colors flex items-center gap-1.5"
              >
                <X className="w-3 h-3" /> Clear
              </button>
              <button
                onClick={handleExport}
                className="px-3 py-1.5 bg-ink-900 text-ink-50 hover:bg-accent transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3 h-3" /> Export
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============== LISTINGS ============== */}
      <main id="listings" className="max-w-7xl mx-auto px-5 sm:px-8 py-10 scroll-mt-4">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-20 sm:py-24">
            <div className="font-display italic text-4xl sm:text-5xl text-ink-400 mb-3">
              — nothing in print —
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink-500 mb-6">
              {searchTerm.trim()
                ? <>No listings match "<span className="normal-case tracking-normal font-display italic text-ink-700">{searchTerm}</span>"{Object.values(filters).some(Boolean) && ' with the current filters'}</>
                : 'No listings match the current filters'}
            </p>
            <button
              onClick={clearAll}
              className="px-4 py-2 border border-ink-900 hover:bg-ink-900 hover:text-ink-50 text-ink-900 transition-colors font-mono text-[11px] uppercase tracking-[0.2em] inline-flex items-center gap-1.5"
            >
              <X className="w-3 h-3" /> Clear search & filters
            </button>
          </div>
        ) : (
          <ol className="border-t border-ink-900">
            {filteredJobs.map((job, idx) => (
              <JobRow
                key={job.id}
                job={job}
                index={idx}
                isSaved={savedJobs.includes(job.id)}
                onToggleSave={() => toggleSave(job.id)}
                highlight={searchTerm}
              />
            ))}
          </ol>
        )}

        {/* Footer note */}
        <div className="mt-16 pt-6 border-t border-ink-900/20 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] font-mono uppercase tracking-[0.25em] text-ink-500">
          <div>
            <div className="text-ink-900 mb-1">Colophon</div>
            <p className="normal-case tracking-normal font-body text-sm text-ink-600 leading-relaxed">
              {dataSource === 'real'
                ? 'Listings are scraped daily at 02:00 UTC from the careers pages of the listed companies. We do not host applications; clicking a role opens the original posting.'
                : 'You are reading the demo issue. The scraper has not yet supplied a data file. Once it runs, real listings will replace these.'}
            </p>
          </div>
          <div className="sm:text-right">
            <div className="text-ink-900 mb-1">Saved roles</div>
            <p className="normal-case tracking-normal font-body text-sm text-ink-600 leading-relaxed">
              {savedJobs.length === 0
                ? 'Tap the bookmark beside a role to keep it in this session.'
                : `You have bookmarked ${savedJobs.length} role${savedJobs.length === 1 ? '' : 's'}. Bookmarks reset when the page is reloaded.`}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ----------------------------------------------------------------- */
/*  Subcomponents                                                    */
/* ----------------------------------------------------------------- */

function Combobox({ label, value, onChange, options, placeholder = 'All' }) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const ref               = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter(opt =>
      (typeof opt === 'string' ? opt : opt.label || '').toLowerCase().includes(q)
    );
  }, [options, query]);

  // For country: prefixed values, show a friendly label like "All of United States"
  // instead of the raw "country:United States".
  let display = value || '';
  if (display.startsWith('country:')) {
    display = `All of ${display.slice('country:'.length)}`;
  }
  const truncated = display.length > 32 ? display.slice(0, 32) + '…' : display;

  return (
    <div className="block" ref={ref}>
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-500 mb-1">
        {label}
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => { setOpen(o => !o); setQuery(''); }}
          className="w-full text-left bg-transparent border-0 border-b border-ink-900/40
                     py-1.5 pr-6 font-body text-sm text-ink-900 cursor-pointer
                     focus:outline-none focus:border-accent transition-colors
                     hover:border-ink-900 truncate"
        >
          {truncated || <span className="text-ink-400">{placeholder}</span>}
        </button>
        <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-ink-400 text-xs">
          ▾
        </span>

        {open && (
          <div className="absolute z-50 left-0 right-0 mt-1 bg-ink-50 border border-ink-900/30
                          shadow-soft max-h-72 overflow-hidden flex flex-col">
            <div className="p-2 border-b border-ink-900/10 bg-ink-100/40">
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type to filter…"
                className="w-full bg-transparent border-b border-ink-300 focus:border-accent
                           outline-none py-1 px-1 font-body text-sm placeholder-ink-400"
              />
            </div>
            <div className="overflow-y-auto flex-1">
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false); }}
                className={classNames(
                  'block w-full text-left px-3 py-2 font-body text-sm border-b border-ink-900/5',
                  value === ''
                    ? 'bg-ink-900 text-ink-50'
                    : 'hover:bg-ink-100 text-ink-900'
                )}
              >
                {placeholder}
              </button>
              {filtered.length === 0 ? (
                <div className="px-3 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-400">
                  No matches
                </div>
              ) : (
                filtered.map((opt) => {
                  if (typeof opt !== 'string' && opt.kind === 'group') {
                    return (
                      <div
                        key={'g:' + opt.label}
                        className="px-3 pt-3 pb-1 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-500 bg-ink-100/40 border-t border-ink-900/5 first:border-t-0"
                      >
                        {opt.label}
                      </div>
                    );
                  }
                  const v = typeof opt === 'string' ? opt : opt.value;
                  const l = typeof opt === 'string' ? opt : opt.label;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => { onChange(v); setOpen(false); }}
                      className={classNames(
                        'block w-full text-left px-3 py-1.5 font-body text-sm border-b border-ink-900/5',
                        value === v
                          ? 'bg-ink-900 text-ink-50'
                          : 'hover:bg-ink-100 text-ink-900'
                      )}
                    >
                      {l}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function highlightTerm(text, term) {
  if (!term || !term.trim() || !text) return text;
  const tokens = term.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return text;
  // Escape regex special chars in each token
  const escaped = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = String(text).split(re);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <mark key={i} className="bg-accent/20 text-ink-900 px-0.5 rounded-sm">{part}</mark>
      : <span key={i}>{part}</span>
  );
}

function JobRow({ job, index, isSaved, onToggleSave, highlight }) {
  const num = (index + 1).toString().padStart(3, '0');
  return (
    <li
      className="group border-b border-ink-900/15 hover:bg-ink-100/60 transition-colors animate-rise"
      style={{ animationDelay: `${Math.min(index, 12) * 25}ms` }}
    >
      <div className="grid grid-cols-[auto_1fr_auto] gap-4 sm:gap-8 px-1 py-6 sm:py-7 items-start">
        {/* Index number */}
        <div className="font-mono text-[11px] tracking-[0.2em] text-ink-400 pt-1 num-tabular">
          № {num}
        </div>

        {/* Body */}
        <div className="min-w-0">
          <div className="flex items-baseline gap-3 flex-wrap mb-1">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
              {highlightTerm(job.company, highlight)}
            </span>
            <span className="text-ink-300">·</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-500">
              {highlightTerm(job.department, highlight)}
            </span>
          </div>

          <h3 className="font-display text-2xl sm:text-3xl leading-tight text-ink-900 mb-3 max-w-3xl">
            {job.job_link ? (
              <a
                href={job.job_link}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline"
              >
                {highlightTerm(job.title, highlight)}
              </a>
            ) : highlightTerm(job.title, highlight)}
          </h3>

          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-ink-600">
            <Meta icon={MapPin}    text={job.location} />
            <Meta icon={Briefcase} text={job.jobType} />
            <Meta icon={Building2} text={job.company} />
            <Meta icon={Calendar}  text={`${formatDate(job.postedDate)}${daysAgo(job.postedDate) ? ' · ' + daysAgo(job.postedDate) : ''}`} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={onToggleSave}
            aria-label={isSaved ? 'Remove bookmark' : 'Save role'}
            className={classNames(
              'p-2 border transition-colors',
              isSaved
                ? 'bg-ink-900 border-ink-900 text-ink-50'
                : 'border-ink-300 text-ink-500 hover:border-ink-900 hover:text-ink-900'
            )}
          >
            <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
          </button>
          {job.job_link ? (
            <a
              href={job.job_link}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-900 hover:text-accent inline-flex items-center gap-1 whitespace-nowrap"
            >
              View role <ArrowUpRight className="w-3 h-3" />
            </a>
          ) : (
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-400 inline-flex items-center gap-1 whitespace-nowrap">
              <Layers className="w-3 h-3" /> No link
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

function Meta({ icon: Icon, text }) {
  if (!text || text === 'Not specified') {
    return (
      <span className="inline-flex items-center gap-1.5 text-ink-400">
        <Icon className="w-3.5 h-3.5" /> —
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5 text-ink-400" />
      <span className="num-tabular">{text}</span>
    </span>
  );
}

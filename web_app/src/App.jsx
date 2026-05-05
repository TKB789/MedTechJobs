import React, { useState, useEffect, useMemo } from 'react';
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
  const locations   = useMemo(() => [...new Set(jobs.map(j => j.location))].sort(),   [jobs]);
  const jobTypes    = useMemo(() => [...new Set(jobs.map(j => j.jobType))].sort(),    [jobs]);
  const departments = useMemo(() => [...new Set(jobs.map(j => j.department))].sort(), [jobs]);

  const filteredJobs = useMemo(() => {
    let result = jobs;

    if (searchTerm.trim()) {
      // Split on whitespace so "regulatory boston" finds Boston-based regulatory roles.
      // Every token must appear somewhere in the searchable haystack.
      const tokens = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);
      result = result.filter(j => {
        const haystack = [
          j.title, j.company, j.location,
          j.department, j.jobType
        ].join(' ').toLowerCase();
        return tokens.every(t => haystack.includes(t));
      });
    }
    if (filters.company)    result = result.filter(j => j.company === filters.company);
    if (filters.location)   result = result.filter(j => j.location.toLowerCase().includes(filters.location.toLowerCase()));
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
            <FilterSelect
              label="Company"
              value={filters.company}
              onChange={(v) => setFilters({ ...filters, company: v })}
              options={companies}
            />
            <FilterSelect
              label="Location"
              value={filters.location}
              onChange={(v) => setFilters({ ...filters, location: v })}
              options={locations}
            />
            <FilterSelect
              label="Type"
              value={filters.jobType}
              onChange={(v) => setFilters({ ...filters, jobType: v })}
              options={jobTypes}
            />
            <FilterSelect
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

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="block">
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-500 mb-1">
        {label}
      </div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-transparent border-0 border-b border-ink-900/40
                     py-1.5 pr-6 font-body text-sm text-ink-900 cursor-pointer
                     focus:outline-none focus:border-accent transition-colors"
        >
          <option value="">All</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-ink-400 text-xs">▾</span>
      </div>
    </label>
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

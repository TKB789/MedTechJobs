import React, { useState, useEffect } from 'react';
import { Search, Heart, AlertCircle, Download, Filter, X, Bell, ChevronDown } from 'lucide-react';

export default function MedicalDeviceJobSearch() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('demo');
  const [filters, setFilters] = useState({
    searchTerm: '',
    company: '',
    location: '',
    jobType: '',
    department: ''
  });

  // Demo data - fallback
  const demoJobs = [
    {
      id: 1,
      title: 'Senior Software Engineer - Medical Devices',
      company: 'Medtronic',
      location: 'Minneapolis, MN',
      department: 'Engineering',
      jobType: 'Full-time',
      postedDate: '2024-05-01'
    },
    {
      id: 2,
      title: 'Biomedical Engineer',
      company: 'Boston Scientific',
      location: 'Boston, MA',
      department: 'R&D',
      jobType: 'Full-time',
      postedDate: '2024-05-02'
    },
    {
      id: 3,
      title: 'Quality Assurance Manager',
      company: 'Abbott',
      location: 'Abbott Park, IL',
      department: 'Quality',
      jobType: 'Full-time',
      postedDate: '2024-04-30'
    },
    {
      id: 4,
      title: 'Product Manager',
      company: 'Johnson & Johnson',
      location: 'New Jersey',
      department: 'Product',
      jobType: 'Full-time',
      postedDate: '2024-04-28'
    },
    {
      id: 5,
      title: 'Clinical Affairs Specialist',
      company: 'Stryker',
      location: 'Kalamazoo, MI',
      department: 'Clinical',
      jobType: 'Full-time',
      postedDate: '2024-04-25'
    }
  ];

  // Load jobs from real data or demo
  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoading(true);
        
        // Try to load from multiple possible locations
        const possiblePaths = [
          '/medical_device_jobs.json',
          'medical_device_jobs.json',
          '/data/medical_device_jobs.json',
          'https://raw.githubusercontent.com/YOUR_REPO_DATA/main/medical_device_jobs.json'
        ];

        let loadedJobs = null;

        // Try each path
        for (const path of possiblePaths) {
          try {
            const response = await fetch(path);
            if (response.ok) {
              loadedJobs = await response.json();
              setDataSource('real');
              console.log(`Loaded ${loadedJobs.length} jobs from ${path}`);
              break;
            }
          } catch (e) {
            continue;
          }
        }

        // If no real data found, use demo
        if (!loadedJobs || loadedJobs.length === 0) {
          loadedJobs = demoJobs;
          setDataSource('demo');
          console.log('Using demo data');
        }

        // Add IDs if missing
        const jobsWithIds = loadedJobs.map((job, index) => ({
          ...job,
          id: job.id || index + 1,
          postedDate: job.postedDate || job.posting_date || new Date().toISOString().split('T')[0]
        }));

        setJobs(jobsWithIds);
        setFilteredJobs(jobsWithIds);
      } catch (error) {
        console.error('Error loading jobs:', error);
        setJobs(demoJobs);
        setFilteredJobs(demoJobs);
        setDataSource('demo');
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = jobs;

    if (filters.searchTerm) {
      result = result.filter(job =>
        (job.title || '').toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (job.company || '').toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }
    if (filters.company) {
      result = result.filter(job => job.company === filters.company);
    }
    if (filters.location) {
      result = result.filter(job =>
        (job.location || '').toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    if (filters.jobType) {
      result = result.filter(job => job.jobType === filters.jobType);
    }
    if (filters.department) {
      result = result.filter(job => job.department === filters.department);
    }

    setFilteredJobs(result);
  }, [filters, jobs]);

  const toggleSaveJob = (jobId) => {
    setSavedJobs(prev =>
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  };

  const handleExport = () => {
    const dataToExport = filteredJobs.map(job => ({
      ...job,
      saved: savedJobs.includes(job.id)
    }));
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `medical-device-jobs-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const companies = [...new Set(jobs.filter(j => j.company).map(j => j.company))];
  const departments = [...new Set(jobs.filter(j => j.department).map(j => j.department))];
  const jobTypes = [...new Set(jobs.filter(j => j.jobType).map(j => j.jobType))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-2xl">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold text-lg">Rx</span>
            </div>
            <h1 className="text-4xl font-bold">MedDevice Jobs</h1>
          </div>
          <p className="text-blue-100 text-lg">Find your next opportunity in medical technology</p>
          <p className="text-blue-200 text-sm mt-2">
            {dataSource === 'real' ? '✅ Real job data from scraped results' : '📊 Demo data (upload real data to replace)'}
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
            <div className="text-3xl font-bold text-white">{filteredJobs.length}</div>
            <div className="text-slate-300 text-sm">Positions Found</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
            <div className="text-3xl font-bold text-white">{companies.length}</div>
            <div className="text-slate-300 text-sm">Companies</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
            <div className="text-3xl font-bold text-white">{savedJobs.length}</div>
            <div className="text-slate-300 text-sm">Saved Jobs</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
            <div className="text-3xl font-bold text-white">50+</div>
            <div className="text-slate-300 text-sm">Companies Tracked</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-slate-700 rounded-xl p-6 mb-8 border border-slate-600 shadow-lg">
          <div className="flex gap-2 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Job title, company..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:border-blue-500 focus:outline-none placeholder-slate-400"
              />
            </div>
            <button
              onClick={() => setFilters({
                searchTerm: '',
                company: '',
                location: '',
                jobType: '',
                department: ''
              })}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg border border-slate-500 transition flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-slate-300 text-sm font-medium block mb-2">Company</label>
              <select
                value={filters.company}
                onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="">All Companies</option>
                {companies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-300 text-sm font-medium block mb-2">Location</label>
              <input
                type="text"
                placeholder="City, State..."
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:border-blue-500 focus:outline-none placeholder-slate-400"
              />
            </div>

            <div>
              <label className="text-slate-300 text-sm font-medium block mb-2">Job Type</label>
              <select
                value={filters.jobType}
                onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
                className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="">All Types</option>
                {jobTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-300 text-sm font-medium block mb-2">Department</label>
              <select
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="">All Departments</option>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-300 text-sm font-medium block mb-2">&nbsp;</label>
              <button
                onClick={handleExport}
                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg border border-blue-500 transition flex items-center justify-center gap-2 font-medium"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Job Listings */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Filter className="w-6 h-6 text-blue-400" />
            Job Listings
          </h2>

          {filteredJobs.length === 0 ? (
            <div className="bg-slate-700 rounded-lg p-8 text-center border border-slate-600">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-300 text-lg">No jobs found matching your criteria</p>
            </div>
          ) : (
            filteredJobs.map(job => (
              <div
                key={job.id}
                className="bg-slate-700 rounded-lg p-6 border border-slate-600 hover:border-blue-500 transition shadow-lg hover:shadow-xl"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{job.title || 'Untitled Position'}</h3>
                    <p className="text-blue-400 font-medium text-lg">{job.company || 'Unknown Company'}</p>
                  </div>
                  <button
                    onClick={() => toggleSaveJob(job.id)}
                    className={`p-2 rounded-lg transition ${
                      savedJobs.includes(job.id)
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                    }`}
                  >
                    <Heart
                      className="w-6 h-6"
                      fill={savedJobs.includes(job.id) ? 'currentColor' : 'none'}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 py-3 border-t border-b border-slate-600">
                  <div>
                    <p className="text-slate-400 text-sm">Location</p>
                    <p className="text-white font-medium">{job.location || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Department</p>
                    <p className="text-white font-medium">{job.department || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Type</p>
                    <p className="text-white font-medium">{job.jobType || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Posted</p>
                    <p className="text-white font-medium">
                      {job.postedDate ? new Date(job.postedDate).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  {job.job_link && (
                    <a
                      href={job.job_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                    >
                      View Details
                    </a>
                  )}
                  <button className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition font-medium">
                    Apply Now
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Info Banner */}
        <div className="mt-12 bg-gradient-to-r from-blue-600/20 to-blue-700/20 border border-blue-500/30 rounded-lg p-6">
          <div className="flex gap-3">
            <Bell className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-white font-bold mb-1">
                {dataSource === 'real' ? '✅ Real Data Active' : '📊 Demo Data Mode'}
              </h3>
              <p className="text-slate-300 text-sm">
                {dataSource === 'real'
                  ? 'Showing real job data from scraped results. New jobs added daily at 2 AM UTC.'
                  : 'Currently showing demo data. The scraper will collect real jobs daily. First scrape happens at 2 AM UTC.'}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-700 mt-12 py-6">
        <div className="max-w-6xl mx-auto px-6 text-center text-slate-400 text-sm">
          <p>Medical Device Job Search • Scraping 50+ Companies Daily • Updated at 2 AM UTC</p>
        </div>
      </footer>
    </div>
  );
}

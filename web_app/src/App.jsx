import React, { useState, useEffect } from 'react';
import { Search, Heart, MapPin, Briefcase, Building2, Calendar, Filter, X, Download, ChevronDown } from 'lucide-react';

export default function MedicalDeviceJobSearch() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('demo');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    company: '',
    location: '',
    jobType: '',
    department: ''
  });

  const demoJobs = [
    { id: 1, title: 'Senior Software Engineer - Medical Devices', company: 'Medtronic', location: 'Minneapolis, MN', department: 'Engineering', jobType: 'Full-time', postedDate: '2024-05-04' },
    { id: 2, title: 'Biomedical Engineer', company: 'Boston Scientific', location: 'Boston, MA', department: 'R&D', jobType: 'Full-time', postedDate: '2024-05-03' },
    { id: 3, title: 'Quality Assurance Manager', company: 'Abbott', location: 'Abbott Park, IL', department: 'Quality', jobType: 'Full-time', postedDate: '2024-05-02' },
    { id: 4, title: 'Product Manager', company: 'Johnson & Johnson', location: 'New Jersey', department: 'Product', jobType: 'Full-time', postedDate: '2024-05-01' },
    { id: 5, title: 'Clinical Affairs Specialist', company: 'Stryker', location: 'Kalamazoo, MI', department: 'Clinical', jobType: 'Full-time', postedDate: '2024-04-30' }
  ];

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoading(true);
        
        // Try to load from multiple sources
        const possiblePaths = [
          '/medical_device_jobs.json',
          'medical_device_jobs.json',
          '/docs/medical_device_jobs.json',
        ];

        let loadedJobs = null;

        for (const path of possiblePaths) {
          try {
            const response = await fetch(path);
            if (response.ok) {
              loadedJobs = await response.json();
              if (loadedJobs && Array.isArray(loadedJobs) && loadedJobs.length > 0) {
                setDataSource('real');
                break;
              }
            }
          } catch (e) {
            continue;
          }
        }

        if (!loadedJobs || !Array.isArray(loadedJobs) || loadedJobs.length === 0) {
          loadedJobs = demoJobs;
          setDataSource('demo');
        }

        const normalizedJobs = loadedJobs.map((job, index) => ({
          id: job.id || index + 1,
          title: job.title || job.job_title || 'Untitled',
          company: job.company || job.company_name || 'Unknown',
          location: job.location || 'Not specified',
          department: job.department || 'Not specified',
          jobType: job.jobType || job.job_type || 'Not specified',
          postedDate: job.postedDate || job.posting_date || new Date().toISOString().split('T')[0],
          job_link: job.job_link || ''
        }));

        setJobs(normalizedJobs);
        setFilteredJobs(normalizedJobs);
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

  useEffect(() => {
    let result = jobs;

    if (searchTerm) {
      result = result.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.company) {
      result = result.filter(job => job.company === filters.company);
    }

    if (filters.location) {
      result = result.filter(job => job.location.toLowerCase().includes(filters.location.toLowerCase()));
    }

    if (filters.jobType) {
      result = result.filter(job => job.jobType === filters.jobType);
    }

    if (filters.department) {
      result = result.filter(job => job.department === filters.department);
    }

    setFilteredJobs(result);
  }, [searchTerm, filters, jobs]);

  const toggleSave = (jobId) => {
    setSavedJobs(prev =>
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  };

  const handleExport = () => {
    const data = JSON.stringify(filteredJobs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jobs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const companies = [...new Set(jobs.map(j => j.company))];
  const locations = [...new Set(jobs.map(j => j.location))];
  const jobTypes = [...new Set(jobs.map(j => j.jobType))];
  const departments = [...new Set(jobs.map(j => j.department))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-white text-xl font-light">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-2xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-xl">Rx</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">MedDevice Jobs</h1>
              <p className="text-blue-100 text-sm mt-1">
                {dataSource === 'real' ? `✅ ${jobs.length} Real Jobs` : '📊 Demo Data'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search job titles or companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Company</label>
            <select
              value={filters.company}
              onChange={(e) => setFilters({ ...filters, company: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer text-sm"
            >
              <option value="">All Companies</option>
              {companies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Location</label>
            <select
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer text-sm"
            >
              <option value="">All Locations</option>
              {locations.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Job Type</label>
            <select
              value={filters.jobType}
              onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer text-sm"
            >
              <option value="">All Types</option>
              {jobTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer text-sm"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => {
              setSearchTerm('');
              setFilters({ company: '', location: '', jobType: '', department: '' });
            }}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-sm font-medium flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-slate-400 text-sm">
          Showing {filteredJobs.length} of {jobs.length} jobs
        </div>

        {/* Job Listings */}
        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">No jobs found matching your criteria</p>
            </div>
          ) : (
            filteredJobs.map(job => (
              <div
                key={job.id}
                className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">{job.title}</h3>
                    <p className="text-blue-400 font-medium text-base mb-3">{job.company}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-slate-400" />
                        {job.jobType}
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        {job.department}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(job.postedDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleSave(job.id)}
                    className={`p-3 rounded-lg transition flex-shrink-0 ${
                      savedJobs.includes(job.id)
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-400'
                    }`}
                  >
                    <Heart
                      className="w-5 h-5"
                      fill={savedJobs.includes(job.id) ? 'currentColor' : 'none'}
                    />
                  </button>
                </div>

                <div className="mt-4 flex gap-3">
                  {job.job_link && (
                    <a
                      href={job.job_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
                    >
                      View Job
                    </a>
                  )}
                  <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-sm font-medium">
                    Apply
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Info Banner */}
        <div className="mt-12 bg-slate-800 border border-slate-700 rounded-lg p-6">
          <p className="text-slate-400 text-sm">
            {dataSource === 'real'
              ? '✅ Showing real job data from your scraper. Updates automatically daily at 2 AM UTC.'
              : '📊 Currently showing sample/demo data. Real data will appear after the scraper collects jobs.'}
          </p>
        </div>
      </main>
    </div>
  );
}

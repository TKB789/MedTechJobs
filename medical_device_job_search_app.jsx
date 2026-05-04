import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Heart, Search, Filter, AlertCircle, CheckCircle2, Clock, Building2, MapPin, Briefcase, X, Download } from 'lucide-react';

export default function MedicalDeviceJobSearch() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(true);

  // Filter state
  const [filters, setFilters] = useState({
    searchTerm: '',
    company: '',
    location: '',
    jobType: '',
    department: '',
  });

  const [alertConfig, setAlertConfig] = useState({
    keywords: '',
    company: '',
    location: '',
    notificationMethod: 'browser',
  });

  const [showAlertForm, setShowAlertForm] = useState(false);

  // Demo data - replace with real data from scraper
  const demoJobs = [
    {
      id: 1,
      company_name: 'Medtronic',
      job_title: 'Senior Software Engineer - Medical Devices',
      location: 'Minneapolis, MN',
      department: 'Engineering',
      job_type: 'Full-time',
      posting_date: '2025-04-28',
      job_link: '#',
    },
    {
      id: 2,
      company_name: 'Johnson & Johnson',
      job_title: 'Clinical Product Manager',
      location: 'New Brunswick, NJ',
      department: 'Product Management',
      job_type: 'Full-time',
      posting_date: '2025-04-25',
      job_link: '#',
    },
    {
      id: 3,
      company_name: 'Boston Scientific',
      job_title: 'Quality Assurance Engineer',
      location: 'Marlborough, MA',
      department: 'Quality',
      job_type: 'Full-time',
      posting_date: '2025-04-20',
      job_link: '#',
    },
    {
      id: 4,
      company_name: 'Abbott',
      job_title: 'Regulatory Affairs Specialist',
      location: 'Abbott Park, IL',
      department: 'Regulatory',
      job_type: 'Full-time',
      posting_date: '2025-04-18',
      job_link: '#',
    },
    {
      id: 5,
      company_name: 'Stryker',
      job_title: 'Business Development Manager',
      location: 'San Jose, CA',
      department: 'Business Development',
      job_type: 'Full-time',
      posting_date: '2025-04-15',
      job_link: '#',
    },
  ];

  // Initialize with demo data
  useEffect(() => {
    setJobs(demoJobs);
    setFilteredJobs(demoJobs);
  }, []);

  // Load saved jobs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedJobs');
    if (saved) {
      setSavedJobs(JSON.parse(saved));
    }
    const savedAlerts = localStorage.getItem('jobAlerts');
    if (savedAlerts) {
      setAlerts(JSON.parse(savedAlerts));
    }
  }, []);

  // Apply filters
  useEffect(() => {
    let results = jobs;

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      results = results.filter(job =>
        job.job_title.toLowerCase().includes(term) ||
        job.company_name.toLowerCase().includes(term) ||
        job.department.toLowerCase().includes(term)
      );
    }

    if (filters.company) {
      results = results.filter(job => job.company_name === filters.company);
    }

    if (filters.location) {
      results = results.filter(job =>
        job.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.jobType) {
      results = results.filter(job => job.job_type === filters.jobType);
    }

    if (filters.department) {
      results = results.filter(job => job.department === filters.department);
    }

    setFilteredJobs(results);
  }, [filters, jobs]);

  const toggleSaveJob = useCallback((job) => {
    setSavedJobs(prev => {
      const isSaved = prev.some(j => j.id === job.id);
      const updated = isSaved
        ? prev.filter(j => j.id !== job.id)
        : [...prev, job];
      localStorage.setItem('savedJobs', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isSaved = (jobId) => savedJobs.some(j => j.id === jobId);

  const createAlert = () => {
    if (alertConfig.keywords || alertConfig.company || alertConfig.location) {
      const newAlert = {
        id: Date.now(),
        ...alertConfig,
        createdDate: new Date().toLocaleDateString(),
      };
      const updated = [...alerts, newAlert];
      setAlerts(updated);
      localStorage.setItem('jobAlerts', JSON.stringify(updated));
      setAlertConfig({
        keywords: '',
        company: '',
        location: '',
        notificationMethod: 'browser',
      });
      setShowAlertForm(false);
    }
  };

  const deleteAlert = (id) => {
    const updated = alerts.filter(a => a.id !== id);
    setAlerts(updated);
    localStorage.setItem('jobAlerts', JSON.stringify(updated));
  };

  const getCompanies = () => [...new Set(jobs.map(j => j.company_name))].sort();
  const getDepartments = () => [...new Set(jobs.map(j => j.department))].sort();
  const getJobTypes = () => [...new Set(jobs.map(j => j.job_type))];

  const exportJobs = () => {
    const dataStr = JSON.stringify(filteredJobs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medical-device-jobs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">MedDevice Jobs</h1>
                <p className="text-xs text-slate-400">Medical Device Career Search</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAlertForm(!showAlertForm)}
                className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600 transition text-slate-300 hover:text-white relative"
                title="Job Alerts"
              >
                <Bell className="w-5 h-5" />
                {alerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              <button
                onClick={() => setFilteredJobs(savedJobs)}
                className="px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-600 transition text-slate-300 hover:text-white font-medium text-sm flex items-center gap-2"
              >
                <Heart className="w-4 h-4" />
                Saved ({savedJobs.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showDemo && (
          <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-blue-300 font-semibold text-sm">Demo Data Active</h3>
              <p className="text-blue-400/80 text-sm mt-1">Replace with real job data by uploading your scraped JSON file or running the Scrapy spider.</p>
            </div>
            <button
              onClick={() => setShowDemo(false)}
              className="ml-auto text-blue-400 hover:text-blue-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/40 backdrop-blur border border-slate-700/50 rounded-xl p-6 sticky top-24 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Search Jobs</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Job title, company..."
                    value={filters.searchTerm}
                    onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Company</label>
                <select
                  value={filters.company}
                  onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500 text-sm"
                >
                  <option value="">All Companies</option>
                  {getCompanies().map(company => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Location</label>
                <input
                  type="text"
                  placeholder="City, State..."
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Job Type</label>
                <select
                  value={filters.jobType}
                  onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500 text-sm"
                >
                  <option value="">All Types</option>
                  {getJobTypes().map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Department</label>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500 text-sm"
                >
                  <option value="">All Departments</option>
                  {getDepartments().map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setFilters({
                  searchTerm: '',
                  company: '',
                  location: '',
                  jobType: '',
                  department: '',
                })}
                className="w-full px-4 py-2 rounded-lg bg-slate-700/30 hover:bg-slate-600/50 text-slate-300 font-medium text-sm transition"
              >
                Clear Filters
              </button>

              <button
                onClick={exportJobs}
                className="w-full px-4 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-medium text-sm transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Results
              </button>
            </div>
          </div>

          {/* Job Listings */}
          <div className="lg:col-span-3">
            {/* Job Alerts Panel */}
            {showAlertForm && (
              <div className="mb-6 bg-amber-900/30 border border-amber-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-amber-300">Create Job Alert</h3>
                  <button
                    onClick={() => setShowAlertForm(false)}
                    className="text-amber-400/60 hover:text-amber-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Keywords (e.g., Software Engineer, DevOps)"
                    value={alertConfig.keywords}
                    onChange={(e) => setAlertConfig({ ...alertConfig, keywords: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />

                  <input
                    type="text"
                    placeholder="Company (optional)"
                    value={alertConfig.company}
                    onChange={(e) => setAlertConfig({ ...alertConfig, company: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />

                  <input
                    type="text"
                    placeholder="Location (optional)"
                    value={alertConfig.location}
                    onChange={(e) => setAlertConfig({ ...alertConfig, location: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />

                  <select
                    value={alertConfig.notificationMethod}
                    onChange={(e) => setAlertConfig({ ...alertConfig, notificationMethod: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="browser">Browser Notification</option>
                    <option value="email">Email</option>
                  </select>

                  <button
                    onClick={createAlert}
                    className="w-full px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium transition"
                  >
                    Create Alert
                  </button>
                </div>
              </div>
            )}

            {/* Active Alerts */}
            {alerts.length > 0 && (
              <div className="mb-6 space-y-3">
                <h3 className="text-sm font-semibold text-slate-300">Active Alerts ({alerts.length})</h3>
                {alerts.map(alert => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg bg-slate-700/30 border border-slate-600/50"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Bell className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-slate-300 truncate">
                          {alert.keywords || 'All jobs'}
                          {alert.company && ` • ${alert.company}`}
                          {alert.location && ` • ${alert.location}`}
                        </p>
                        <p className="text-xs text-slate-500">Created: {alert.createdDate}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="text-slate-500 hover:text-red-400 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Results Count */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {filteredJobs === savedJobs ? 'Saved Jobs' : 'Job Listings'}
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  {filteredJobs.length} position{filteredJobs.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>

            {/* Job Cards */}
            {filteredJobs.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/40 backdrop-blur border border-slate-700/50 rounded-xl">
                <Briefcase className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
                <p className="text-slate-400 font-medium">No jobs match your filters</p>
                <p className="text-slate-500 text-sm mt-2">Try adjusting your search criteria</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map(job => (
                  <div
                    key={job.id}
                    className="group bg-slate-800/40 backdrop-blur border border-slate-700/50 rounded-xl p-6 hover:border-slate-600/80 transition hover:shadow-xl hover:shadow-blue-500/10"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition truncate">
                          {job.job_title}
                        </h3>
                        <p className="text-blue-400 font-semibold text-sm mt-1">{job.company_name}</p>
                      </div>
                      <button
                        onClick={() => toggleSaveJob(job)}
                        className={`flex-shrink-0 p-2 rounded-lg transition ${
                          isSaved(job.id)
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-slate-700/50 text-slate-400 hover:text-white'
                        }`}
                        title={isSaved(job.id) ? 'Remove from saved' : 'Save job'}
                      >
                        <Heart className={`w-5 h-5 ${isSaved(job.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Building2 className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{job.department}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Briefcase className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{job.job_type}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{job.posting_date}</span>
                      </div>
                    </div>

                    <a
                      href={job.job_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition"
                    >
                      View Job
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700/50 bg-slate-900/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-slate-400">
            <div>
              <h4 className="text-white font-semibold mb-3">About</h4>
              <p>MedDevice Jobs aggregates career opportunities from leading medical device companies across the USA.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Features</h4>
              <ul className="space-y-2">
                <li>• Advanced job filtering</li>
                <li>• Save favorite jobs</li>
                <li>• Custom job alerts</li>
                <li>• Export job listings</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Data</h4>
              <p>Data is refreshed daily from company career pages using automated web scraping.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

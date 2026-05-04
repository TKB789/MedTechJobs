# Medical Device Job Scraper & Search Website - Setup Guide

## Overview

This project includes:
1. **Scrapy Spider** - Scrapes 30+ medical device company career pages
2. **React Web App** - Full-featured job search interface with saved jobs and alerts
3. Complete data pipeline and integration

---

## Part 1: Scrapy Web Scraper Setup

### Prerequisites

```bash
# Install Python 3.8+
python --version

# Install required packages
pip install scrapy
pip install requests
```

### Installation & Configuration

```bash
# Create a Scrapy project
scrapy startproject medical_device_jobs
cd medical_device_jobs

# Copy the spider to the project
# Place medical_device_jobs_scraper.py in the medical_device_jobs/spiders/ directory
```

### Running the Scraper

**Option 1: Simple Execution**
```bash
python medical_device_jobs_scraper.py
```

**Option 2: Scrapy Command Line**
```bash
cd medical_device_jobs
scrapy crawl medical_device_jobs -o jobs_output.json
```

**Option 3: In a Python Script**
```python
from medical_device_jobs_scraper import run_scraper

run_scraper()
# Output will be saved to /mnt/user-data/outputs/medical_device_jobs_YYYYMMDD_HHMMSS.json
```

### Supported Companies (30+)

The spider includes the following medical device companies:

**Major Players:**
- Medtronic
- Johnson & Johnson
- Abbott
- Boston Scientific
- Baxter International
- Becton Dickinson
- Stryker
- Zimmer Biomet

**Specialized Companies:**
- Intuitive Surgical
- Danaher
- GE Healthcare
- Siemens Healthineers
- Philips Healthcare
- ResMed
- Vyaire Medical
- And 15+ more...

### Output Format

The scraper produces JSON with this structure:

```json
[
  {
    "company_name": "Medtronic",
    "company_id": "medtronic",
    "job_title": "Senior Software Engineer - Medical Devices",
    "job_link": "https://careers.medtronic.com/jobs/1234",
    "location": "Minneapolis, MN",
    "department": "Engineering",
    "job_type": "Full-time",
    "posting_date": "2025-04-28",
    "scraped_date": "2025-05-03T12:00:00"
  }
]
```

### Important Notes

⚠️ **Website Structure Changes**: Each company's career page may have different HTML structure. The spider includes generic selectors, but you may need to customize them:

```python
# In the parse_listing method, adjust these selectors:
job_selectors = [
    '//div[@class*="job"]',           # Customize for your target site
    '//li[@class*="position"]',
    '//article[@class*="listing"]',
]
```

**To find the right selectors for a specific company:**

1. Open the company's career page in a browser
2. Right-click on a job listing and select "Inspect"
3. Find the element containing the job info
4. Update the xpath selector

**Example for Medtronic:**
```python
# If Medtronic uses data-attribute="job-card":
job_selectors = [
    '//div[@data-attribute="job-card"]',
]

job_title = job.xpath('.//h2[@class="job-title"]/text()').get()
location = job.xpath('.//span[@data-field="location"]/text()').get()
```

### Ethical Web Scraping

- ✅ **Always** respect robots.txt (the spider does)
- ✅ Add delays between requests (default: 2 seconds)
- ✅ Identify your scraper with a User-Agent
- ✅ Check the company's Terms of Service
- ❌ **Don't** overload servers (keep concurrent requests low)
- ❌ **Don't** use scraped data for commercial purposes without permission

### Automation

**Schedule daily scraping with cron (Linux/Mac):**

```bash
# Edit crontab
crontab -e

# Add this line to run daily at 2 AM
0 2 * * * cd /path/to/medical_device_jobs && python medical_device_jobs_scraper.py >> scraper.log 2>&1
```

**Windows Task Scheduler:**
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Daily at 2:00 AM
4. Set action: Run `python medical_device_jobs_scraper.py`

---

## Part 2: React Web App Setup

### Prerequisites

- Node.js 14+
- React 18+
- Tailwind CSS (included in the JSX)

### Installation

**Option 1: Use in Claude.ai**
- Copy `medical_device_job_search_app.jsx` into Claude
- Create as a React artifact
- App will run immediately in the interface

**Option 2: Local Development**

```bash
# Create React app
npx create-react-app medical-device-jobs-app
cd medical-device-jobs-app

# Install dependencies (Lucide icons are included)
npm install lucide-react

# Replace src/App.js with the app code
# Copy the JSX content to src/App.js

# Add Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Update tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

# Start the app
npm start
```

### Features

✨ **Job Management:**
- Search and filter jobs by title, company, location, department, type
- Save favorite jobs to localStorage
- Export job listings as JSON
- View detailed job information

🔔 **Smart Alerts:**
- Create custom job alerts with keywords, company, location
- Multiple notification methods (browser, email)
- Manage and delete alerts
- Persistent storage

📊 **Interface:**
- Dark theme optimized for long browsing sessions
- Responsive design (mobile, tablet, desktop)
- Sticky header and sidebar for easy navigation
- Real-time filtering with instant results

### Data Integration

**Load your scraped data:**

```javascript
// In the component, replace demoJobs with:

// Option 1: Import JSON file
import jobsData from './jobs_data.json';

useEffect(() => {
  setJobs(jobsData);
  setFilteredJobs(jobsData);
}, []);

// Option 2: Fetch from API
useEffect(() => {
  fetch('/api/jobs')
    .then(res => res.json())
    .then(data => {
      setJobs(data);
      setFilteredJobs(data);
    });
}, []);

// Option 3: Upload JSON file (add file input)
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = JSON.parse(e.target.result);
    setJobs(data);
    setFilteredJobs(data);
  };
  reader.readAsText(file);
};
```

### Customization

**Change color scheme:**
```javascript
// Update gradient colors in header
bg-gradient-to-br from-blue-500 to-cyan-500

// Available Tailwind colors:
// blue, cyan, green, emerald, teal, indigo, purple, pink, red, orange, amber
```

**Add more columns:**
```javascript
// Add new filter in filters state
const [filters, setFilters] = useState({
  searchTerm: '',
  company: '',
  location: '',
  jobType: '',
  department: '',
  // Add new filter:
  salary: '',  // New filter
});

// Add filter control in sidebar
<select
  value={filters.salary}
  onChange={(e) => setFilters({ ...filters, salary: e.target.value })}
>
  {/* options */}
</select>

// Apply filter in useEffect
if (filters.salary) {
  results = results.filter(job => job.salary >= parseInt(filters.salary));
}
```

---

## Part 3: Full Integration Workflow

### Step 1: Set Up Scraper
```bash
pip install scrapy
python medical_device_jobs_scraper.py
# Output: medical_device_jobs_20250503_120000.json
```

### Step 2: Load Data into App
```javascript
// In your React app
import jobsData from './medical_device_jobs_20250503_120000.json';

useEffect(() => {
  setJobs(jobsData);
  setFilteredJobs(jobsData);
}, []);
```

### Step 3: Deploy Website
```bash
# Build for production
npm run build

# Deploy to Vercel, Netlify, or your hosting
vercel deploy
```

---

## Part 4: Advanced Configuration

### API Server (Node.js/Express)

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;

const app = express();
app.use(cors());

// Serve jobs API
app.get('/api/jobs', async (req, res) => {
  const data = await fs.readFile('medical_device_jobs.json', 'utf-8');
  res.json(JSON.parse(data));
});

// Filter by company
app.get('/api/jobs/:company', async (req, res) => {
  const data = await fs.readFile('medical_device_jobs.json', 'utf-8');
  const jobs = JSON.parse(data);
  const filtered = jobs.filter(j => 
    j.company_name.toLowerCase() === req.params.company.toLowerCase()
  );
  res.json(filtered);
});

app.listen(5000, () => console.log('API running on port 5000'));
```

### Database Integration (MongoDB)

```javascript
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  company_name: String,
  job_title: String,
  location: String,
  department: String,
  job_type: String,
  posting_date: Date,
  job_link: String,
  scraped_date: Date,
});

const Job = mongoose.model('Job', jobSchema);

// Insert jobs from scraper
const insertJobs = async (jobsArray) => {
  await Job.insertMany(jobsArray);
};
```

### Email Notifications for Alerts

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD
  }
});

// When new matching job is found
await transporter.sendMail({
  to: userEmail,
  subject: `New Job Alert: ${job.job_title}`,
  html: `
    <h2>${job.job_title}</h2>
    <p><strong>${job.company_name}</strong> - ${job.location}</p>
    <a href="${job.job_link}">View Job</a>
  `
});
```

---

## Troubleshooting

### Scraper Issues

**Q: Spider finds no jobs**
- A: Company website structure changed. Inspect page and update selectors.

**Q: Getting blocked (403 errors)**
- A: Increase delays, add random user agents, try rotating proxies

**Q: SSL/Certificate errors**
- A: Add to settings: `INSECURE_REQUESTS_ENABLED = True`

### App Issues

**Q: Filters not working**
- A: Check filter state is being passed to useEffect dependency array

**Q: Saved jobs disappear on refresh**
- A: Ensure localStorage is enabled in browser

**Q: Export button doesn't work**
- A: Check browser console for CORS or file access errors

---

## Performance Tips

1. **Pagination**: Add pagination for large job lists
```javascript
const [page, setPage] = useState(1);
const itemsPerPage = 20;
const startIdx = (page - 1) * itemsPerPage;
const paginatedJobs = filteredJobs.slice(startIdx, startIdx + itemsPerPage);
```

2. **Caching**: Cache scraper results
```python
import pickle

# Save cache
with open('jobs_cache.pkl', 'wb') as f:
    pickle.dump(jobs, f)

# Load cache
with open('jobs_cache.pkl', 'rb') as f:
    jobs = pickle.load(f)
```

3. **Database**: Use database for large datasets instead of JSON

---

## Resources

- **Scrapy Docs**: https://docs.scrapy.org
- **React Docs**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com
- **XPath Tutorial**: https://www.w3schools.com/xml/xpath_intro.asp

---

## License & Ethics

This project is for educational purposes. Ensure you:
- ✅ Respect robots.txt
- ✅ Follow terms of service
- ✅ Don't overload servers
- ✅ Give proper attribution
- ✅ Use data responsibly

Happy job hunting! 🚀

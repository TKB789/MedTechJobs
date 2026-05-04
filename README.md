# Medical Device Job Scraper & Search Website

A complete solution for scraping medical device company career pages and searching for jobs with a full-featured web application.

## 🎯 Features

### Web Scraper (Scrapy)
- ✅ Scrapes **30+ major US medical device companies**
- ✅ Captures job title, company, location, department, job type, and posting date
- ✅ Ethical web scraping with respectful delays and rate limiting
- ✅ JSON output for easy integration
- ✅ Automated scheduling support (cron, Windows Task Scheduler)

### Web Application (React)
- 🔍 **Advanced Filtering**: Search by company, location, job type, department
- ❤️ **Save Jobs**: Bookmark your favorite positions (localStorage)
- 🔔 **Custom Alerts**: Set up notifications for matching jobs
- 📊 **Export**: Download job listings as JSON
- 🎨 **Dark Mode UI**: Optimized for long browsing sessions
- 📱 **Responsive Design**: Works on mobile, tablet, and desktop

## 📦 What's Included

```
├── medical_device_jobs_scraper.py    # Main Scrapy spider
├── medical_device_job_search_app.jsx  # React web app component
├── requirements.txt                   # Python dependencies
├── quickstart.sh                      # Quick setup script
├── SETUP_GUIDE.md                     # Detailed setup instructions
├── SAMPLE_DATA.json                   # Example job data
└── README.md                          # This file
```

## 🚀 Quick Start

### 1. Run the Scraper (5 minutes)

```bash
# Install dependencies
pip install -r requirements.txt

# Run the scraper
python medical_device_jobs_scraper.py

# Output: medical_device_jobs_YYYYMMDD_HHMMSS.json
```

**Or use the quick start script:**
```bash
bash quickstart.sh
```

### 2. Load the Web App

**Option A: Use in Claude.ai (Easiest)**
1. Copy `medical_device_job_search_app.jsx` content
2. Paste into Claude
3. Create as React artifact
4. App runs immediately with demo data

**Option B: Local React Development**
```bash
npx create-react-app medical-device-jobs
cd medical-device-jobs
npm install lucide-react

# Copy medical_device_job_search_app.jsx to src/App.js
npm start
```

### 3. Load Your Scraped Data

In the React app, replace demo data:

```javascript
// At the top of the component
import jobsData from './medical_device_jobs_20250503_120000.json';

// In useEffect
useEffect(() => {
  setJobs(jobsData);
  setFilteredJobs(jobsData);
}, []);
```

## 🏢 Supported Companies

The scraper includes the following **30+ medical device companies**:

**Major Players:**
Medtronic, Johnson & Johnson, Abbott, Boston Scientific, Baxter International, Becton Dickinson, Stryker, Zimmer Biomet

**Specialized Manufacturers:**
Intuitive Surgical, Danaher, GE Healthcare, Siemens Healthineers, Philips Healthcare, ResMed, Vyaire Medical, Conmed, Varian, Inogen, Sectra, Canon Medical, LivaNova, Haemonetics, ATS Medical, Merit Medical, Abiomed, Lantheus, Cardiovascular Systems, Shockwave Medical, Accelerate Diagnostics

## 📊 Data Structure

The scraper produces JSON with this format:

```json
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
```

## ⚙️ Configuration

### Adjust Scraper Settings

In `medical_device_jobs_scraper.py`:

```python
custom_settings = {
    'CONCURRENT_REQUESTS': 8,      # Parallel requests (lower = more respectful)
    'DOWNLOAD_DELAY': 2,            # Delay between requests in seconds
    'USER_AGENT': 'Your User Agent'  # Identify your scraper
}
```

### Customize for Specific Companies

If a company's website structure changes:

```python
# In the parse_listing method:
job_selectors = [
    '//div[@class="job-card"]',     # Update these selectors
    '//article[@data-job="true"]',   # based on actual HTML
]
```

To find the right selectors:
1. Open company career page
2. Right-click a job → Inspect
3. Find element class/id
4. Update the xpath selector

## 🌐 Web App Features

### Filtering
- **Search**: Job title, company name, or keywords
- **Company**: Filter by employer
- **Location**: Search by city, state
- **Job Type**: Full-time, Part-time, Contract
- **Department**: Engineering, Sales, Marketing, etc.

### Job Management
- **Save**: ❤️ Click to save jobs (stored locally)
- **View**: Click "View Job" to go to application
- **Export**: Download filtered results as JSON
- **Clear**: Reset all filters with one click

### Alerts
- **Create Alert**: Set keywords, company, location
- **Notification**: Browser or email options
- **Manage**: Edit or delete active alerts
- **History**: See all your alerts

## 🛠️ Advanced Setup

### Schedule Daily Scraping

**Linux/Mac (Cron):**
```bash
# Edit crontab
crontab -e

# Add this line to run daily at 2 AM
0 2 * * * cd /path/to/project && python medical_device_jobs_scraper.py
```

**Windows (Task Scheduler):**
1. Open Task Scheduler
2. Create Basic Task → Set trigger: Daily 2:00 AM
3. Action: `python medical_device_jobs_scraper.py`

### API Server

Create a Node.js/Express API to serve jobs:

```javascript
const express = require('express');
const app = express();

app.get('/api/jobs', (req, res) => {
  const jobs = require('./medical_device_jobs.json');
  res.json(jobs);
});

app.listen(5000);
```

### Database Integration

Store jobs in MongoDB or PostgreSQL for scalability:

```javascript
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  company_name: String,
  job_title: String,
  location: String,
  posting_date: Date,
  // ... other fields
});

const Job = mongoose.model('Job', jobSchema);
```

## 📋 Requirements

### Python
- Python 3.8 or higher
- Scrapy 2.8+
- Requests 2.31+

### JavaScript/React
- Node.js 14+
- React 18+
- Lucide React icons (included)

## ⚠️ Important Notes

### Ethical Web Scraping
- ✅ Always respect `robots.txt`
- ✅ Add delays between requests
- ✅ Identify your scraper with a User-Agent
- ✅ Check Terms of Service before scraping
- ❌ Don't overload servers
- ❌ Don't use data for commercial purposes without permission

### Website Structure Changes
Company career pages update frequently. If the scraper stops finding jobs:
1. Visit the company's career page
2. Inspect the HTML structure
3. Update the xpath selectors in the spider
4. Test with a single company first

## 🐛 Troubleshooting

### Scraper Issues

**No jobs found:**
- Company website structure may have changed
- Update selectors in `parse_listing()` method
- Verify the company URL is still active

**Getting 403 Forbidden errors:**
- Increase `DOWNLOAD_DELAY` to 5+ seconds
- Add rotating user agents
- Consider using a proxy service

**SSL certificate errors:**
- Add to custom_settings: `'INSECURE_REQUESTS_ENABLED': True`

### App Issues

**Filters not updating:**
- Check filter state in useEffect dependency array
- Ensure job data is properly loaded

**Saved jobs disappear:**
- Browser localStorage might be disabled
- Try in incognito/private mode
- Check browser storage quota

## 📚 Documentation

- **Detailed Setup**: See `SETUP_GUIDE.md`
- **Scrapy Docs**: https://docs.scrapy.org
- **React Docs**: https://react.dev
- **XPath Tutorial**: https://www.w3schools.com/xml/xpath_intro.asp

## 🎓 Learning Resources

This project demonstrates:
- Web scraping with Scrapy
- HTML/CSS parsing with XPath
- React hooks (useState, useEffect, useCallback)
- Component state management
- LocalStorage API
- Responsive UI design with Tailwind CSS

## 📝 License

This project is provided for educational purposes. Ensure you comply with:
- Website Terms of Service
- robots.txt guidelines
- Local data protection regulations (GDPR, CCPA, etc.)

## 🤝 Contributing

Have improvements? Consider:
- Adding more companies to scrape
- Implementing salary range extraction
- Adding resume upload matching
- Building email notification system
- Creating mobile app version

## 🚀 Next Steps

1. **Run the scraper** → Get fresh job data
2. **Load into the app** → View all opportunities
3. **Set up alerts** → Get notified of matching jobs
4. **Save favorites** → Build your job list
5. **Apply directly** → From the app links

## 💬 Questions?

For detailed setup and customization, refer to:
- `SETUP_GUIDE.md` - Complete configuration guide
- Comments in `medical_device_jobs_scraper.py` - Code documentation
- Comments in `medical_device_job_search_app.jsx` - App documentation

---

**Happy job hunting!** 🎉

Made with ❤️ for medical device professionals

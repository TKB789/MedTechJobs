# Deploy to GitHub Pages & Automate Job Scraping

This guide will help you deploy your React app to GitHub Pages and set up automated job scraping.

## Part 1: Deploy React App to GitHub Pages

### Step 1: Update package.json

Edit `web_app/package.json` and add the homepage URL:

```json
{
  "name": "medical-device-job-search",
  "version": "1.0.0",
  "homepage": "https://yourusername.github.io/medical-device-job-scraper",
  "description": "A full-featured job search application for medical device company positions",
  ...
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build",
    ...
  },
  "devDependencies": {
    ...
    "gh-pages": "^5.0.0"
  }
}
```

**IMPORTANT:** Replace `yourusername` with your actual GitHub username!

### Step 2: Install gh-pages package

```bash
cd web_app
npm install gh-pages --save-dev
```

### Step 3: Build and Deploy

```bash
cd web_app
npm run deploy
```

This creates a `build/` folder and pushes it to the `gh-pages` branch on GitHub.

### Step 4: Enable GitHub Pages in Repository Settings

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Source", select **Deploy from a branch**
4. Select branch: **gh-pages**
5. Select folder: **/ (root)**
6. Click **Save**

GitHub will show you the URL where your site is deployed (usually `https://yourusername.github.io/medical-device-job-scraper`)

### Step 5: Access Your Live App

Your web app will be live at: `https://yourusername.github.io/medical-device-job-scraper`

---

## Part 2: Set Up Automated Job Scraping

### Option A: GitHub Actions (Recommended - Completely Free)

GitHub Actions can run your scraper automatically on a schedule.

#### Step 1: Create GitHub Actions Workflow

Create this file in your repo:
`.github/workflows/scrape-jobs.yml`

```yaml
name: Scrape Medical Device Jobs

on:
  schedule:
    # Run every day at 2 AM UTC
    - cron: '0 2 * * *'
  # Allow manual trigger
  workflow_dispatch:

jobs:
  scrape:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.10'
    
    - name: Install dependencies
      run: |
        pip install scrapy requests lxml cssselect python-dateutil
    
    - name: Run scraper
      run: |
        cd scrapy_spider
        python medical_device_jobs_scraper.py
    
    - name: Commit and push results
      run: |
        git config --local user.email "action@github.com"
        git config --local user.name "GitHub Action"
        git add scrapy_spider/medical_device_jobs_*.json
        git commit -m "Automated job scrape - $(date)" || true
        git push
```

#### Step 2: Push to GitHub

```bash
git add .github/workflows/scrape-jobs.yml
git commit -m "Add GitHub Actions scraping workflow"
git push origin main
```

Your scraper will now run automatically every day at 2 AM UTC! ✅

#### Step 3: View Job Results

1. Go to **Actions** tab on GitHub
2. Click on a workflow run
3. Check logs to see if scraping succeeded
4. Job data saves to `scrapy_spider/medical_device_jobs_YYYYMMDD_HHMMSS.json`

### Option B: External Service (PythonAnywhere, Heroku, etc.)

If you prefer external hosting, see **Option C** below.

---

## Part 3: Load Scraped Data Into Your Web App

Once your scraper runs and creates job data, you need to load it into the React app.

### Method 1: Upload JSON to Your Repo (Simple)

1. **Run scraper locally:**
   ```bash
   cd scrapy_spider
   python medical_device_jobs_scraper.py
   ```

2. **Move the generated JSON file:**
   ```bash
   # Copy the output file to docs folder
   cp scrapy_spider/medical_device_jobs_*.json docs/jobs_data.json
   git add docs/jobs_data.json
   git commit -m "Update job data"
   git push
   ```

3. **Update React app to load it:**
   
   Edit `web_app/medical_device_job_search_app.jsx`
   
   Replace the demo data section:
   ```javascript
   // Change this:
   const demoJobs = [
     // ... demo jobs
   ];
   
   // To this:
   const [jobs, setJobs] = useState([]);
   
   useEffect(() => {
     // Load from your jobs data file
     fetch('/medical-device-job-scraper/jobs_data.json')
       .then(res => res.json())
       .then(data => {
         setJobs(data);
         setFilteredJobs(data);
       })
       .catch(err => console.error('Failed to load jobs:', err));
   }, []);
   ```

4. **Deploy:**
   ```bash
   cd web_app
   npm run deploy
   ```

### Method 2: Use a Backend API (More Scalable)

If you have many jobs, create a simple API:

**Create `api/jobs.js` (if using Node.js):**
```javascript
import fs from 'fs';

export default function handler(req, res) {
  const jobs = JSON.parse(
    fs.readFileSync('./data/medical_device_jobs.json', 'utf8')
  );
  res.status(200).json(jobs);
}
```

Then in React:
```javascript
useEffect(() => {
  fetch('/api/jobs')
    .then(res => res.json())
    .then(data => {
      setJobs(data);
      setFilteredJobs(data);
    });
}, []);
```

---

## Part 4: Complete Workflow Example

Here's the full process from start to finish:

### Week 1: Setup
```bash
# 1. Clone repo
git clone https://github.com/yourusername/medical-device-job-scraper.git
cd medical-device-job-scraper

# 2. Set up web app
cd web_app
npm install
npm run build

# 3. Deploy to GitHub Pages
npm run deploy
```

### Ongoing: Automated Job Updates
- GitHub Actions runs scraper daily automatically ✅
- Jobs saved to your repo
- React app loads latest data
- Your site always has fresh jobs!

### If Manual Update Needed:
```bash
# Run scraper
cd scrapy_spider
python medical_device_jobs_scraper.py

# Update repo
cp medical_device_jobs_*.json ../docs/jobs_data.json
cd ..
git add docs/jobs_data.json
git commit -m "Update job data"
git push

# Rebuild and deploy web app
cd web_app
npm run deploy
```

---

## Troubleshooting

### GitHub Pages Not Working

**Issue:** "404 Not Found" when visiting the site

**Solution:**
1. Check Settings → Pages
2. Verify `gh-pages` branch exists
3. Rebuild: `npm run deploy`
4. Wait 5-10 minutes for GitHub to update

### GitHub Actions Not Running

**Issue:** Workflow shows error

**Solution:**
1. Check **Actions** tab for error logs
2. Verify `requirements.txt` has all dependencies
3. Check cron schedule is correct (use https://crontab.guru)
4. Try manual trigger: Click **Run workflow**

### Data Not Loading in App

**Issue:** React app shows demo data, not real jobs

**Solution:**
1. Verify JSON file is in correct location
2. Check fetch URL matches file path
3. Verify JSON is valid: `python -m json.tool docs/jobs_data.json`
4. Check browser console for errors (F12)

### Jobs Disappear on Page Reload

**Issue:** Saved jobs are lost

**This is expected:** The app uses localStorage, which is per-browser. To persist data across devices, you'd need a backend database.

---

## What Your Users Will See

Once deployed, anyone can visit:
### `https://yourusername.github.io/medical-device-job-scraper`

They'll see:
- ✅ List of all medical device jobs
- ✅ Filter by company, location, job type, department
- ✅ Save favorite jobs
- ✅ Create job alerts
- ✅ Export job listings
- ✅ Data updated daily automatically

---

## Next Steps

1. ✅ Update `web_app/package.json` with your GitHub username
2. ✅ Run `npm install gh-pages --save-dev`
3. ✅ Create `.github/workflows/scrape-jobs.yml` for automation
4. ✅ Deploy: `npm run deploy`
5. ✅ Visit your live site!

---

## Additional Resources

- **GitHub Pages Docs:** https://pages.github.com/
- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **Cron Schedule Helper:** https://crontab.guru
- **React Build Guide:** https://create-react-app.dev/deployment

---

## Cost Breakdown

| Component | Cost | Notes |
|-----------|------|-------|
| GitHub Pages | **Free** | Unlimited hosting |
| GitHub Actions | **Free** | 2000 min/month free tier |
| Domain (optional) | $10-15/year | Add custom domain |
| **Total** | **$0** | All free! |

---

Enjoy your automated job search platform! 🚀

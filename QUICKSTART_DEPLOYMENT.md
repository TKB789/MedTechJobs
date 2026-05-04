# 🚀 Quick Start: Deploy Your Job Search App

## 5-Minute Setup to Go Live

### Step 1: Update Your Web App Config (2 minutes)

Replace `yourusername` in your GitHub repo:

**File:** `web_app/package.json`

Change line 4:
```json
"homepage": "https://yourusername.github.io/medical-device-job-scraper",
```

Replace `yourusername` with your actual GitHub username!

### Step 2: Add GitHub Actions Automation (1 minute)

1. In your repo, create this folder structure:
   ```
   .github/workflows/
   ```

2. Create file: `.github/workflows/scrape-jobs.yml`

3. Copy the workflow file contents from `GITHUB_PAGES_DEPLOYMENT.md`

4. Push to GitHub:
   ```bash
   git add .github/workflows/scrape-jobs.yml
   git commit -m "Add automated job scraping"
   git push origin main
   ```

### Step 3: Install and Deploy (2 minutes)

```bash
# Navigate to web app folder
cd web_app

# Install gh-pages (if not already installed)
npm install gh-pages --save-dev

# Deploy to GitHub Pages
npm run deploy
```

### Step 4: Enable GitHub Pages

1. Go to your GitHub repo
2. Click **Settings** → **Pages**
3. Under "Source", select **Deploy from a branch**
4. Choose **gh-pages** branch
5. Click **Save**

### ✅ Done! Your app is live!

Visit: `https://yourusername.github.io/medical-device-job-scraper`

---

## What Happens Next

- **Every day at 2 AM UTC**, GitHub Actions automatically:
  - Runs the job scraper
  - Collects jobs from 30+ companies
  - Saves data to your repo
  - Your app loads the latest jobs

- **Users can:**
  - View all medical device jobs
  - Filter by company, location, job type
  - Save favorite jobs
  - Create custom job alerts
  - Export data

---

## First Time Using It?

### Test Locally First
```bash
cd web_app
npm install
npm start
```

Visit `http://localhost:3000` to see it work locally before deploying.

### Update Job Data Manually (Optional)

If you want to test with fresh data:

```bash
# Run scraper
cd scrapy_spider
pip install -r requirements.txt
python medical_device_jobs_scraper.py

# Copy results to web app
cp medical_device_jobs_*.json ../docs/jobs_data.json

# Update repo
cd ..
git add docs/jobs_data.json
git commit -m "Update job data"
git push

# Redeploy app
cd web_app
npm run deploy
```

---

## Troubleshooting

**Q: Site shows 404 error**
- A: Wait 5-10 minutes after deploying, GitHub Pages takes time to update

**Q: Site shows demo jobs, not real jobs**
- A: Jobs will load once scraper runs (daily) or you manually run it

**Q: Scraper not running automatically**
- A: Go to **Actions** tab → Check logs for errors

**Q: Changes not showing on live site**
- A: Clear browser cache (Ctrl+Shift+Delete) or use incognito mode

---

## Your Live App Features

✨ **What your visitors can do:**
- Search jobs by title, company, location
- Filter by job type and department
- Save favorite jobs (browser storage)
- Set up job alerts with keywords
- Export results as JSON
- View posting dates and links
- Direct links to apply on company sites

---

## Advanced Options

Want to do more? Check out:
- `GITHUB_PAGES_DEPLOYMENT.md` - Full deployment guide
- `SETUP_GUIDE.md` - Configuration options
- `CONTRIBUTING.md` - How to improve the project

---

## Share Your App!

Once live, share the URL:
```
https://yourusername.github.io/medical-device-job-scraper
```

Perfect for:
- LinkedIn posts
- Your resume
- Portfolio projects
- Job interview discussions

---

## Support

Having issues? Check:
1. Browser console (F12 → Console tab) for JavaScript errors
2. GitHub Actions tab for scraper errors
3. README.md for general info
4. GITHUB_PAGES_DEPLOYMENT.md for detailed help

---

You're all set! 🎉

Your medical device job search platform is now live and automatically updating every day!

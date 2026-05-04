# 📋 Step-by-Step: Deploy & Access Your Job Search App

## THE FLOW: How Everything Works Together

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR JOB SEARCH SYSTEM                   │
└─────────────────────────────────────────────────────────────┘

EVERY DAY (Automatic via GitHub Actions):
┌──────────────────────────────────────────────────────────────┐
│  1️⃣  GITHUB ACTIONS RUNS SCRAPER                             │
│     └─→ Scrapes 30+ medical device company websites         │
│     └─→ Collects: job title, company, location, type, date  │
│     └─→ Creates JSON file with all jobs                     │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  2️⃣  DATA SAVED TO YOUR GITHUB REPOSITORY                   │
│     └─→ File: docs/jobs_data.json                           │
│     └─→ Always available to your React app                  │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  3️⃣  REACT APP LOADS FRESH JOB DATA                         │
│     └─→ Your web app displays latest jobs                   │
│     └─→ Users can search, filter, save jobs                 │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  4️⃣  LIVE ON GITHUB PAGES                                   │
│     └─→ URL: https://yourusername.github.io/medical-device- │
│            job-scraper                                      │
│     └─→ Anyone can access it 24/7                           │
└──────────────────────────────────────────────────────────────┘
```

---

## ⚡ QUICK DEPLOYMENT (5 minutes)

### STEP 1: Update Web App Config

**File to edit:** `web_app/package.json`

```json
{
  "homepage": "https://yourusername.github.io/medical-device-job-scraper",
  ...
}
```

Change `yourusername` to your GitHub username!

**⏱️ Time: 30 seconds**

---

### STEP 2: Add Automation File

**Create:** `.github/workflows/scrape-jobs.yml`

Copy content from the workflow file I provided.

**⏱️ Time: 1 minute**

---

### STEP 3: Install Deployment Tool

```bash
cd web_app
npm install gh-pages --save-dev
```

**⏱️ Time: 1 minute**

---

### STEP 4: Deploy to GitHub Pages

```bash
npm run deploy
```

This:
- Builds your React app
- Creates optimized files
- Pushes to `gh-pages` branch
- GitHub Pages automatically hosts it

**⏱️ Time: 2 minutes**

---

### STEP 5: Enable GitHub Pages

1. Go to GitHub repo → **Settings**
2. Left sidebar → **Pages**
3. Source: Select **gh-pages** branch
4. Click **Save**

**⏱️ Time: 30 seconds**

---

### ✅ DONE! 

Your app is live at: `https://yourusername.github.io/medical-device-job-scraper`

---

## 🔄 WHAT HAPPENS AUTOMATICALLY

### Every Day at 2 AM UTC:

1. **GitHub Actions wakes up** (automatic)
2. **Runs the scraper** (pulls latest jobs)
3. **Creates JSON file** (medical_device_jobs_*.json)
4. **Pushes to repository** (docs/jobs_data.json)
5. **Your React app loads it** (users see fresh jobs)

**Result:** Your site always has up-to-date job listings! ✨

---

## 📱 WHAT USERS SEE

### Visit: `https://yourusername.github.io/medical-device-job-scraper`

They can:

✅ **Search & Filter**
```
Search: "Software Engineer"
Company: Medtronic
Location: Minnesota
Job Type: Full-time
Department: Engineering
```

✅ **Save Favorite Jobs**
```
Click ❤️ to save
Jobs stored locally (browser memory)
```

✅ **Create Alerts**
```
Keyword: "DevOps Engineer"
Company: "Johnson & Johnson"
Location: "New York"
Notification: Email or browser
```

✅ **Export Data**
```
Download filtered jobs as JSON
Use in Excel/sheets
Share with others
```

---

## 🎯 FULL WORKFLOW EXAMPLE

### Day 1: Setup (One-time)

```bash
# 1. Clone your repo
git clone https://github.com/yourusername/medical-device-job-scraper.git
cd medical-device-job-scraper

# 2. Update package.json with your username
# Edit: web_app/package.json
# Change: "yourusername" to your actual GitHub username

# 3. Create automation file
# Create: .github/workflows/scrape-jobs.yml
# Copy workflow content

# 4. Install and deploy
cd web_app
npm install gh-pages --save-dev
npm run deploy

# 5. Enable in GitHub Settings
# Go to Settings → Pages → Select gh-pages branch

# 6. Push workflow to GitHub
cd ..
git add .github/workflows/scrape-jobs.yml
git commit -m "Add automated scraping"
git push origin main
```

**Result:** Website is live! 🎉

### Day 2 Onwards: Automatic

- **2:00 AM UTC daily:** Scraper runs automatically
- **Jobs updated:** Fresh data in your repo
- **App refreshes:** Users see latest listings
- **No action needed:** Fully automated! ✨

---

## 🧪 TEST IT FIRST (Optional)

Before deploying, test locally:

```bash
cd web_app
npm install
npm start
```

Then visit `http://localhost:3000`

You'll see demo jobs to test the interface works.

---

## 📊 EXAMPLE: What Gets Scraped

Your app will have jobs like:

| Company | Job Title | Location | Type | Posted |
|---------|-----------|----------|------|--------|
| Medtronic | Senior Software Engineer | Minneapolis, MN | Full-time | Apr 28 |
| Johnson & Johnson | Clinical Product Manager | New Brunswick, NJ | Full-time | Apr 25 |
| Abbott | Regulatory Specialist | Abbott Park, IL | Full-time | Apr 18 |
| Boston Scientific | QA Engineer | Marlborough, MA | Full-time | Apr 20 |
| Stryker | Business Dev Manager | San Jose, CA | Full-time | Apr 15 |

**Total:** 100+ fresh jobs from 30+ companies, daily updates

---

## 🔗 YOUR DEPLOYMENT URLS

Once complete, you'll have:

```
📍 Live Web App:
   https://yourusername.github.io/medical-device-job-scraper

📍 GitHub Repository:
   https://github.com/yourusername/medical-device-job-scraper

📍 Job Data File:
   https://github.com/yourusername/medical-device-job-scraper/blob/gh-pages/docs/jobs_data.json
```

---

## ❓ COMMON QUESTIONS

**Q: Will my site really update automatically?**
A: Yes! GitHub Actions runs daily at 2 AM UTC. Jobs are scraped and your site loads the latest data.

**Q: Is it free?**
A: 100% free! GitHub Pages (hosting) + GitHub Actions (automation) are both free.

**Q: Can I share it?**
A: Yes! Share the live URL with friends, on LinkedIn, in job interviews, etc.

**Q: What if something goes wrong?**
A: Check the "Actions" tab on GitHub to see if the scraper ran successfully.

**Q: Can I change the time jobs are scraped?**
A: Yes, edit `.github/workflows/scrape-jobs.yml` and change the cron schedule.

**Q: Can I add more companies?**
A: Yes, edit `scrapy_spider/medical_device_jobs_scraper.py` and add more companies.

---

## 🎓 LEARNING VALUE

This project demonstrates:

```
Frontend:  React, Hooks, State Management, UI/UX
Backend:   Web Scraping, APIs, Data Processing
DevOps:    GitHub Actions, GitHub Pages, CI/CD
Database:  JSON data handling, LocalStorage
Skills:    Full-stack development, automation, deployment
```

Perfect for portfolios & interviews! 💼

---

## 📞 SUPPORT

If anything doesn't work:

1. **Check GitHub Actions logs**
   - Go to "Actions" tab
   - Click the failed workflow
   - See what went wrong

2. **Browser console**
   - Press F12
   - Console tab
   - Look for JavaScript errors

3. **Verify setup**
   - Homepage URL correct in package.json?
   - .github/workflows file created?
   - GitHub Pages enabled?

4. **Read documentation**
   - GITHUB_PAGES_DEPLOYMENT.md (detailed guide)
   - SETUP_GUIDE.md (configuration)
   - README.md (overview)

---

## 🚀 YOU'RE READY!

You now have a **live, automated job search platform** that:

✅ Scrapes jobs daily automatically  
✅ Hosts for free on GitHub Pages  
✅ Updates in real-time  
✅ Works on any device  
✅ Stores no user data on servers  
✅ Completely customizable  

**Your live site:** `https://yourusername.github.io/medical-device-job-scraper`

Enjoy! 🎉

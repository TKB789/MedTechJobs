#!/bin/bash

# Medical Device Job Scraper & Search Website - Quick Start Script
# This script sets up the project and runs the scraper

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Medical Device Job Scraper & Search Website                  ║"
echo "║  Quick Start Setup                                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check Python installation
echo "✓ Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "✗ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
echo "  Found Python $PYTHON_VERSION"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "✗ Failed to install dependencies"
    exit 1
fi

echo "✓ Dependencies installed successfully"
echo ""

# Create output directory
echo "📁 Creating output directory..."
mkdir -p /mnt/user-data/outputs
echo "✓ Output directory ready: /mnt/user-data/outputs"
echo ""

# Run the scraper
echo "🚀 Starting Medical Device Jobs Scraper..."
echo "   Scraping 30+ medical device companies..."
echo "   (This may take several minutes)"
echo ""

python3 medical_device_jobs_scraper.py

if [ $? -eq 0 ]; then
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║  ✓ Scraping Complete!                                         ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "📊 Next Steps:"
    echo ""
    echo "1. LOAD DATA INTO WEB APP:"
    echo "   - Copy the JSON file from /mnt/user-data/outputs/"
    echo "   - Load it into the React app (medical_device_job_search_app.jsx)"
    echo ""
    echo "2. RUN THE WEB APP:"
    echo "   - Copy medical_device_job_search_app.jsx into Claude"
    echo "   - Or run locally: npm install && npm start"
    echo ""
    echo "3. FEATURES AVAILABLE:"
    echo "   ✓ Advanced job filtering (company, location, type, department)"
    echo "   ✓ Save favorite jobs"
    echo "   ✓ Create custom job alerts"
    echo "   ✓ Export job listings"
    echo ""
    echo "📖 For detailed setup instructions, see SETUP_GUIDE.md"
    echo ""
else
    echo "✗ Scraper encountered an error"
    exit 1
fi

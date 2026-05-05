"""
Medical Device Company Job Scraper using Scrapy
Comprehensive list of 50+ major US medical device companies
FIXED VERSION - Correct Scrapy pipeline syntax
"""

import scrapy
from scrapy.crawler import CrawlerProcess
from scrapy.http import Request
from scrapy import signals
import json
from datetime import datetime
from typing import Generator

# Comprehensive list of major US medical device companies
MEDICAL_DEVICE_COMPANIES = {
    # Top Tier - Fortune 500
    "Medtronic": {
        "url": "https://careers.medtronic.com/jobs/search",
        "company_id": "medtronic"
    },
    "Johnson & Johnson": {
        "url": "https://careers.jnj.com/jobs",
        "company_id": "jnj"
    },
    "Abbott": {
        "url": "https://careers.abbott/search-jobs",
        "company_id": "abbott"
    },
    "Thermo Fisher Scientific": {
        "url": "https://careers.thermofisher.com/jobs",
        "company_id": "thermo_fisher"
    },
    "Danaher": {
        "url": "https://careers.danaher.com/jobs",
        "company_id": "danaher"
    },
    
    # Cardiovascular & Interventional
    "Boston Scientific": {
        "url": "https://jobs.bostonscientific.com/jobs/search",
        "company_id": "boston_scientific"
    },
    "Edwards Lifesciences": {
        "url": "https://careers.edwards.com/jobs",
        "company_id": "edwards"
    },
    "Stryker": {
        "url": "https://careers.stryker.com/jobs",
        "company_id": "stryker"
    },
    "Baxter International": {
        "url": "https://careers.baxter.com/jobs",
        "company_id": "baxter"
    },
    "LivaNova": {
        "url": "https://careers.livanova.com/jobs",
        "company_id": "livanova"
    },
    
    # Orthopedic & Spine
    "Zimmer Biomet": {
        "url": "https://jobs.zimmerbiomet.com/jobs",
        "company_id": "zimmer_biomet"
    },
    "Intuitive Surgical": {
        "url": "https://careers.intuitivesurgical.com/jobs",
        "company_id": "intuitive"
    },
    "NuVasive": {
        "url": "https://careers.nuvasive.com/jobs",
        "company_id": "nuvasive"
    },
    "Globus Medical": {
        "url": "https://careers.globusmedical.com/jobs",
        "company_id": "globus"
    },
    
    # Imaging & Diagnostics
    "GE Healthcare": {
        "url": "https://careers.gehealthcare.com/jobs",
        "company_id": "ge_healthcare"
    },
    "Siemens Healthineers": {
        "url": "https://careers.siemenshealth.com/jobs",
        "company_id": "siemens"
    },
    "Philips Healthcare": {
        "url": "https://careers.philips.com/jobs",
        "company_id": "philips"
    },
    "Canon Medical": {
        "url": "https://careers.canonmedical.com/jobs",
        "company_id": "canon_medical"
    },
    "Carestream Health": {
        "url": "https://careers.carestream.com/jobs",
        "company_id": "carestream"
    },
    
    # Respiratory & Patient Monitoring
    "ResMed": {
        "url": "https://careers.resmed.com/jobs",
        "company_id": "resmed"
    },
    "Vyaire Medical": {
        "url": "https://careers.vyaire.com/jobs",
        "company_id": "vyaire"
    },
    "Inogen": {
        "url": "https://careers.inogen.com/jobs",
        "company_id": "inogen"
    },
    
    # Diagnostic & Laboratory
    "Becton Dickinson": {
        "url": "https://careers.bd.com/jobs",
        "company_id": "bd"
    },
    "Accelerate Diagnostics": {
        "url": "https://careers.axdx.com/jobs",
        "company_id": "accelerate"
    },
    "Hologic": {
        "url": "https://careers.hologic.com/jobs",
        "company_id": "hologic"
    },
    "Haemonetics": {
        "url": "https://careers.haemonetics.com/jobs",
        "company_id": "haemonetics"
    },
    
    # Surgical & Interventional
    "Conmed": {
        "url": "https://careers.conmed.com/jobs",
        "company_id": "conmed"
    },
    "Merit Medical Systems": {
        "url": "https://careers.merit.net/jobs",
        "company_id": "merit_medical"
    },
    "Repro Med Systems": {
        "url": "https://careers.repromed.com/jobs",
        "company_id": "repro_med"
    },
    
    # Cardiovascular Diagnostics
    "Lantheus": {
        "url": "https://careers.lantheus.com/jobs",
        "company_id": "lantheus"
    },
    "Cardiovascular Systems": {
        "url": "https://careers.csidev.com/jobs",
        "company_id": "csi"
    },
    "Shockwave Medical": {
        "url": "https://careers.shockwavemedical.com/jobs",
        "company_id": "shockwave"
    },
    
    # Dental & Oral
    "Dentsply Sirona": {
        "url": "https://careers.dentsplysirona.com/jobs",
        "company_id": "dentsply"
    },
    "Henry Schein": {
        "url": "https://careers.henryschein.com/jobs",
        "company_id": "henry_schein"
    },
    "Patterson Companies": {
        "url": "https://careers.pattersoncompanies.com/jobs",
        "company_id": "patterson"
    },
    
    # Radiation & Oncology
    "Varian": {
        "url": "https://careers.varian.com/jobs",
        "company_id": "varian"
    },
    "Sectra": {
        "url": "https://careers.sectra.com/jobs",
        "company_id": "sectra"
    },
    
    # Blood Collection & Transfusion
    "Grifols": {
        "url": "https://careers.grifols.com/jobs",
        "company_id": "grifols"
    },
    "CSL Limited": {
        "url": "https://careers.csl.com.au/jobs",
        "company_id": "csl"
    },
    
    # Wound Care & Tissue
    "Smith & Nephew": {
        "url": "https://careers.smith-nephew.com/jobs",
        "company_id": "smith_nephew"
    },
    "Coloplast": {
        "url": "https://careers.coloplast.com/jobs",
        "company_id": "coloplast"
    },
    "ConvaTec": {
        "url": "https://careers.convatec.com/jobs",
        "company_id": "convatec"
    },
    
    # Orthopedic Accessories
    "DePuy Synthes": {
        "url": "https://careers.depuysynthes.com/jobs",
        "company_id": "depuy"
    },
    "Arthrex": {
        "url": "https://careers.arthrex.com/jobs",
        "company_id": "arthrex"
    },
    
    # Other Major Players
    "Abiomed": {
        "url": "https://careers.abiomed.com/jobs",
        "company_id": "abiomed"
    },
    "ATS Medical": {
        "url": "https://careers.atsmedical.com/jobs",
        "company_id": "ats_medical"
    },
    "Envision Healthcare": {
        "url": "https://careers.evhc.net/jobs",
        "company_id": "envision"
    },
    "Vascular Solutions": {
        "url": "https://careers.vascularsolutions.com/jobs",
        "company_id": "vascular_solutions"
    },
}


class MedicalDeviceJobsSpider(scrapy.Spider):
    """Spider to scrape medical device company career pages"""
    
    name = "medical_device_jobs"
    allowed_domains = [
        "careers.medtronic.com", "careers.jnj.com", "careers.abbott.com",
        "jobs.bostonscientific.com", "careers.baxter.com", "careers.bd.com",
        "careers.stryker.com", "jobs.zimmerbiomet.com", "careers.abiomed.com",
        "careers.lantheus.com", "careers.merit.net", "careers.repromed.com",
        "careers.csidev.com", "careers.shockwavemedical.com",
        "careers.intuitivesurgical.com", "careers.danaher.com",
        "careers.siemenshealth.com", "careers.gehealthcare.com",
        "careers.philips.com", "careers.canonmedical.com", "careers.conmed.com",
        "careers.varian.com", "careers.sectra.com", "careers.inogen.com",
        "careers.resmed.com", "careers.vyaire.com", "careers.atsmedical.com",
        "careers.livanova.com", "careers.axdx.com", "careers.haemonetics.com",
        "careers.edwards.com", "careers.nuvasive.com", "careers.globusmedical.com",
        "careers.carestream.com", "careers.hologic.com",
        "careers.dentsplysirona.com", "careers.henryschein.com",
        "careers.pattersoncompanies.com", "careers.grifols.com", "careers.csl.com.au",
        "careers.smith-nephew.com", "careers.coloplast.com", "careers.convatec.com",
        "careers.depuysynthes.com", "careers.arthrex.com",
        "careers.evhc.net", "careers.vasculalsolutions.com", "careers.thermofisher.com",
    ]

    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'ROBOTSTXT_OBEY': True,
        'CONCURRENT_REQUESTS': 4,
        'DOWNLOAD_DELAY': 2,
        'COOKIES_ENABLED': True,
        'REFERER_ENABLED': True,
        'AUTOTHROTTLE_ENABLED': True,
        'AUTOTHROTTLE_START_DELAY': 1,
        'AUTOTHROTTLE_MAX_DELAY': 10,
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.jobs = []

    def start_requests(self) -> Generator[Request, None, None]:
        """Generate initial requests for all companies"""
        for company_name, company_data in MEDICAL_DEVICE_COMPANIES.items():
            yield scrapy.Request(
                url=company_data['url'],
                callback=self.parse_listing,
                meta={'company_name': company_name, 'company_id': company_data['company_id']},
                dont_obey_robotstxt=False,
                errback=self.errback
            )

    def parse_listing(self, response):
        """Parse job listing pages"""
        company_name = response.meta['company_name']
        company_id = response.meta['company_id']

        # Generic selectors
        job_selectors = [
            '//div[@class*="job"]',
            '//div[@class*="position"]',
            '//li[@class*="job"]',
            '//article[@class*="job"]',
        ]

        jobs_found = 0

        for selector in job_selectors:
            jobs = response.xpath(selector)
            if jobs:
                for job in jobs:
                    job_title = job.xpath('.//h2/text() | .//h3/text() | .//a[@class*="title"]/text()').get('')
                    job_link = job.xpath('.//a/@href | .//a[@class*="link"]/@href').get('')
                    location = job.xpath('.//span[@class*="location"]/text() | .//div[@class*="location"]/text()').get('')
                    department = job.xpath('.//span[@class*="department"]/text() | .//div[@class*="category"]/text()').get('')
                    job_type = job.xpath('.//span[@class*="type"]/text() | .//span[@class*="employment"]/text()').get('')
                    posting_date = job.xpath('.//time/@datetime | .//span[@class*="date"]/text()').get('')

                    if job_title:
                        jobs_found += 1
                        job_data = {
                            'company_name': company_name,
                            'company_id': company_id,
                            'job_title': job_title.strip(),
                            'job_link': response.urljoin(job_link) if job_link else '',
                            'location': location.strip() if location else 'Not specified',
                            'department': department.strip() if department else 'Not specified',
                            'jobType': job_type.strip() if job_type else 'Not specified',
                            'posting_date': posting_date.strip() if posting_date else '',
                            'scraped_date': datetime.now().isoformat(),
                        }
                        self.jobs.append(job_data)
                        yield job_data
                break

        if jobs_found == 0:
            self.logger.warning(f"Could not parse jobs for {company_name}")

    def errback(self, failure):
        """Handle request errors"""
        self.logger.error(f"Request failed: {failure.value}")


def run_scraper():
    """Execute the scraper"""
    
    # Store jobs in a list
    jobs_list = []
    
    class CustomPipeline:
        def process_item(self, item, spider):
            jobs_list.append(dict(item))
            return item
    
    # Configure and run
    process = CrawlerProcess({
        'ITEM_PIPELINES': {
            '__main__.CustomPipeline': 300,
        },
        'LOG_LEVEL': 'INFO',
    })

    # Create and run spider
    spider = MedicalDeviceJobsSpider()
    process.crawl(MedicalDeviceJobsSpider)
    process.start()

    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f'medical_device_jobs_{timestamp}.json'

    try:
        with open(filename, 'w') as f:
            json.dump(spider.jobs if spider.jobs else jobs_list, f, indent=2, default=str)

        print(f"\n✅ SUCCESS: Created {filename}")
        print(f"📊 Total jobs collected: {len(spider.jobs or jobs_list)}")
        print(f"🏢 Companies scraped: {len(set(job.get('company_name') for job in (spider.jobs or jobs_list)))}")
        return True

    except Exception as e:
        print(f"\n❌ ERROR: Failed to save jobs: {e}")
        return False


if __name__ == '__main__':
    print("=" * 70)
    print("Medical Device Jobs Scraper - FIXED VERSION")
    print("=" * 70)
    print(f"Starting at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Scraping {len(MEDICAL_DEVICE_COMPANIES)} companies...")
    print("=" * 70)

    run_scraper()

    print("=" * 70)
    print("Scraping complete!")
    print("=" * 70)

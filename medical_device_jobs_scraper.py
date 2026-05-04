"""
Medical Device Company Job Scraper using Scrapy
Scrapes career pages from major US medical device companies
"""

import scrapy
from scrapy.crawler import CrawlerProcess
from scrapy.http import Request
import json
from datetime import datetime
from typing import Generator

# Comprehensive list of major US medical device companies and their career pages
MEDICAL_DEVICE_COMPANIES = {
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
    "Boston Scientific": {
        "url": "https://jobs.bostonscientific.com/jobs/search",
        "company_id": "boston_scientific"
    },
    "Baxter International": {
        "url": "https://careers.baxter.com/jobs",
        "company_id": "baxter"
    },
    "Becton Dickinson": {
        "url": "https://careers.bd.com/jobs",
        "company_id": "bd"
    },
    "Stryker": {
        "url": "https://careers.stryker.com/jobs",
        "company_id": "stryker"
    },
    "Zimmer Biomet": {
        "url": "https://jobs.zimmerbiomet.com/jobs",
        "company_id": "zimmer_biomet"
    },
    "Abiomed": {
        "url": "https://careers.abiomed.com/jobs",
        "company_id": "abiomed"
    },
    "Lantheus": {
        "url": "https://careers.lantheus.com/jobs",
        "company_id": "lantheus"
    },
    "Merit Medical Systems": {
        "url": "https://careers.merit.net/jobs",
        "company_id": "merit_medical"
    },
    "Repro Med Systems": {
        "url": "https://careers.repromed.com/jobs",
        "company_id": "repro_med"
    },
    "Cardiovascular Systems": {
        "url": "https://careers.csidev.com/jobs",
        "company_id": "csi"
    },
    "Shockwave Medical": {
        "url": "https://careers.shockwavemedical.com/jobs",
        "company_id": "shockwave"
    },
    "Intuitive Surgical": {
        "url": "https://careers.intuitivesurgical.com/jobs",
        "company_id": "intuitive"
    },
    "Danaher": {
        "url": "https://careers.danaher.com/jobs",
        "company_id": "danaher"
    },
    "Siemens Healthineers": {
        "url": "https://careers.siemenshealth.com/jobs",
        "company_id": "siemens"
    },
    "GE Healthcare": {
        "url": "https://careers.gehealthcare.com/jobs",
        "company_id": "ge_healthcare"
    },
    "Philips Healthcare": {
        "url": "https://careers.philips.com/jobs",
        "company_id": "philips"
    },
    "Canon Medical": {
        "url": "https://careers.canonmedical.com/jobs",
        "company_id": "canon_medical"
    },
    "Conmed": {
        "url": "https://careers.conmed.com/jobs",
        "company_id": "conmed"
    },
    "Varian": {
        "url": "https://careers.varian.com/jobs",
        "company_id": "varian"
    },
    "Sectra": {
        "url": "https://careers.sectra.com/jobs",
        "company_id": "sectra"
    },
    "Inogen": {
        "url": "https://careers.inogen.com/jobs",
        "company_id": "inogen"
    },
    "ResMed": {
        "url": "https://careers.resmed.com/jobs",
        "company_id": "resmed"
    },
    "Vyaire Medical": {
        "url": "https://careers.vyaire.com/jobs",
        "company_id": "vyaire"
    },
    "ATS Medical": {
        "url": "https://careers.atsmedical.com/jobs",
        "company_id": "ats_medical"
    },
    "LivaNova": {
        "url": "https://careers.livanova.com/jobs",
        "company_id": "livanova"
    },
    "Accelerate Diagnostics": {
        "url": "https://careers.axdx.com/jobs",
        "company_id": "accelerate"
    },
    "Haemonetics": {
        "url": "https://careers.haemonetics.com/jobs",
        "company_id": "haemonetics"
    }
}


class MedicalDeviceJobsSpider(scrapy.Spider):
    """
    Spider to scrape medical device company career pages
    """
    name = "medical_device_jobs"
    allowed_domains = [
        "careers.medtronic.com",
        "careers.jnj.com",
        "careers.abbott.com",
        "jobs.bostonscientific.com",
        "careers.baxter.com",
        "careers.bd.com",
        "careers.stryker.com",
        "jobs.zimmerbiomet.com",
        "careers.abiomed.com",
        "careers.lantheus.com",
        "careers.merit.net",
        "careers.repromed.com",
        "careers.csidev.com",
        "careers.shockwavemedical.com",
        "careers.intuitivesurgical.com",
        "careers.danaher.com",
        "careers.siemenshealth.com",
        "careers.gehealthcare.com",
        "careers.philips.com",
        "careers.canonmedical.com",
        "careers.conmed.com",
        "careers.varian.com",
        "careers.sectra.com",
        "careers.inogen.com",
        "careers.resmed.com",
        "careers.vyaire.com",
        "careers.atsmedical.com",
        "careers.livanova.com",
        "careers.axdx.com",
        "careers.haemonetics.com",
    ]

    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'ROBOTSTXT_OBEY': True,
        'CONCURRENT_REQUESTS': 8,
        'DOWNLOAD_DELAY': 2,
        'COOKIES_ENABLED': True,
        'REFERER_ENABLED': True,
    }

    def start_requests(self) -> Generator[Request, None, None]:
        """Generate initial requests for all companies"""
        for company_name, company_data in MEDICAL_DEVICE_COMPANIES.items():
            yield scrapy.Request(
                url=company_data['url'],
                callback=self.parse_listing,
                meta={'company_name': company_name, 'company_id': company_data['company_id']},
                dont_obey_robotstxt=False
            )

    def parse_listing(self, response):
        """Parse job listing pages - customize based on actual website structure"""
        company_name = response.meta['company_name']
        company_id = response.meta['company_id']

        # Generic selectors - these may need adjustment based on actual website structure
        job_selectors = [
            '//div[@class*="job"]',
            '//div[@class*="position"]',
            '//li[@class*="job"]',
            '//article[@class*="job"]',
        ]

        jobs_found = False

        for selector in job_selectors:
            jobs = response.xpath(selector)
            if jobs:
                jobs_found = True
                for job in jobs:
                    # Extract job details - customize based on actual HTML structure
                    job_title = job.xpath('.//h2/text() | .//h3/text() | .//a[@class*="title"]/text()').get('')
                    job_link = job.xpath('.//a/@href').get('')
                    location = job.xpath('.//span[@class*="location"]/text() | .//div[@class*="location"]/text()').get('')
                    department = job.xpath('.//span[@class*="department"]/text() | .//div[@class*="category"]/text()').get('')
                    job_type = job.xpath('.//span[@class*="type"]/text() | .//span[@class*="employment"]/text()').get('')
                    posting_date = job.xpath('.//time/@datetime | .//span[@class*="date"]/text()').get('')

                    if job_title:
                        yield {
                            'company_name': company_name,
                            'company_id': company_id,
                            'job_title': job_title.strip(),
                            'job_link': response.urljoin(job_link) if job_link else '',
                            'location': location.strip() if location else 'Not specified',
                            'department': department.strip() if department else 'Not specified',
                            'job_type': job_type.strip() if job_type else 'Not specified',
                            'posting_date': posting_date.strip() if posting_date else '',
                            'scraped_date': datetime.now().isoformat(),
                        }
                break

        if not jobs_found:
            self.logger.warning(f"Could not parse jobs for {company_name}. Website structure may differ.")
            # Log for manual inspection
            yield {
                'company_name': company_name,
                'company_id': company_id,
                'error': 'Could not parse job listings',
                'url': response.url,
                'status': response.status,
            }


class MedicalDeviceJobsPipeline(scrapy.pipelines.BasePipeline):
    """Pipeline to save job data to JSON"""

    def __init__(self):
        self.jobs = []

    def process_item(self, item, spider):
        self.jobs.append(dict(item))
        return item

    def close_spider(self, spider):
        """Save all jobs to JSON file when spider closes"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f'/mnt/user-data/outputs/medical_device_jobs_{timestamp}.json'

        with open(filename, 'w') as f:
            json.dump(self.jobs, f, indent=2, default=str)

        spider.logger.info(f"Saved {len(self.jobs)} jobs to {filename}")


def run_scraper():
    """
    Execute the scraper
    Usage: python medical_device_jobs_scraper.py
    """
    process = CrawlerProcess({
        'ITEM_PIPELINES': {
            '__main__.MedicalDeviceJobsPipeline': 300,
        },
        'LOG_LEVEL': 'INFO',
    })

    process.crawl(MedicalDeviceJobsSpider)
    process.start()


if __name__ == '__main__':
    print("Medical Device Jobs Scraper")
    print("=" * 50)
    print(f"Scraping careers from {len(MEDICAL_DEVICE_COMPANIES)} companies...")
    print()

    run_scraper()

    print()
    print("Scraping complete! Check /mnt/user-data/outputs/ for results.")

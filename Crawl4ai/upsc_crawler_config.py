"""
UPSC Content Crawler Configuration
Complete configuration for crawling UPSC preparation resources
"""

from dataclasses import dataclass
from typing import List, Dict
from enum import Enum

class UpdateFrequency(Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    REALTIME = "realtime"  # Multiple times per day

class ContentCategory(Enum):
    CURRENT_AFFAIRS = "current_affairs"
    GOVERNMENT_SCHEMES = "government_schemes"
    ECONOMY = "economy"
    POLITY = "polity"
    GEOGRAPHY = "geography"
    HISTORY_CULTURE = "history_culture"
    SCIENCE_TECH = "science_tech"
    ENVIRONMENT = "environment"
    SOCIAL_ISSUES = "social_issues"
    INTERNATIONAL_RELATIONS = "international_relations"
    SECURITY = "security"
    ETHICS = "ethics"
    REPORTS_SURVEYS = "reports_surveys"

@dataclass
class SourceConfig:
    """Configuration for each content source"""
    name: str
    url: str
    category: ContentCategory
    update_frequency: UpdateFrequency
    priority: int  # 1-5, 1 being highest
    requires_auth: bool = False
    rate_limit_delay: float = 3.0  # seconds
    max_retries: int = 3
    timeout: int = 30
    selector: str = None  # CSS selector for main content
    pagination: bool = False
    
# Complete URL Configuration
CRAWLER_SOURCES = [
    
    # ============= DAILY SOURCES (HIGHEST PRIORITY) =============
    
    # PIB - Most Important for Current Affairs
    SourceConfig(
        name="PIB Daily Releases",
        url="https://pib.gov.in/allRel.aspx",
        category=ContentCategory.CURRENT_AFFAIRS,
        update_frequency=UpdateFrequency.DAILY,
        priority=1,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="PIB Ministry Wise",
        url="https://pib.gov.in/ministry/",
        category=ContentCategory.GOVERNMENT_SCHEMES,
        update_frequency=UpdateFrequency.DAILY,
        priority=1,
        rate_limit_delay=2.0
    ),
    
    # The Hindu
    SourceConfig(
        name="The Hindu Editorial",
        url="https://www.thehindu.com/opinion/editorial/",
        category=ContentCategory.CURRENT_AFFAIRS,
        update_frequency=UpdateFrequency.DAILY,
        priority=1,
        rate_limit_delay=3.0
    ),
    SourceConfig(
        name="The Hindu Lead Articles",
        url="https://www.thehindu.com/opinion/lead/",
        category=ContentCategory.CURRENT_AFFAIRS,
        update_frequency=UpdateFrequency.DAILY,
        priority=1,
        rate_limit_delay=3.0
    ),
    SourceConfig(
        name="The Hindu National News",
        url="https://www.thehindu.com/news/national/",
        category=ContentCategory.CURRENT_AFFAIRS,
        update_frequency=UpdateFrequency.DAILY,
        priority=2,
        rate_limit_delay=3.0
    ),
    SourceConfig(
        name="The Hindu Economy",
        url="https://www.thehindu.com/business/Economy/",
        category=ContentCategory.ECONOMY,
        update_frequency=UpdateFrequency.DAILY,
        priority=2,
        rate_limit_delay=3.0
    ),
    SourceConfig(
        name="The Hindu Science & Tech",
        url="https://www.thehindu.com/sci-tech/",
        category=ContentCategory.SCIENCE_TECH,
        update_frequency=UpdateFrequency.DAILY,
        priority=2,
        rate_limit_delay=3.0
    ),
    
    # Indian Express
    SourceConfig(
        name="Indian Express UPSC Current Affairs",
        url="https://indianexpress.com/section/upsc-current-affairs/",
        category=ContentCategory.CURRENT_AFFAIRS,
        update_frequency=UpdateFrequency.DAILY,
        priority=1,
        rate_limit_delay=3.0
    ),
    SourceConfig(
        name="Indian Express Explained",
        url="https://indianexpress.com/section/explained/",
        category=ContentCategory.CURRENT_AFFAIRS,
        update_frequency=UpdateFrequency.DAILY,
        priority=1,
        rate_limit_delay=3.0
    ),
    SourceConfig(
        name="Indian Express Editorials",
        url="https://indianexpress.com/section/opinion/editorials/",
        category=ContentCategory.CURRENT_AFFAIRS,
        update_frequency=UpdateFrequency.DAILY,
        priority=1,
        rate_limit_delay=3.0
    ),
    SourceConfig(
        name="Indian Express Everyday Explainers",
        url="https://indianexpress.com/article/explained/everyday-explainers/",
        category=ContentCategory.CURRENT_AFFAIRS,
        update_frequency=UpdateFrequency.DAILY,
        priority=1,
        rate_limit_delay=3.0
    ),
    
    # Vision IAS
    SourceConfig(
        name="Vision IAS Daily Current Affairs",
        url="https://www.visionias.in/daily-current-affairs",
        category=ContentCategory.CURRENT_AFFAIRS,
        update_frequency=UpdateFrequency.DAILY,
        priority=1,
        rate_limit_delay=4.0
    ),
    SourceConfig(
        name="Vision IAS Current Affairs",
        url="https://www.visionias.in/current-affairs",
        category=ContentCategory.CURRENT_AFFAIRS,
        update_frequency=UpdateFrequency.DAILY,
        priority=1,
        rate_limit_delay=4.0
    ),
    SourceConfig(
        name="Vision IAS PT 365",
        url="https://www.visionias.in/pt-365",
        category=ContentCategory.CURRENT_AFFAIRS,
        update_frequency=UpdateFrequency.DAILY,
        priority=1,
        rate_limit_delay=4.0
    ),
    SourceConfig(
        name="Vision IAS Mains 365",
        url="https://www.visionias.in/mains-365",
        category=ContentCategory.CURRENT_AFFAIRS,
        update_frequency=UpdateFrequency.DAILY,
        priority=1,
        rate_limit_delay=4.0
    ),
    
    # Drishti IAS
    SourceConfig(
        name="Drishti IAS Daily News Analysis",
        url="https://www.drishtiias.com/daily-updates/daily-news-analysis",
        category=ContentCategory.CURRENT_AFFAIRS,
        update_frequency=UpdateFrequency.DAILY,
        priority=1,
        rate_limit_delay=4.0
    ),
    SourceConfig(
        name="Drishti IAS Daily Editorials",
        url="https://www.drishtiias.com/daily-updates/daily-news-editorials",
        category=ContentCategory.CURRENT_AFFAIRS,
        update_frequency=UpdateFrequency.DAILY,
        priority=1,
        rate_limit_delay=4.0
    ),
    SourceConfig(
        name="Drishti IAS Current Affairs",
        url="https://www.drishtiias.com/current-affairs-news-analysis-editorials",
        category=ContentCategory.CURRENT_AFFAIRS,
        update_frequency=UpdateFrequency.DAILY,
        priority=1,
        rate_limit_delay=4.0
    ),
    SourceConfig(
        name="Drishti IAS To The Points",
        url="https://www.drishtiias.com/to-the-points",
        category=ContentCategory.CURRENT_AFFAIRS,
        update_frequency=UpdateFrequency.DAILY,
        priority=2,
        rate_limit_delay=4.0
    ),
    SourceConfig(
        name="Drishti IAS Burning Issues",
        url="https://www.drishtiias.com/burning-issues",
        category=ContentCategory.CURRENT_AFFAIRS,
        update_frequency=UpdateFrequency.DAILY,
        priority=2,
        rate_limit_delay=4.0
    ),
    
    # Insights on India
    SourceConfig(
        name="Insights Today's Article",
        url="https://www.insightsonindia.com/category/today-article/",
        category=ContentCategory.CURRENT_AFFAIRS,
        update_frequency=UpdateFrequency.DAILY,
        priority=2,
        rate_limit_delay=3.0
    ),
    SourceConfig(
        name="Insights Secure Synopsis",
        url="https://www.insightsonindia.com/category/secure-synopsis/",
        category=ContentCategory.CURRENT_AFFAIRS,
        update_frequency=UpdateFrequency.DAILY,
        priority=2,
        rate_limit_delay=3.0
    ),
    
    # ============= GOVERNMENT SOURCES =============
    
    # UPSC Official
    SourceConfig(
        name="UPSC Syllabus",
        url="https://www.upsc.gov.in/syllabus",
        category=ContentCategory.CURRENT_AFFAIRS,
        update_frequency=UpdateFrequency.MONTHLY,
        priority=1,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="UPSC Previous Papers",
        url="https://www.upsc.gov.in/examinations/previous-question-papers",
        category=ContentCategory.CURRENT_AFFAIRS,
        update_frequency=UpdateFrequency.MONTHLY,
        priority=1,
        rate_limit_delay=2.0
    ),
    
    # Government Schemes
    SourceConfig(
        name="All Government Schemes",
        url="https://schemes.gov.in/",
        category=ContentCategory.GOVERNMENT_SCHEMES,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=1,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="India.gov National Portal",
        url="https://www.india.gov.in/",
        category=ContentCategory.GOVERNMENT_SCHEMES,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=2,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="MyGov India",
        url="https://www.mygov.in/",
        category=ContentCategory.GOVERNMENT_SCHEMES,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=2,
        rate_limit_delay=2.0
    ),
    
    # NITI Aayog
    SourceConfig(
        name="NITI Aayog",
        url="https://niti.gov.in/",
        category=ContentCategory.ECONOMY,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=1,
        rate_limit_delay=2.0
    ),
    
    # ============= MAGAZINES =============
    
    SourceConfig(
        name="Yojana Magazine",
        url="https://yojana.gov.in/",
        category=ContentCategory.GOVERNMENT_SCHEMES,
        update_frequency=UpdateFrequency.MONTHLY,
        priority=1,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="Yojana Archive",
        url="https://yojana.gov.in/archive.php",
        category=ContentCategory.GOVERNMENT_SCHEMES,
        update_frequency=UpdateFrequency.MONTHLY,
        priority=1,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="Kurukshetra Magazine",
        url="https://kurukshetra.gov.in/",
        category=ContentCategory.SOCIAL_ISSUES,
        update_frequency=UpdateFrequency.MONTHLY,
        priority=1,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="Kurukshetra Archive",
        url="https://kurukshetra.gov.in/archive",
        category=ContentCategory.SOCIAL_ISSUES,
        update_frequency=UpdateFrequency.MONTHLY,
        priority=1,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="Vision IAS Monthly Magazine",
        url="https://www.visionias.in/monthly-magazine",
        category=ContentCategory.CURRENT_AFFAIRS,
        update_frequency=UpdateFrequency.MONTHLY,
        priority=1,
        rate_limit_delay=4.0
    ),
    
    # ============= ECONOMY =============
    
    SourceConfig(
        name="Reserve Bank of India",
        url="https://www.rbi.org.in/",
        category=ContentCategory.ECONOMY,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=1,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="Ministry of Finance",
        url="https://www.mof.gov.in/",
        category=ContentCategory.ECONOMY,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=1,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="Department of Economic Affairs",
        url="https://dea.gov.in/",
        category=ContentCategory.ECONOMY,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=1,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="India Budget",
        url="https://www.indiabudget.gov.in/",
        category=ContentCategory.ECONOMY,
        update_frequency=UpdateFrequency.MONTHLY,
        priority=1,
        rate_limit_delay=2.0
    ),
    
    # ============= MINISTRIES =============
    
    SourceConfig(
        name="Ministry of External Affairs",
        url="https://www.mea.gov.in/",
        category=ContentCategory.INTERNATIONAL_RELATIONS,
        update_frequency=UpdateFrequency.DAILY,
        priority=2,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="Ministry of Home Affairs",
        url="https://www.mha.gov.in/",
        category=ContentCategory.SECURITY,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=2,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="Department of Science & Technology",
        url="https://dst.gov.in/",
        category=ContentCategory.SCIENCE_TECH,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=2,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="Ministry of Environment",
        url="https://moef.gov.in/",
        category=ContentCategory.ENVIRONMENT,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=2,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="Ministry of Education",
        url="https://www.education.gov.in/",
        category=ContentCategory.SOCIAL_ISSUES,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=2,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="Ministry of Health",
        url="https://www.mohfw.gov.in/",
        category=ContentCategory.SOCIAL_ISSUES,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=2,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="Ministry of Agriculture",
        url="https://agricoop.gov.in/",
        category=ContentCategory.ECONOMY,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=2,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="Ministry of Rural Development",
        url="https://rural.nic.in/",
        category=ContentCategory.SOCIAL_ISSUES,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=2,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="Women & Child Development",
        url="https://wcd.nic.in/",
        category=ContentCategory.SOCIAL_ISSUES,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=2,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="Ministry of Social Justice",
        url="https://socialjustice.gov.in/",
        category=ContentCategory.SOCIAL_ISSUES,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=2,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="Law Ministry",
        url="https://lawmin.gov.in/",
        category=ContentCategory.POLITY,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=2,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="Department of Justice",
        url="https://doj.gov.in/",
        category=ContentCategory.POLITY,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=2,
        rate_limit_delay=2.0
    ),
    
    # ============= REPORTS & SURVEYS =============
    
    SourceConfig(
        name="Census India",
        url="https://censusindia.gov.in/",
        category=ContentCategory.REPORTS_SURVEYS,
        update_frequency=UpdateFrequency.MONTHLY,
        priority=2,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="Ministry of Statistics",
        url="https://www.mospi.gov.in/",
        category=ContentCategory.REPORTS_SURVEYS,
        update_frequency=UpdateFrequency.MONTHLY,
        priority=2,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="World Bank India",
        url="https://www.worldbank.org/en/country/india",
        category=ContentCategory.ECONOMY,
        update_frequency=UpdateFrequency.MONTHLY,
        priority=2,
        rate_limit_delay=3.0
    ),
    SourceConfig(
        name="IMF India",
        url="https://www.imf.org/en/Countries/IND",
        category=ContentCategory.ECONOMY,
        update_frequency=UpdateFrequency.MONTHLY,
        priority=2,
        rate_limit_delay=3.0
    ),
    SourceConfig(
        name="UNDP India",
        url="https://www.undp.org/india",
        category=ContentCategory.REPORTS_SURVEYS,
        update_frequency=UpdateFrequency.MONTHLY,
        priority=2,
        rate_limit_delay=3.0
    ),
    SourceConfig(
        name="Human Development Report",
        url="https://hdr.undp.org/",
        category=ContentCategory.REPORTS_SURVEYS,
        update_frequency=UpdateFrequency.MONTHLY,
        priority=2,
        rate_limit_delay=3.0
    ),
    
    # ============= ENVIRONMENT =============
    
    SourceConfig(
        name="Down to Earth",
        url="https://www.downtoearth.org.in/",
        category=ContentCategory.ENVIRONMENT,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=2,
        rate_limit_delay=3.0
    ),
    SourceConfig(
        name="IPCC Reports",
        url="https://www.ipcc.ch/",
        category=ContentCategory.ENVIRONMENT,
        update_frequency=UpdateFrequency.MONTHLY,
        priority=2,
        rate_limit_delay=3.0
    ),
    
    # ============= SCIENCE & TECHNOLOGY =============
    
    SourceConfig(
        name="ISRO",
        url="https://www.isro.gov.in/",
        category=ContentCategory.SCIENCE_TECH,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=2,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="Department of Atomic Energy",
        url="https://dae.gov.in/",
        category=ContentCategory.SCIENCE_TECH,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=2,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="DRDO",
        url="https://www.drdo.gov.in/",
        category=ContentCategory.SCIENCE_TECH,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=2,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="CSIR",
        url="https://www.csir.res.in/",
        category=ContentCategory.SCIENCE_TECH,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=2,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="Vigyan Prasar",
        url="https://vigyanprasar.gov.in/",
        category=ContentCategory.SCIENCE_TECH,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=3,
        rate_limit_delay=2.0
    ),
    
    # ============= GEOGRAPHY =============
    
    SourceConfig(
        name="India Meteorological Department",
        url="https://www.imd.gov.in/",
        category=ContentCategory.GEOGRAPHY,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=3,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="INCOIS Oceanography",
        url="https://www.incois.gov.in/",
        category=ContentCategory.GEOGRAPHY,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=3,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="Geological Survey of India",
        url="https://www.gsi.gov.in/",
        category=ContentCategory.GEOGRAPHY,
        update_frequency=UpdateFrequency.MONTHLY,
        priority=3,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="ISRO Bhuvan",
        url="https://bhuvan.nrsc.gov.in/",
        category=ContentCategory.GEOGRAPHY,
        update_frequency=UpdateFrequency.MONTHLY,
        priority=3,
        rate_limit_delay=2.0
    ),
    
    # ============= HISTORY & CULTURE =============
    
    SourceConfig(
        name="Archaeological Survey of India",
        url="https://asi.nic.in/",
        category=ContentCategory.HISTORY_CULTURE,
        update_frequency=UpdateFrequency.MONTHLY,
        priority=3,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="Indian Culture Portal",
        url="https://www.indianculture.gov.in/",
        category=ContentCategory.HISTORY_CULTURE,
        update_frequency=UpdateFrequency.MONTHLY,
        priority=3,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="IGNCA",
        url="https://www.ignca.gov.in/",
        category=ContentCategory.HISTORY_CULTURE,
        update_frequency=UpdateFrequency.MONTHLY,
        priority=3,
        rate_limit_delay=2.0
    ),
    SourceConfig(
        name="Sahitya Akademi",
        url="https://www.sahitya-akademi.gov.in/",
        category=ContentCategory.HISTORY_CULTURE,
        update_frequency=UpdateFrequency.MONTHLY,
        priority=3,
        rate_limit_delay=2.0
    ),
    
    # ============= POLITY & GOVERNANCE =============
    
    SourceConfig(
        name="Legislative Department",
        url="https://legislative.gov.in/",
        category=ContentCategory.POLITY,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=2,
        rate_limit_delay=2.0
    ),
    
    # ============= THINK TANKS =============
    
    SourceConfig(
        name="Observer Research Foundation",
        url="https://www.orfonline.org/",
        category=ContentCategory.INTERNATIONAL_RELATIONS,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=3,
        rate_limit_delay=3.0
    ),
    SourceConfig(
        name="IDSA Defence Studies",
        url="https://www.idsa.in/",
        category=ContentCategory.SECURITY,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=3,
        rate_limit_delay=3.0
    ),
    SourceConfig(
        name="ICRIER Economic Research",
        url="https://www.icrier.org/",
        category=ContentCategory.ECONOMY,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=3,
        rate_limit_delay=3.0
    ),
    SourceConfig(
        name="The Hindu Centre",
        url="https://www.thehinducentre.com/",
        category=ContentCategory.CURRENT_AFFAIRS,
        update_frequency=UpdateFrequency.WEEKLY,
        priority=3,
        rate_limit_delay=3.0
    ),
    
    # ============= PDF RESOURCES =============
    
    SourceConfig(
        name="UPSC PDF",
        url="https://www.upscpdf.com/",
        category=ContentCategory.CURRENT_AFFAIRS,
        update_frequency=UpdateFrequency.DAILY,
        priority=2,
        rate_limit_delay=4.0
    ),
    SourceConfig(
        name="IASbaba",
        url="https://iasbaba.com/",
        category=ContentCategory.CURRENT_AFFAIRS,
        update_frequency=UpdateFrequency.DAILY,
        priority=2,
        rate_limit_delay=4.0
    ),
    SourceConfig(
        name="ClearIAS",
        url="https://www.clearias.com/",
        category=ContentCategory.CURRENT_AFFAIRS,
        update_frequency=UpdateFrequency.DAILY,
        priority=2,
        rate_limit_delay=4.0
    ),
]

# Crawler Settings
CRAWLER_SETTINGS = {
    "user_agent": "UPSC-CSE-Master-Bot/1.0 (Educational Content Aggregator; +https://upsc-cse-master.com)",
    "default_timeout": 30,
    "max_retries": 3,
    "retry_delay": 5,  # seconds
    "respect_robots_txt": True,
    "max_concurrent_requests": 3,
    "request_delay_range": (2, 5),  # random delay between requests
    "enable_javascript": False,  # Set to True if needed for dynamic content
    "verify_ssl": True,
    "follow_redirects": True,
    "max_redirects": 5,
}

# Storage Settings
STORAGE_SETTINGS = {
    "database": "supabase",
    "table_name": "upsc_content",
    "batch_size": 100,
    "enable_versioning": True,
    "compression": True,
    "store_raw_html": True,
    "store_markdown": True,
    "extract_metadata": True,
}

# Scheduling Configuration
SCHEDULE_CONFIG = {
    UpdateFrequency.REALTIME: "*/30 * * * *",  # Every 30 minutes
    UpdateFrequency.DAILY: "0 6 * * *",  # 6 AM daily
    UpdateFrequency.WEEKLY: "0 6 * * 0",  # 6 AM every Sunday
    UpdateFrequency.MONTHLY: "0 6 1 * *",  # 6 AM on 1st of month
}

# Error Handling
ERROR_SETTINGS = {
    "log_level": "INFO",
    "log_file": "crawler_logs.log",
    "alert_on_failure": True,
    "max_consecutive_failures": 3,
    "failure_notification_email": None,  # Set your email
}

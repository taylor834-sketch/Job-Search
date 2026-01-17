import puppeteer from 'puppeteer';
import { format } from 'date-fns';

export const scrapeLinkedIn = async (filters) => {
  const { jobTitle, locationType, companySizes, minSalary, maxSalary } = filters;

  console.log('Scraping LinkedIn...');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const locationMap = {
      'remote': 'Remote',
      'onsite': 'On-site',
      'hybrid': 'Hybrid'
    };

    const locationQuery = locationType?.map(type => locationMap[type]).join(',') || '';
    const searchQuery = encodeURIComponent(jobTitle || 'software engineer');

    const url = `https://www.linkedin.com/jobs/search/?keywords=${searchQuery}&location=${encodeURIComponent(locationQuery)}&f_WT=${locationType?.includes('remote') ? '2' : ''}`;

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    await page.waitForSelector('.jobs-search__results-list', { timeout: 10000 });

    const jobs = await page.evaluate(() => {
      const jobCards = document.querySelectorAll('.base-card');
      const results = [];

      jobCards.forEach(card => {
        const titleElement = card.querySelector('.base-search-card__title');
        const companyElement = card.querySelector('.base-search-card__subtitle');
        const locationElement = card.querySelector('.job-search-card__location');
        const linkElement = card.querySelector('a.base-card__full-link');

        if (titleElement && companyElement && linkElement) {
          results.push({
            title: titleElement.textContent.trim(),
            company: companyElement.textContent.trim(),
            location: locationElement?.textContent.trim() || 'Not specified',
            link: linkElement.href.split('?')[0],
            description: '',
            salary: 'Not specified'
          });
        }
      });

      return results;
    });

    const processedJobs = jobs.map(job => ({
      ...job,
      source: 'LinkedIn',
      datePulled: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      companySize: 'Not specified',
      industry: 'Not specified'
    }));

    console.log(`Found ${processedJobs.length} jobs from LinkedIn`);

    await browser.close();
    return processedJobs;

  } catch (error) {
    console.error('LinkedIn scraper error:', error.message);
    if (browser) await browser.close();
    return [];
  }
};

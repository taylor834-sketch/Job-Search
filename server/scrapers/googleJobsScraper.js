import axios from 'axios';
import * as cheerio from 'cheerio';
import { format } from 'date-fns';

export const scrapeGoogleJobs = async (filters) => {
  const { jobTitle, locationType } = filters;

  console.log('Scraping Google Jobs...');

  try {
    const searchQuery = encodeURIComponent(jobTitle || 'software engineer');
    const locationQuery = locationType?.join(' OR ') || 'remote';

    const url = `https://www.google.com/search?q=${searchQuery}+${encodeURIComponent(locationQuery)}+jobs&ibp=htl;jobs`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);

    const jobs = [];

    $('[data-job-id], .PwjeAc, .iFjolb').each((i, element) => {
      const $el = $(element);

      const title = $el.find('[role="heading"], h2, .BjJfJf').first().text().trim();
      const company = $el.find('.vNEEBe, .nJlQNd').first().text().trim();
      const location = $el.find('.Qk80Jf, .sMzDkb').first().text().trim();
      const description = $el.find('.HBvzbc, .job-snippet').first().text().trim();

      if (title && company) {
        jobs.push({
          title,
          company,
          location: location || 'Not specified',
          link: 'https://www.google.com/search?q=' + encodeURIComponent(`${title} ${company} job`),
          description: description || '',
          salary: 'Not specified',
          source: 'Google Jobs',
          datePulled: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
          companySize: 'Not specified',
          industry: 'Not specified'
        });
      }
    });

    console.log(`Found ${jobs.length} jobs from Google Jobs`);
    return jobs;

  } catch (error) {
    console.error('Google Jobs scraper error:', error.message);
    return [];
  }
};

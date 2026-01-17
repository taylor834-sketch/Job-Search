import axios from 'axios';
import * as cheerio from 'cheerio';
import { format } from 'date-fns';

export const scrapeBuiltIn = async (filters) => {
  const { jobTitle, locationType } = filters;

  console.log('Scraping BuiltIn...');

  try {
    const searchQuery = (jobTitle || 'software engineer').toLowerCase().replace(/\s+/g, '-');

    const locations = ['nationwide'];
    if (locationType?.includes('remote')) {
      locations.push('remote');
    }

    const allJobs = [];

    for (const location of locations) {
      try {
        const url = `https://builtin.com/jobs/${location}/${searchQuery}`;

        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          timeout: 15000
        });

        const $ = cheerio.load(response.data);

        $('.job-item, .job-card').each((i, element) => {
          const $el = $(element);

          const title = $el.find('.job-title, h2 a, .title').first().text().trim();
          const company = $el.find('.company-title, .company-name, .company').first().text().trim();
          const locationText = $el.find('.job-location, .location').first().text().trim();
          const link = $el.find('a').first().attr('href');
          const description = $el.find('.job-description, .description').first().text().trim();
          const salaryText = $el.find('.salary, .compensation').first().text().trim();

          if (title && company) {
            allJobs.push({
              title,
              company,
              location: locationText || location,
              link: link?.startsWith('http') ? link : `https://builtin.com${link}`,
              description: description || '',
              salary: salaryText || 'Not specified',
              source: 'BuiltIn',
              datePulled: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
              companySize: 'Not specified',
              industry: 'Tech'
            });
          }
        });
      } catch (error) {
        console.error(`Error scraping BuiltIn ${location}:`, error.message);
      }
    }

    console.log(`Found ${allJobs.length} jobs from BuiltIn`);
    return allJobs;

  } catch (error) {
    console.error('BuiltIn scraper error:', error.message);
    return [];
  }
};

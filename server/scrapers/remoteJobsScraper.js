import axios from 'axios';
import * as cheerio from 'cheerio';
import { format } from 'date-fns';

export const scrapeRemoteJobs = async (filters) => {
  const { jobTitle } = filters;

  console.log('Scraping Remote Job Sites...');

  const allJobs = [];

  await scrapeRemoteOk(jobTitle, allJobs);
  await scrapeWeWorkRemotely(jobTitle, allJobs);
  await scrapeRemoteCo(jobTitle, allJobs);

  console.log(`Found ${allJobs.length} jobs from Remote Job Sites`);
  return allJobs;
};

const scrapeRemoteOk = async (jobTitle, allJobs) => {
  try {
    const searchQuery = (jobTitle || 'developer').toLowerCase().replace(/\s+/g, '+');
    const url = `https://remoteok.com/remote-${searchQuery}-jobs`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);

    $('tr.job').each((i, element) => {
      const $el = $(element);

      const title = $el.find('.company_and_position h2').text().trim();
      const company = $el.find('.company h3').text().trim();
      const link = $el.attr('data-url');
      const salary = $el.find('.salary').text().trim();
      const tags = $el.find('.tags .tag').map((i, tag) => $(tag).text().trim()).get().join(', ');

      if (title && company) {
        allJobs.push({
          title,
          company,
          location: 'Remote',
          link: link ? `https://remoteok.com${link}` : '',
          description: tags,
          salary: salary || 'Not specified',
          source: 'RemoteOK',
          datePulled: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
          companySize: 'Not specified',
          industry: 'Not specified'
        });
      }
    });
  } catch (error) {
    console.error('RemoteOK scraper error:', error.message);
  }
};

const scrapeWeWorkRemotely = async (jobTitle, allJobs) => {
  try {
    const url = 'https://weworkremotely.com/remote-jobs/search?term=' + encodeURIComponent(jobTitle || 'developer');

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);

    $('li.feature, li').each((i, element) => {
      const $el = $(element);

      const title = $el.find('.title').text().trim();
      const company = $el.find('.company').text().trim();
      const link = $el.find('a').attr('href');

      if (title && company) {
        allJobs.push({
          title,
          company,
          location: 'Remote',
          link: link ? `https://weworkremotely.com${link}` : '',
          description: '',
          salary: 'Not specified',
          source: 'WeWorkRemotely',
          datePulled: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
          companySize: 'Not specified',
          industry: 'Not specified'
        });
      }
    });
  } catch (error) {
    console.error('WeWorkRemotely scraper error:', error.message);
  }
};

const scrapeRemoteCo = async (jobTitle, allJobs) => {
  try {
    const searchQuery = encodeURIComponent(jobTitle || 'developer');
    const url = `https://remote.co/remote-jobs/search/?search_keywords=${searchQuery}`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);

    $('.job_listing, .card').each((i, element) => {
      const $el = $(element);

      const title = $el.find('.job_listing-title, h2, .title').first().text().trim();
      const company = $el.find('.company, .company-name').first().text().trim();
      const link = $el.find('a').first().attr('href');

      if (title && company) {
        allJobs.push({
          title,
          company,
          location: 'Remote',
          link: link?.startsWith('http') ? link : `https://remote.co${link}`,
          description: '',
          salary: 'Not specified',
          source: 'Remote.co',
          datePulled: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
          companySize: 'Not specified',
          industry: 'Not specified'
        });
      }
    });
  } catch (error) {
    console.error('Remote.co scraper error:', error.message);
  }
};

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
  await scrapeStartupJobs(jobTitle, allJobs);

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

const scrapeStartupJobs = async (jobTitle, allJobs) => {
  try {
    const searchQuery = encodeURIComponent(jobTitle || 'developer');
    const url = `https://startup.jobs/api/jobs?search=${searchQuery}`;

    console.log('Scraping Startup.jobs...');

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: 15000
    });

    const jobs = response.data?.jobs || response.data || [];

    jobs.forEach(job => {
      if (job && job.title && job.company) {
        allJobs.push({
          title: job.title,
          company: job.company?.name || job.company || 'Unknown',
          location: job.location || job.remote ? 'Remote' : 'Not specified',
          link: job.url || job.apply_url || `https://startup.jobs/jobs/${job.id || ''}`,
          description: job.description?.substring(0, 300) || job.summary || '',
          salary: job.salary || job.compensation || 'Not specified',
          source: 'Startup.jobs',
          datePulled: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
          postingDate: job.posted_at || job.created_at || format(new Date(), 'yyyy-MM-dd'),
          companySize: job.company?.size || 'Not specified',
          industry: job.category || job.industry || 'Startup'
        });
      }
    });

    console.log(`Startup.jobs returned ${jobs.length} jobs`);
  } catch (error) {
    // If API doesn't work, try scraping the HTML
    if (error.response?.status === 404 || !error.response) {
      try {
        const searchQuery = encodeURIComponent(jobTitle || 'developer');
        const url = `https://startup.jobs/jobs?search=${searchQuery}`;

        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 15000
        });

        const $ = cheerio.load(response.data);

        $('.job, .job-listing, [class*="job"]').each((i, element) => {
          const $el = $(element);

          const title = $el.find('h2, h3, .job-title, [class*="title"]').first().text().trim();
          const company = $el.find('.company, [class*="company"]').first().text().trim();
          const link = $el.find('a').first().attr('href');
          const location = $el.find('.location, [class*="location"]').first().text().trim();
          const salary = $el.find('.salary, [class*="salary"], [class*="compensation"]').first().text().trim();

          if (title && company) {
            allJobs.push({
              title,
              company,
              location: location || 'Not specified',
              link: link?.startsWith('http') ? link : `https://startup.jobs${link}`,
              description: '',
              salary: salary || 'Not specified',
              source: 'Startup.jobs',
              datePulled: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
              companySize: 'Not specified',
              industry: 'Startup'
            });
          }
        });

        console.log(`Startup.jobs HTML scraping found ${allJobs.length} jobs`);
      } catch (htmlError) {
        console.error('Startup.jobs HTML scraper error:', htmlError.message);
      }
    } else {
      console.error('Startup.jobs scraper error:', error.message);
    }
  }
};

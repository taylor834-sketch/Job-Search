import axios from 'axios';
import * as cheerio from 'cheerio';
import { format } from 'date-fns';

// Helper function to extract salary from text
const extractSalaryFromText = (text) => {
  if (!text) return null;

  // Normalize dashes: en-dash and em-dash to regular hyphen
  const normalized = text.replace(/[\u2013\u2014]/g, '-');

  const NUM = '(\\d+k|\\d{1,3}(?:,\\d{3})*)';
  const SEP = '\\s*(?:-|to)\\s*';
  const DOLLAR = '\\$\\s*';
  const SUFFIX_ANNUAL = '(?:\\s*(?:per\\s)?(?:year|yr|annually|\\/year|\\/yr|a year))?';
  const SUFFIX_HOURLY = '\\s*(?:per\\s)?(?:hour|hr|\\/hr|\\/hour)';

  const patterns = [
    // Hourly range: $50 - $70/hr  (must come before annual range)
    new RegExp(DOLLAR + NUM + SEP + '\\$?\\s*' + NUM + SUFFIX_HOURLY, 'gi'),
    // Annual range: $100,000 - $150,000 (with optional /year suffix)
    new RegExp(DOLLAR + NUM + SEP + '\\$?\\s*' + NUM + SUFFIX_ANNUAL, 'gi'),
    // Single hourly: $50/hr, $65/hour, $50 per hour
    new RegExp(DOLLAR + NUM + SUFFIX_HOURLY, 'gi'),
    // Single annual with suffix: $100,000/year, $80,000 per year, $120,000 annually
    new RegExp(DOLLAR + NUM + '\\s*(?:\\+)?\\s*(?:per\\s)?(?:year|yr|annually|\\/year|\\/yr|a year)', 'gi'),
    // Salary/Compensation prefix with range: Salary: $90k - $110k
    new RegExp('(?:salary|compensation|pay|base pay|annual salary)[\\s:]+' + DOLLAR + NUM + SEP + '\\$?\\s*' + NUM, 'gi'),
    // Salary/Compensation prefix single: Compensation: $100k
    new RegExp('(?:salary|compensation|pay|base pay|annual salary)[\\s:]+' + DOLLAR + NUM, 'gi'),
    // Single amount with +: $80,000+
    new RegExp(DOLLAR + NUM + '\\s*\\+', 'gi'),
    // K format range: 80k - 100k
    /(\d{2,3})k\s*(?:-|to)\s*(\d{2,3})k/gi,
    // Bare dollar amount (last resort): $85,000
    new RegExp(DOLLAR + NUM, 'gi')
  ];

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    const match = normalized.match(pattern);
    if (match && match[0]) {
      return match[0].trim();
    }
  }

  return null;
};

// Scrape salary from an actual job posting page
const scrapeSalaryFromPage = async (url) => {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 5000
    });
    const $ = cheerio.load(response.data);

    // Collect text from likely salary-containing elements
    const candidates = [];

    // Common salary container selectors across job sites
    const selectors = [
      '[data-testid*="salary"]', '[class*="salary"]', '[class*="Salary"]',
      '[class*="compensation"]', '[class*="Compensation"]',
      '[class*="pay"]', '[class*="Pay"]',
      '[data-testid*="pay"]', '[aria-label*="salary"]',
      '[aria-label*="Salary"]', '[aria-label*="compensation"]'
    ];

    selectors.forEach(sel => {
      $(sel).each((_, el) => {
        candidates.push($(el).text().trim());
      });
    });

    // Also grab the full page text as a fallback for regex matching
    const bodyText = $('body').text();
    candidates.push(bodyText);

    // Run salary extraction on all candidates
    for (const text of candidates) {
      const extracted = extractSalaryFromText(text);
      if (extracted) return extracted;
    }

    return null;
  } catch (e) {
    return null; // silently fail - salary scraping is best-effort
  }
};

export const searchJSearchAPI = async (filters) => {
  const { jobTitle, locationType, location, minSalary, maxSalary, datePosted } = filters;

  console.log('Searching JSearch API (Google Jobs, LinkedIn, Indeed)...');

  try {
    const apiKey = process.env.JSEARCH_API_KEY;

    if (!apiKey) {
      console.warn('JSearch API key not configured. Skipping JSearch results.');
      return [];
    }

    // Build search query with location if provided
    let query = jobTitle || 'software engineer';

    // Add location for onsite/hybrid jobs
    if (location && (locationType?.includes('onsite') || locationType?.includes('hybrid'))) {
      query = `${query} in ${location}`;
    }

    // Add "remote" to query when remote is selected to get better remote-specific results
    if (locationType?.includes('remote')) {
      query = `${query} remote`;
    }

    // Map datePosted values to JSearch API format
    const datePostedMap = {
      'all': 'all',
      'today': 'today',
      '3days': '3days',
      'week': 'week',
      'month': 'month'
    };

    // Determine if we want ONLY remote jobs
    const isRemoteOnly = locationType?.includes('remote') && locationType.length === 1;

    const headers = {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
    };

    const baseParams = {
      query: query,
      num_pages: '1',
      date_posted: datePostedMap[datePosted] || 'all',
      remote_jobs_only: isRemoteOnly ? 'true' : 'false'
    };

    // Fetch multiple pages sequentially to get more results
    let jobs = [];
    const MAX_PAGES = 5;
    for (let page = 1; page <= MAX_PAGES; page++) {
      try {
        const response = await axios.request({
          method: 'GET',
          url: 'https://jsearch.p.rapidapi.com/search',
          params: { ...baseParams, page: String(page) },
          headers
        });

        const pageJobs = response.data.data || [];
        if (pageJobs.length === 0) break; // No more results
        jobs = jobs.concat(pageJobs);
        console.log(`JSearch page ${page}: ${pageJobs.length} jobs`);
      } catch (pageError) {
        console.warn(`JSearch page ${page} failed:`, pageError.message);
        break; // Stop paginating on error (e.g. rate limit)
      }
    }

    console.log(`JSearch API returned ${jobs.length} total jobs across pages`);

    // Transform JSearch results to our format
    const transformedJobs = jobs.map(job => {
        // Format salary - try multiple fields aggressively
        let salary = 'Not specified';

        // 1. Try API salary fields first
        if (job.job_min_salary || job.job_max_salary) {
          const min = job.job_min_salary ? `$${Math.round(job.job_min_salary).toLocaleString()}` : '';
          const max = job.job_max_salary ? `$${Math.round(job.job_max_salary).toLocaleString()}` : '';
          if (min && max) {
            salary = `${min} - ${max}`;
          } else if (min) {
            salary = `${min}+`;
          } else if (max) {
            salary = `Up to ${max}`;
          }
        }

        // 2. If still not found, try job highlights (all sections)
        if (salary === 'Not specified' && job.job_highlights) {
          const allHighlights = [
            ...(job.job_highlights.Qualifications || []),
            ...(job.job_highlights.Responsibilities || []),
            ...(job.job_highlights.Benefits || [])
          ].join(' ');

          const extracted = extractSalaryFromText(allHighlights);
          if (extracted) {
            salary = extracted;
          }
        }

        // 3. Try full job description
        if (salary === 'Not specified' && job.job_description) {
          const extracted = extractSalaryFromText(job.job_description);
          if (extracted) {
            salary = extracted;
          }
        }

        // 4. Try job title (sometimes salary is in the title)
        if (salary === 'Not specified' && job.job_title) {
          const extracted = extractSalaryFromText(job.job_title);
          if (extracted) {
            salary = extracted;
          }
        }

        // 5. Check job_required_experience or job_required_skills for salary mentions
        if (salary === 'Not specified') {
          const experienceText = job.job_required_experience?.join(' ') || '';
          const extracted = extractSalaryFromText(experienceText);
          if (extracted) {
            salary = extracted;
          }
        }

        // Filter by salary if specified (done after extraction)
        const salaryValue = salary !== 'Not specified' ? parseInt(salary.replace(/[^\d]/g, '')) : 0;
        if (minSalary && salaryValue > 0 && salaryValue < minSalary) {
          return null; // Will be filtered out
        }
        if (maxSalary && salaryValue > maxSalary) {
          return null; // Will be filtered out
        }

        // Additional remote filtering - when Remote Only is selected, filter out hybrid/onsite jobs
        if (isRemoteOnly) {
          const jobTitle = (job.job_title || '').toLowerCase();
          const jobDescription = (job.job_description || '').toLowerCase();
          const jobHighlights = job.job_highlights ?
            [...(job.job_highlights.Qualifications || []),
             ...(job.job_highlights.Responsibilities || []),
             ...(job.job_highlights.Benefits || [])].join(' ').toLowerCase() : '';

          // Comprehensive list of non-remote keywords
          const nonRemoteKeywords = [
            'hybrid',
            'in-office',
            'onsite',
            'on-site',
            'in office',
            'office-based',
            'office based',
            'work from office',
            'days in office',
            'day in office',
            'days per week in',
            'days/week in',
            'x days in',
            '2 days',
            '3 days',
            '4 days',
            'some days',
            'return to office',
            'rto',
            'in person',
            'in-person'
          ];

          // Check title, description, and highlights for non-remote keywords
          const hasNonRemoteKeyword = nonRemoteKeywords.some(keyword =>
            jobTitle.includes(keyword) ||
            jobDescription.includes(keyword) ||
            jobHighlights.includes(keyword)
          );

          // Filter out jobs with specific city locations (remote jobs typically don't have cities)
          // BUT be more lenient - only filter if it has a city AND is not marked as remote
          const hasSpecificCityLocation = job.job_city &&
            job.job_state &&
            !job.job_city.toLowerCase().includes('remote') &&
            !job.job_city.toLowerCase().includes('anywhere') &&
            !job.job_city.toLowerCase().includes('worldwide') &&
            !job.job_is_remote;

          // STRICT: If job mentions any non-remote keywords, filter it out
          if (hasNonRemoteKeyword) {
            return null;
          }

          // Also filter out if it has a specific city location and is NOT marked as remote
          if (hasSpecificCityLocation) {
            return null;
          }
        }

        // Parse posting date - preserve full ISO timestamp so frontend can show accurate relative times
        let postingDate = new Date().toISOString();
        if (job.job_posted_at_datetime_utc) {
          try {
            const parsed = new Date(job.job_posted_at_datetime_utc);
            if (!isNaN(parsed.getTime())) {
              postingDate = parsed.toISOString();
            }
          } catch (e) {
            // Use default if parsing fails
          }
        }

        // Determine the actual source site
        let source = 'Job Board';
        if (job.job_publisher) {
          source = job.job_publisher;
        } else if (job.job_google_link) {
          source = 'Google Jobs';
        } else if (job.job_apply_link) {
          // Try to extract domain from apply link
          try {
            const url = new URL(job.job_apply_link);
            const domain = url.hostname.replace('www.', '');
            if (domain.includes('linkedin')) source = 'LinkedIn';
            else if (domain.includes('indeed')) source = 'Indeed';
            else if (domain.includes('glassdoor')) source = 'Glassdoor';
            else if (domain.includes('ziprecruiter')) source = 'ZipRecruiter';
            else if (domain.includes('monster')) source = 'Monster';
            else source = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
          } catch (e) {
            source = 'Job Board';
          }
        }

        return {
          title: job.job_title || 'No title',
          company: job.employer_name || 'Unknown',
          location: job.job_city && job.job_state
            ? `${job.job_city}, ${job.job_state}`
            : job.job_country || 'Remote',
          link: job.job_apply_link || job.job_google_link || '#',
          description: job.job_description?.substring(0, 300) || 'No description available',
          salary: salary,
          postingDate: postingDate,
          datePulled: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
          source: source
        };
      }).filter(job => job !== null); // Remove filtered out jobs

    // Post-processing: scrape salary from job pages for jobs missing it
    // Limit to 10 concurrent scrapes to avoid hammering servers
    const missingSalary = transformedJobs.filter(j => j.salary === 'Not specified' && j.link && j.link !== '#');
    console.log(`${missingSalary.length} jobs missing salary - attempting to scrape from job pages...`);

    if (missingSalary.length > 0) {
      const SCRAPE_LIMIT = 10;
      const toScrape = missingSalary.slice(0, SCRAPE_LIMIT);

      const scraped = await Promise.all(
        toScrape.map(job => scrapeSalaryFromPage(job.link))
      );

      // Apply scraped salaries back
      let scrapedCount = 0;
      scraped.forEach((salary, i) => {
        if (salary) {
          const idx = transformedJobs.findIndex(j => j.link === toScrape[i].link);
          if (idx !== -1) {
            transformedJobs[idx].salary = salary;
            scrapedCount++;
          }
        }
      });
      console.log(`Scraped salary from job pages for ${scrapedCount} additional jobs`);
    }

    const jobsWithSalary = transformedJobs.filter(job => job.salary !== 'Not specified').length;
    console.log(`Returning ${transformedJobs.length} jobs after filtering (${jobsWithSalary} with salary info)`);

    return transformedJobs;

  } catch (error) {
    if (error.response?.status === 403) {
      console.error('JSearch API: Invalid API key or quota exceeded');
    } else if (error.response?.status === 429) {
      console.error('JSearch API: Rate limit exceeded');
    } else {
      console.error('JSearch API error:', error.message);
    }
    return [];
  }
};

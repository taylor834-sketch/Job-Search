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
      timeout: 8000,
      maxContentLength: 2 * 1024 * 1024 // 2MB cap on response size
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

    // Grab body text as fallback, but cap it to avoid regex thrashing on huge pages
    const bodyText = $('body').text().substring(0, 50000);
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

    // Debug counters — track how many jobs each filter stage drops
    const debug = {
      apiReturned: jobs.length,
      afterRemoteFilter: null,
      afterSalaryFilter: null,
      afterEmploymentFilter: null,
      remoteFilteredOut: 0,
      salaryFilteredOut: 0,
      employmentFilteredOut: 0,
      isRemoteOnly: locationType?.includes('remote') && locationType.length === 1,
      salaryFilter: { min: minSalary ?? null, max: maxSalary ?? null },
      datePosted: datePosted || 'all'
    };

    const employmentTypeMap = {
      'FULL_TIME': 'Full-Time',
      'PART_TIME': 'Part-Time',
      'CONTRACTOR': 'Contract',
      'TEMPORARY': 'Temporary',
      'INTERN': 'Internship',
      'OTHER': null
    };

    // Plain substring keywords — safe to match anywhere
    const nonRemoteKeywords = [
      'hybrid', 'in-office', 'onsite', 'on-site', 'in office',
      'office-based', 'office based', 'work from office',
      'days in office', 'day in office', 'return to office',
      'in person', 'in-person'
    ];

    // Patterns that need context to avoid false positives
    const nonRemotePatterns = [
      /\b\d+\s*days?\s*(per|a|each)\s*week\s*(in|at)\b/i,
      /\b\d+\s*days?\s*(in|at)\s*(the\s+)?office\b/i,
      /\boffice\s*\d+\s*days?\b/i,
      /\b(some|certain)\s*days?\s*(in|at)\s*(the\s+)?office\b/i,
      /\b(rto|return[\s-]*to[\s-]*office)\b/i
    ];

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
        // Parse all dollar amounts (with optional k suffix) and use max for comparison
        if (salary !== 'Not specified' && (minSalary != null || maxSalary != null)) {
          const dollarMatches = salary.match(/\$\s*([0-9,]+k?)/gi) || [];
          const bareKMatches = salary.match(/(\d+)k/gi) || [];
          const allValues = [
            ...dollarMatches.map(m => {
              const raw = m.replace(/[$\s,]/g, '');
              return raw.toLowerCase().endsWith('k') ? parseFloat(raw.slice(0, -1)) * 1000 : parseInt(raw);
            }),
            ...bareKMatches.map(m => parseFloat(m) * 1000)
          ];
          if (allValues.length > 0) {
            const maxVal = Math.max(...allValues);
            const minVal = Math.min(...allValues);
            if (minSalary != null && maxVal < minSalary) { debug.salaryFilteredOut++; return null; }
            if (maxSalary != null && minVal > maxSalary) { debug.salaryFilteredOut++; return null; }
          }
        }

        // Additional remote filtering - when Remote Only is selected, filter out hybrid/onsite jobs
        if (isRemoteOnly) {
          const jobTitle = (job.job_title || '').toLowerCase();
          const jobDescription = (job.job_description || '').toLowerCase();
          const jobHighlights = job.job_highlights ?
            [...(job.job_highlights.Qualifications || []),
             ...(job.job_highlights.Responsibilities || []),
             ...(job.job_highlights.Benefits || [])].join(' ').toLowerCase() : '';

          const allText = `${jobTitle} ${jobDescription} ${jobHighlights}`;

          const hasNonRemoteKeyword = nonRemoteKeywords.some(keyword => allText.includes(keyword));
          const hasNonRemotePattern = nonRemotePatterns.some(pattern => pattern.test(allText));

          // Filter out jobs with specific city locations (remote jobs typically don't have cities)
          // BUT be more lenient - only filter if it has a city AND is not marked as remote
          const hasSpecificCityLocation = job.job_city &&
            job.job_state &&
            !job.job_city.toLowerCase().includes('remote') &&
            !job.job_city.toLowerCase().includes('anywhere') &&
            !job.job_city.toLowerCase().includes('worldwide') &&
            !job.job_is_remote;

          // STRICT: If job mentions any non-remote keywords/patterns, filter it out
          if (hasNonRemoteKeyword || hasNonRemotePattern) {
            debug.remoteFilteredOut++;
            return null;
          }

          // Also filter out if it has a specific city location and is NOT marked as remote
          if (hasSpecificCityLocation) {
            debug.remoteFilteredOut++;
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

        const employmentType = employmentTypeMap[job.job_employment_type] || null;

        // employer_company_type from JSearch: "Privately Held", "Public", etc.
        const companyType = job.employer_company_type || null;

        return {
          title: job.job_title || 'No title',
          company: job.employer_name || 'Unknown',
          location: job.job_city && job.job_state
            ? `${job.job_city}, ${job.job_state}`
            : job.job_country || 'Remote',
          link: job.job_apply_link || job.job_google_link || '#',
          description: job.job_description?.substring(0, 300) || 'No description available',
          salary: salary,
          employmentType: employmentType,
          companyType: companyType,
          postingDate: postingDate,
          datePulled: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
          source: source
        };
      }).filter(job => job !== null); // Remove filtered out jobs

    debug.afterRemoteFilter = transformedJobs.length;
    debug.afterSalaryFilter = transformedJobs.length; // salary filter runs inside map too, already counted

    // Keep only full-time (or unclassified) jobs — drop explicit Part-Time / Contract / etc.
    // JSearch mislabels many remote jobs, so null/undefined counts as full-time.
    const nonFullTimeTypes = ['Part-Time', 'Contract', 'Temporary', 'Internship'];
    let filteredJobs = transformedJobs.filter(job => !nonFullTimeTypes.includes(job.employmentType));
    debug.employmentFilteredOut = transformedJobs.length - filteredJobs.length;
    debug.afterEmploymentFilter = filteredJobs.length;
    if (debug.employmentFilteredOut > 0) {
      console.log(`Dropped ${debug.employmentFilteredOut} non-full-time jobs (from ${transformedJobs.length})`);
    }

    // Post-processing: scrape salary from job pages for jobs missing it
    const missingSalary = filteredJobs.filter(j => j.salary === 'Not specified' && j.link && j.link !== '#');
    console.log(`${missingSalary.length} jobs missing salary - attempting to scrape from job pages...`);

    if (missingSalary.length > 0) {
      const SCRAPE_LIMIT = 15;
      const toScrape = missingSalary.slice(0, SCRAPE_LIMIT);

      const scraped = await Promise.all(
        toScrape.map(job => scrapeSalaryFromPage(job.link))
      );

      // Apply scraped salaries back
      let scrapedCount = 0;
      scraped.forEach((salary, i) => {
        if (salary) {
          const idx = filteredJobs.findIndex(j => j.link === toScrape[i].link);
          if (idx !== -1) {
            filteredJobs[idx].salary = salary;
            scrapedCount++;
          }
        }
      });
      console.log(`Scraped salary from job pages for ${scrapedCount} additional jobs`);
    }

    const jobsWithSalary = filteredJobs.filter(job => job.salary !== 'Not specified').length;
    console.log(`Returning ${filteredJobs.length} jobs after filtering (${jobsWithSalary} with salary info)`);
    console.log('Filter debug:', JSON.stringify(debug));

    return { jobs: filteredJobs, debug };

  } catch (error) {
    if (error.response?.status === 403) {
      console.error('JSearch API: Invalid API key or quota exceeded');
    } else if (error.response?.status === 429) {
      console.error('JSearch API: Rate limit exceeded');
    } else {
      console.error('JSearch API error:', error.message);
    }
    return { jobs: [], debug: { error: error.message } };
  }
};

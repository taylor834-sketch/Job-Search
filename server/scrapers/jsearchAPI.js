import axios from 'axios';
import * as cheerio from 'cheerio';
import { format } from 'date-fns';
import { recordApiCall } from '../utils/database.js';

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

// Normalize any extracted salary string into a clean annual range.
// Handles: $75k, $50/hr, 80k-100k, $85,000 - $110,000, Salary: $90k, $80,000+, etc.
// Output: "$X - $Y/yr" | "$X+/yr" | "$X/yr" | null
const normalizeSalary = (raw) => {
  if (!raw || raw === 'Not specified') return null;

  const text = raw.replace(/[\u2013\u2014]/g, '-').trim();
  const isHourly = /(?:per\s+)?(?:hour|hr)\b/i.test(text);

  // Extract all numeric amounts (optional $ prefix, optional k suffix)
  const amounts = [];
  const re = /\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*k?/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const numStr = m[1].replace(/,/g, '');
    let val = parseFloat(numStr);
    if (/k\s*$/i.test(m[0])) val *= 1000;
    if (val < 10 && !isHourly) continue; // skip noise like "2" from "2 years"
    amounts.push(val);
  }

  if (amounts.length === 0) return null;
  const unique = [...new Set(amounts)];

  let min = Math.min(...unique);
  let max = Math.max(...unique);

  if (isHourly) {
    min = Math.round(min * 2080);
    max = Math.round(max * 2080);
  } else {
    // Not tagged hourly but values look like hourly rates ($10–$150) → annualise.
    // Anything still under $5,000 after that is garbage (signing bonus, noise) → reject.
    if (min >= 10 && min < 150) min = Math.round(min * 2080);
    if (max >= 10 && max < 150) max = Math.round(max * 2080);
    if (min < 5000 && max < 5000) return null;
    if (min < 5000) min = max;
    if (max < 5000) max = min;
  }

  const fmt = (n) => '$' + Math.round(n).toLocaleString();
  const hasPlus = /\+/.test(text);

  if (min === max) return hasPlus ? `${fmt(min)}+/yr` : `${fmt(min)}/yr`;
  return `${fmt(min)} - ${fmt(max)}/yr`;
};

// Scrape salary from an actual job posting page
// NOTE: This is slow (up to 3s per page) - only used when skipScraping is false
const scrapeSalaryFromPage = async (url) => {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 3000, // Reduced from 8s to 3s for faster processing
      maxContentLength: 1 * 1024 * 1024 // 1MB cap (reduced from 2MB)
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
    const bodyText = $('body').text().substring(0, 30000); // Reduced from 50k
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

export const searchJSearchAPI = async (filters, options = {}) => {
  const { jobTitle, jobTitles, locationType, location, minSalary, maxSalary, datePosted } = filters;
  const { skipScraping = false } = options; // Skip slow salary scraping for faster results

  const searchStartTime = Date.now();
  const log = (msg) => console.log(`[JSearch] [${((Date.now() - searchStartTime) / 1000).toFixed(1)}s] ${msg}`);

  log('Starting search...');

  try {
    const apiKey = process.env.JSEARCH_API_KEY;

    if (!apiKey) {
      console.warn('JSearch API key not configured. Skipping JSearch results.');
      return { jobs: [], debug: { error: 'JSEARCH_API_KEY not configured' } };
    }

    // Support both single jobTitle and array of jobTitles
    // Normalize to array
    let titlesToSearch = [];
    if (jobTitles && Array.isArray(jobTitles) && jobTitles.length > 0) {
      titlesToSearch = jobTitles;
    } else if (jobTitle) {
      titlesToSearch = [jobTitle];
    } else {
      titlesToSearch = ['software engineer'];
    }

    log(`Searching for ${titlesToSearch.length} job title(s): ${titlesToSearch.join(', ')}`);

    // Build base query modifiers
    let queryModifiers = '';

    // Add location for onsite/hybrid jobs
    if (location && (locationType?.includes('onsite') || locationType?.includes('hybrid'))) {
      queryModifiers += ` in ${location}`;
    }

    // Add "remote" to query when remote is selected to get better remote-specific results
    if (locationType?.includes('remote')) {
      queryModifiers += ' remote';
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

    // Fetch jobs for each title
    let jobs = [];
    let pagesRequested = 0;
    let quotaError = null;
    const seenJobIds = new Set(); // Deduplicate jobs across titles

    // Calculate pages per title: distribute MAX_PAGES across titles
    const MAX_TOTAL_PAGES = 5;
    const pagesPerTitle = Math.max(1, Math.floor(MAX_TOTAL_PAGES / titlesToSearch.length));

    const MAX_TOTAL_TIME = 60000; // 60 seconds max for all API calls combined

    for (const title of titlesToSearch) {
      if (quotaError) break;

      // Check total elapsed time to avoid exceeding client timeout
      if (Date.now() - searchStartTime > MAX_TOTAL_TIME) {
        log(`Total search time exceeded ${MAX_TOTAL_TIME / 1000}s - returning ${jobs.length} jobs collected so far`);
        break;
      }

      const query = title + queryModifiers;
      log(`Fetching: "${query}"`);

      const baseParams = {
        query: query,
        num_pages: '1',
        date_posted: datePostedMap[datePosted] || 'all',
        remote_jobs_only: isRemoteOnly ? 'true' : 'false'
      };

      // Fetch pages for this title
      for (let page = 1; page <= pagesPerTitle; page++) {
        // Check time budget before each request
        if (Date.now() - searchStartTime > MAX_TOTAL_TIME) {
          log(`Time budget exceeded before "${title}" page ${page}`);
          break;
        }

        let response;
        let retried = false;

        // Retry logic: on page 1, retry once if we get 0 results or timeout
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            pagesRequested++;
            response = await axios.request({
              method: 'GET',
              url: 'https://jsearch.p.rapidapi.com/search',
              params: { ...baseParams, page: String(page) },
              headers,
              timeout: 30000 // 30 seconds per API request to prevent hanging
            });

            // Check for quota exceeded message in response body (RapidAPI returns 200 with error message)
            if (response.data.message && response.data.message.includes('exceeded')) {
              console.error('JSearch API: Monthly quota exceeded (message in response)');
              quotaError = response.data.message;
              await recordApiCall(1, 'failure', 'quota_exceeded');
              break;
            }

            const pageJobs = response.data.data || [];

            // If page 1 returned 0 results and we haven't retried yet, try once more
            // The JSearch API is intermittently slow/empty for some queries
            if (page === 1 && attempt === 0 && pageJobs.length === 0 && !quotaError) {
              log(`"${title}" page 1 returned 0 results - retrying once...`);
              retried = true;
              continue;
            }

            await recordApiCall(1, 'success', null);
            break; // Success, exit retry loop
          } catch (pageError) {
            const isTimeout = pageError.code === 'ECONNABORTED' || pageError.message?.includes('timeout');

            // If page 1 timed out and we haven't retried, try once more
            if (page === 1 && attempt === 0 && isTimeout) {
              log(`"${title}" page 1 timed out - retrying once...`);
              retried = true;
              await recordApiCall(1, 'failure', 'timeout');
              continue;
            }

            if (isTimeout) {
              log(`"${title}" page ${page} timed out after 30s - skipping remaining pages for this title`);
            } else {
              console.warn(`JSearch "${title}" page ${page} failed:`, pageError.message);
            }
            // Record the failed page request
            const errorType = pageError.response?.status === 429 ? 'rate_limit' :
                              pageError.response?.status === 403 ? 'quota_exceeded' :
                              isTimeout ? 'timeout' : 'other';
            await recordApiCall(1, 'failure', errorType);
            response = null;
            break; // Exit retry loop on non-retryable error
          }
        }

        if (quotaError || !response) break; // Stop paginating

        const pageJobs = response.data.data || [];
        if (pageJobs.length === 0) break; // No more results for this title

        // Deduplicate: only add jobs we haven't seen
        let newJobs = 0;
        for (const job of pageJobs) {
          const jobId = job.job_id || job.job_apply_link || `${job.job_title}-${job.employer_name}`;
          if (!seenJobIds.has(jobId)) {
            seenJobIds.add(jobId);
            jobs.push(job);
            newJobs++;
          }
        }
        log(`"${title}" page ${page}: ${pageJobs.length} jobs (${newJobs} new)${retried ? ' (after retry)' : ''}`);
      }
    }

    // If we hit a quota error, return immediately with the error
    if (quotaError) {
      return {
        jobs: [],
        debug: {
          error: quotaError,
          apiReturned: 0,
          isRemoteOnly: locationType?.includes('remote') && locationType.length === 1,
          salaryFilter: { min: minSalary ?? null, max: maxSalary ?? null },
          datePosted: datePosted || 'week',
          queries: titlesToSearch.map(t => t + queryModifiers)
        }
      };
    }

    // Record successful API call with total pages requested
    if (pagesRequested > 0 && !quotaError) {
      await recordApiCall(pagesRequested, 'success', null);
    }

    log(`API returned ${jobs.length} total unique jobs across all titles`);

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
      datePosted: datePosted || 'all',
      queries: titlesToSearch.map(t => t + queryModifiers),
      jobTitles: titlesToSearch,
      remoteReasons: [],      // per-job: why was it killed by remote filter
      employmentReasons: []   // per-job: why was it killed by employment filter
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
      'days in office', 'day in office', 'return to office'
    ];

    // Patterns that need context / word boundaries to avoid false positives
    const nonRemotePatterns = [
      /\b\d+\s*days?\s*(per|a|each)\s*week\s*(in|at)\b/i,
      /\b\d+\s*days?\s*(in|at)\s*(the\s+)?office\b/i,
      /\boffice\s*\d+\s*days?\b/i,
      /\b(some|certain)\s*days?\s*(in|at)\s*(the\s+)?office\b/i,
      /\b(rto|return[\s-]*to[\s-]*office)\b/i,
      /\bin[\s-]person\b/i   // "in person" / "in-person" but NOT "in personal", "in personnel"
    ];

    // Transform JSearch results to our format
    const transformedJobs = jobs.map(job => {
        // Format salary - try multiple fields aggressively
        let salary = 'Not specified';

        // 1. Try API salary fields first
        if (job.job_min_salary || job.job_max_salary) {
          let minVal = job.job_min_salary || null;
          let maxVal = job.job_max_salary || null;

          // Annualise based on job_salary_period (HOURLY / MONTHLY / YEARLY)
          const period = (job.job_salary_period || '').toUpperCase();
          if (period === 'HOURLY') {
            if (minVal) minVal = Math.round(minVal * 2080);
            if (maxVal) maxVal = Math.round(maxVal * 2080);
          } else if (period === 'MONTHLY') {
            if (minVal) minVal = Math.round(minVal * 12);
            if (maxVal) maxVal = Math.round(maxVal * 12);
          }
          // If period is missing, guess: $10–$150 looks like an hourly rate, annualise it.
          // Anything else under $5k after that is garbage — rejected by the sanity floor below.
          if (!period) {
            if (minVal && minVal >= 10 && minVal < 150) minVal = Math.round(minVal * 2080);
            if (maxVal && maxVal >= 10 && maxVal < 150) maxVal = Math.round(maxVal * 2080);
          }

          // Sanity floor: reject if still under $5,000 (not a real annual salary)
          if (minVal && minVal < 5000) minVal = null;
          if (maxVal && maxVal < 5000) maxVal = null;

          if (minVal || maxVal) {
            const min = minVal ? `$${minVal.toLocaleString()}` : '';
            const max = maxVal ? `$${maxVal.toLocaleString()}` : '';
            if (min && max) {
              salary = `${min} - ${max}`;
            } else if (min) {
              salary = `${min}+`;
            } else if (max) {
              salary = `Up to ${max}`;
            }
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
        // Single pass: pull every number (with optional commas), expand k suffix
        if (salary !== 'Not specified' && (minSalary != null || maxSalary != null)) {
          const allValues = [];
          const re = /(\d{1,3}(?:,\d{3})*)\s*k?/gi;
          let match;
          while ((match = re.exec(salary)) !== null) {
            const raw = match[1].replace(/,/g, '');
            let val = parseInt(raw, 10);
            if (/k\s*$/i.test(match[0])) val *= 1000;
            allValues.push(val);
          }
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

          const matchedKeyword = nonRemoteKeywords.find(kw => allText.includes(kw));
          if (matchedKeyword) {
            debug.remoteFilteredOut++;
            debug.remoteReasons.push({ title: job.job_title, reason: `keyword "${matchedKeyword}"` });
            return null;
          }

          const matchedPattern = nonRemotePatterns.find(p => p.test(allText));
          if (matchedPattern) {
            debug.remoteFilteredOut++;
            debug.remoteReasons.push({ title: job.job_title, reason: `pattern ${matchedPattern.toString()}` });
            return null;
          }

          // Filter out jobs with specific city locations (remote jobs typically don't have cities)
          // BUT be more lenient - only filter if it has a city AND is not marked as remote
          const hasSpecificCityLocation = job.job_city &&
            job.job_state &&
            !job.job_city.toLowerCase().includes('remote') &&
            !job.job_city.toLowerCase().includes('anywhere') &&
            !job.job_city.toLowerCase().includes('worldwide') &&
            !job.job_is_remote;

          if (hasSpecificCityLocation) {
            debug.remoteFilteredOut++;
            debug.remoteReasons.push({ title: job.job_title, reason: `city "${job.job_city}, ${job.job_state}" not marked remote` });
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
          salary: normalizeSalary(salary) || 'Not specified',
          employmentType: employmentType,
          companyType: companyType,
          postingDate: postingDate,
          datePulled: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
          source: source
        };
      }).filter(job => job !== null); // Remove filtered out jobs

    // afterRemoteFilter = what survived the .map() (remote + salary both ran in there)
    debug.afterRemoteFilter = transformedJobs.length + debug.remoteFilteredOut; // before remote ran
    debug.afterSalaryFilter = transformedJobs.length; // after salary + remote both ran

    // === SOURCE QUALITY FILTER ===
    // Block gig/freelance platforms and low-quality job aggregators.
    // These return contract gigs, not real full-time positions.
    const blockedSources = [
      'upwork', 'fiverr', 'freelancer', 'toptal', 'guru.com', 'peopleperhour',
      'flexjobs', 'bark', 'thumbtack', 'taskrabbit', 'wonolo', 'instawork',
      'snagajob', 'craigslist', 'talent.com', 'jooble', 'adzuna', 'jobrapido',
      'neuvoo', 'careerjet', 'learn4good', 'ladders'
    ];

    debug.sourceFilteredOut = 0;
    debug.sourceReasons = [];

    const sourceFilteredJobs = transformedJobs.filter(job => {
      const src = (job.source || '').toLowerCase();
      const link = (job.link || '').toLowerCase();

      const blockedBy = blockedSources.find(blocked =>
        src.includes(blocked) || link.includes(blocked)
      );

      if (blockedBy) {
        debug.sourceFilteredOut++;
        debug.sourceReasons.push({ title: job.title, source: job.source, blockedBy });
        return false;
      }
      return true;
    });

    if (debug.sourceFilteredOut > 0) {
      log(`Source filter: dropped ${debug.sourceFilteredOut} jobs from blocked sources`);
    }
    debug.afterSourceFilter = sourceFilteredJobs.length;

    // === DATE FILTER ===
    // JSearch API's date_posted param is unreliable — it often returns jobs older than requested.
    // We enforce the date filter ourselves by checking each job's postingDate.
    debug.dateFilteredOut = 0;
    debug.dateReasons = [];

    let dateFilteredJobs = sourceFilteredJobs;
    if (datePosted && datePosted !== 'all') {
      const now = new Date();
      // Set cutoff to start of the relevant day (midnight UTC)
      let cutoffDate;
      if (datePosted === 'today') {
        // "today" = posted today (same calendar date UTC)
        cutoffDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      } else if (datePosted === '3days') {
        cutoffDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 3));
      } else if (datePosted === 'week') {
        cutoffDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 7));
      } else if (datePosted === 'month') {
        cutoffDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, now.getUTCDate()));
      }

      if (cutoffDate) {
        dateFilteredJobs = sourceFilteredJobs.filter(job => {
          const jobDate = new Date(job.postingDate);
          if (isNaN(jobDate.getTime())) return true; // keep jobs with unparseable dates
          if (jobDate >= cutoffDate) return true;
          debug.dateFilteredOut++;
          debug.dateReasons.push({
            title: job.title,
            postingDate: job.postingDate,
            cutoff: cutoffDate.toISOString()
          });
          return false;
        });
        log(`Date filter (${datePosted}): kept ${dateFilteredJobs.length}, dropped ${debug.dateFilteredOut} jobs posted before ${cutoffDate.toISOString()}`);
      }
    }
    debug.afterDateFilter = dateFilteredJobs.length;

    // Keep only full-time (or unclassified) jobs — drop explicit Part-Time / Contract / etc.
    // JSearch mislabels many remote jobs, so null/undefined counts as full-time.
    const nonFullTimeTypes = ['Part-Time', 'Contract', 'Temporary', 'Internship'];
    let filteredJobs = dateFilteredJobs.filter(job => {
      if (nonFullTimeTypes.includes(job.employmentType)) {
        debug.employmentFilteredOut++;
        debug.employmentReasons.push({ title: job.title, employmentType: job.employmentType });
        return false;
      }
      return true;
    });
    debug.afterEmploymentFilter = filteredJobs.length;
    if (debug.employmentFilteredOut > 0) {
      console.log(`Dropped ${debug.employmentFilteredOut} non-full-time jobs (from ${transformedJobs.length})`);
    }

    // Post-processing: scrape salary from job pages for jobs missing it
    // This is SLOW (up to 3s per job) - skip for scheduled searches to avoid timeouts
    const missingSalary = filteredJobs.filter(j => j.salary === 'Not specified' && j.link && j.link !== '#');

    if (skipScraping) {
      log(`${missingSalary.length} jobs missing salary - SKIPPING scraping (skipScraping=true)`);
    } else if (missingSalary.length > 0) {
      log(`${missingSalary.length} jobs missing salary - scraping up to 5 job pages...`);
      const SCRAPE_LIMIT = 5; // Reduced from 15 to 5 for faster processing
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
            filteredJobs[idx].salary = normalizeSalary(salary) || salary;
            scrapedCount++;
          }
        }
      });
      log(`Scraped salary from ${scrapedCount} job pages`);
    }

    const jobsWithSalary = filteredJobs.filter(job => job.salary !== 'Not specified').length;
    log(`Returning ${filteredJobs.length} jobs (${jobsWithSalary} with salary). Total time: ${((Date.now() - searchStartTime) / 1000).toFixed(1)}s`);

    return { jobs: filteredJobs, debug };

  } catch (error) {
    const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
    let errorType = 'other';
    if (isTimeout) {
      console.error('JSearch API: Request timed out');
      errorType = 'timeout';
    } else if (error.response?.status === 403) {
      console.error('JSearch API: Invalid API key or quota exceeded');
      errorType = 'quota_exceeded';
    } else if (error.response?.status === 429) {
      console.error('JSearch API: Rate limit exceeded');
      errorType = 'rate_limit';
    } else {
      console.error('JSearch API error:', error.message);
    }
    // Record failed API call
    await recordApiCall(1, 'failure', errorType);
    return { jobs: [], debug: { error: isTimeout ? 'Search timed out - the job search API was too slow. Please try again.' : error.message } };
  }
};

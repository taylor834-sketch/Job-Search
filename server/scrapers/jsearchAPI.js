import axios from 'axios';
import * as cheerio from 'cheerio';
import { format } from 'date-fns';

// Helper function to extract salary from text
const extractSalaryFromText = (text) => {
  if (!text) return null;

  // Comprehensive salary patterns
  const patterns = [
    // Range patterns: $100,000 - $150,000, $100k - $150k
    /\$\s*(\d{1,3}(?:,\d{3})*|\d+k)\s*(?:-|to)\s*\$?\s*(\d{1,3}(?:,\d{3})*|\d+k)\s*(?:per\s)?(?:year|yr|annually|\/year|\/yr|a year)?/gi,
    // Single amount: $100,000, $100k
    /\$\s*(\d{1,3}(?:,\d{3})*|\d+k)\s*(?:\+)?\s*(?:per\s)?(?:year|yr|annually|\/year|\/yr|a year)?/gi,
    // Hourly: $50/hr, $50 per hour
    /\$\s*(\d{1,3}(?:,\d{3})*|\d+)\s*(?:-|to)\s*\$?\s*(\d{1,3}(?:,\d{3})*|\d+)?\s*(?:per\s)?(?:hour|hr|\/hr|\/hour)/gi,
    // Compensation/Salary prefix
    /(?:salary|compensation|pay|base pay|annual salary)[\s:]+\$\s*(\d{1,3}(?:,\d{3})*|\d+k)\s*(?:-|to)?\s*\$?\s*(\d{1,3}(?:,\d{3})*|\d+k)?/gi,
    // K format: 100k - 150k
    /(\d{2,3})k\s*(?:-|to)\s*(\d{2,3})k/gi
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[0]) {
      return match[0].trim();
    }
  }

  return null;
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

    // Build the request - fetch multiple pages for more results
    const options = {
      method: 'GET',
      url: 'https://jsearch.p.rapidapi.com/search',
      params: {
        query: query,
        page: '1',
        num_pages: '10', // Request 10 pages to get more results
        date_posted: datePostedMap[datePosted] || 'all',
        remote_jobs_only: isRemoteOnly ? 'true' : 'false'
      },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      }
    };

    console.log('JSearch API request params:', options.params);

    const response = await axios.request(options);
    const jobs = response.data.data || [];

    console.log(`JSearch API returned ${jobs.length} jobs (requested 10 pages)`);

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

        // Parse posting date
        let postingDate = format(new Date(), 'yyyy-MM-dd');
        if (job.job_posted_at_datetime_utc) {
          try {
            postingDate = format(new Date(job.job_posted_at_datetime_utc), 'yyyy-MM-dd');
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

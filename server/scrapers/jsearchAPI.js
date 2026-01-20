import axios from 'axios';
import { format } from 'date-fns';

export const searchJSearchAPI = async (filters) => {
  const { jobTitle, locationType, minSalary, maxSalary } = filters;

  console.log('Searching JSearch API (Google Jobs, LinkedIn, Indeed)...');

  try {
    const apiKey = process.env.JSEARCH_API_KEY;

    if (!apiKey) {
      console.warn('JSearch API key not configured. Skipping JSearch results.');
      return [];
    }

    // Build search query
    const query = jobTitle || 'software engineer';

    // Build employment types based on location type
    const employmentTypes = [];
    if (locationType?.includes('remote')) {
      employmentTypes.push('FULLTIME');
    }

    // Build the request - fetch multiple pages for more results
    const options = {
      method: 'GET',
      url: 'https://jsearch.p.rapidapi.com/search',
      params: {
        query: query,
        page: '1',
        num_pages: '10', // Request 10 pages to get more results
        date_posted: 'all',
        remote_jobs_only: locationType?.includes('remote') ? 'true' : 'false'
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
        // Format salary - try multiple fields
        let salary = 'Not specified';

        // Try annual salary first
        if (job.job_min_salary || job.job_max_salary) {
          const min = job.job_min_salary ? `$${Math.round(job.job_min_salary).toLocaleString()}` : '';
          const max = job.job_max_salary ? `$${Math.round(job.job_max_salary).toLocaleString()}` : '';
          if (min && max) {
            salary = `${min} - ${max}/year`;
          } else if (min) {
            salary = `${min}+/year`;
          } else if (max) {
            salary = `Up to ${max}/year`;
          }
        }
        // Try salary period if available (hourly, weekly, etc)
        else if (job.job_salary_period) {
          salary = `${job.job_salary_currency || '$'}${job.job_salary_period}`;
        }
        // Check if there's a highlighted salary string
        else if (job.job_highlights?.Qualifications) {
          const qualifications = job.job_highlights.Qualifications.join(' ');
          const salaryMatch = qualifications.match(/\$[\d,]+(?:\s*-\s*\$[\d,]+)?(?:\s*(?:per|\/)\s*(?:hour|year|hr|yr))?/i);
          if (salaryMatch) {
            salary = salaryMatch[0];
          }
        }
        // Try to extract from description as last resort
        else if (job.job_description) {
          const descMatch = job.job_description.match(/(?:salary|pay|compensation)[:\s]+\$[\d,]+(?:\s*-\s*\$[\d,]+)?(?:\s*(?:per|\/)\s*(?:hour|year|hr|yr))?/i);
          if (descMatch) {
            salary = descMatch[0].split(/[:\s]+/).slice(1).join(' ');
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

        // Parse posting date
        let postingDate = format(new Date(), 'yyyy-MM-dd');
        if (job.job_posted_at_datetime_utc) {
          try {
            postingDate = format(new Date(job.job_posted_at_datetime_utc), 'yyyy-MM-dd');
          } catch (e) {
            // Use default if parsing fails
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
          companySize: job.employer_company_type || 'Not specified',
          industry: job.job_employment_type || 'Not specified',
          postingDate: postingDate,
          datePulled: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
          source: 'JSearch API (Google Jobs/LinkedIn/Indeed)'
        };
      }).filter(job => job !== null); // Remove filtered out jobs

    console.log(`Returning ${transformedJobs.length} jobs after filtering`);

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

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

    // Build the request
    const options = {
      method: 'GET',
      url: 'https://jsearch.p.rapidapi.com/search',
      params: {
        query: query,
        page: '1',
        num_pages: '1',
        date_posted: 'week', // Jobs from last 7 days
        remote_jobs_only: locationType?.includes('remote') ? 'true' : 'false'
      },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      }
    };

    const response = await axios.request(options);
    const jobs = response.data.data || [];

    console.log(`JSearch API returned ${jobs.length} jobs`);

    // Transform JSearch results to our format
    const transformedJobs = jobs
      .filter(job => {
        // Filter by salary if specified
        if (minSalary && job.job_min_salary && job.job_min_salary < minSalary) {
          return false;
        }
        if (maxSalary && job.job_max_salary && job.job_max_salary > maxSalary) {
          return false;
        }
        return true;
      })
      .map(job => {
        // Format salary
        let salary = 'Not specified';
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
      });

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

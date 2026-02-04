import { useState } from 'react';
import JobCard from './JobCard';
import './JobResults.css';

function JobResults({ jobs }) {
  const [sortBy, setSortBy] = useState('date'); // date, salary, company

  const sortedJobs = [...jobs].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        // Sort by posting date (newest first)
        return new Date(b.postingDate) - new Date(a.postingDate);

      case 'salary':
        // Sort by salary (highest first) — use the max value in a range
        const getSalaryValue = (job) => {
          if (!job.salary || job.salary === 'Not specified') return 0;
          // Pull all $-prefixed numbers (with optional k suffix) from the string
          const matches = job.salary.match(/\$\s*([0-9,]+k?)/gi) || [];
          const values = matches.map(m => {
            const raw = m.replace(/[$\s,]/g, '');
            return raw.toLowerCase().endsWith('k')
              ? parseFloat(raw.slice(0, -1)) * 1000
              : parseInt(raw);
          });
          // Also catch bare "80k - 100k" (no $ sign)
          const bareK = job.salary.match(/(\d+)k/gi) || [];
          bareK.forEach(m => values.push(parseFloat(m) * 1000));
          return values.length ? Math.max(...values) : 0;
        };
        return getSalaryValue(b) - getSalaryValue(a);

      case 'company':
        // Sort by company name (A-Z)
        return (a.company || '').localeCompare(b.company || '');

      default:
        return 0;
    }
  });

  return (
    <div className="job-results">
      <div className="results-header">
        <div>
          <h2>Search Results</h2>
          <p>{jobs.length} jobs found</p>
        </div>

        <div className="sort-controls">
          <label htmlFor="sort-by">Sort by:</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="date">Date Posted (Newest)</option>
            <option value="salary">Salary (Highest)</option>
            <option value="company">Company (A-Z)</option>
          </select>
        </div>
      </div>

      <div className="jobs-grid">
        {sortedJobs.map((job) => (
          <JobCard key={job.link} job={job} />
        ))}
      </div>
    </div>
  );
}

export default JobResults;

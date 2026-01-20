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
        // Sort by salary (highest first)
        const getSalaryValue = (job) => {
          if (!job.salary || job.salary === 'Not specified') return 0;
          // Extract first number from salary string
          const match = job.salary.match(/\$([0-9,]+)/);
          return match ? parseInt(match[1].replace(/,/g, '')) : 0;
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
        {sortedJobs.map((job, index) => (
          <JobCard key={index} job={job} />
        ))}
      </div>
    </div>
  );
}

export default JobResults;

import { useState } from 'react';
import JobCard from './JobCard';
import './JobResults.css';

function JobResults({ jobs, selectedJobs, onToggleSelect, onSelectAll }) {
  const [sortBy, setSortBy] = useState('date'); // date, salary, company

  const allSelected = jobs.length > 0 && selectedJobs.size === jobs.length;
  const someSelected = selectedJobs.size > 0 && !allSelected;

  // Extract the largest numeric salary value from a normalised salary string
  const getSalaryValue = (job) => {
    if (!job.salary || job.salary === 'Not specified') return 0;
    const values = [];
    // Match every number in the string (with optional commas), expand k suffix
    const re = /(\d{1,3}(?:,\d{3})*)\s*k?/gi;
    let m;
    while ((m = re.exec(job.salary)) !== null) {
      const raw = m[1].replace(/,/g, '');
      let val = parseInt(raw, 10);
      if (/k\s*$/i.test(m[0])) val *= 1000;
      values.push(val);
    }
    return values.length ? Math.max(...values) : 0;
  };

  const sortedJobs = [...jobs].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.postingDate) - new Date(a.postingDate);
      case 'salary':
        return getSalaryValue(b) - getSalaryValue(a);
      case 'company':
        return (a.company || '').localeCompare(b.company || '');
      default:
        return 0;
    }
  });

  return (
    <div className="job-results">
      <div className="results-header">
        <div className="results-title-row">
          <div>
            <h2>Search Results</h2>
            <p>{jobs.length} job{jobs.length !== 1 ? 's' : ''} found{selectedJobs.size > 0 ? ` · ${selectedJobs.size} selected` : ''}</p>
          </div>
        </div>

        <div className="results-controls">
          <label className="select-all-label">
            <input
              type="checkbox"
              className="select-all-checkbox"
              checked={allSelected}
              ref={el => { if (el) el.indeterminate = someSelected; }}
              onChange={onSelectAll}
            />
            <span>Select all</span>
          </label>

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
          <JobCard
            key={job.link}
            job={job}
            isSelected={selectedJobs.has(job.link)}
            onToggleSelect={() => onToggleSelect(job.link)}
          />
        ))}
      </div>
    </div>
  );
}

export default JobResults;

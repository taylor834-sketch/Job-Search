import JobCard from './JobCard';
import './JobResults.css';

function JobResults({ jobs }) {
  return (
    <div className="job-results">
      <div className="results-header">
        <h2>Search Results</h2>
        <p>{jobs.length} jobs found</p>
      </div>

      <div className="jobs-grid">
        {jobs.map((job, index) => (
          <JobCard key={index} job={job} />
        ))}
      </div>
    </div>
  );
}

export default JobResults;

import './JobCard.css';

function JobCard({ job }) {
  const getSourceColor = (source) => {
    const colors = {
      'LinkedIn': '#0077b5',
      'BuiltIn': '#ff6b35',
      'RemoteOK': '#28a745',
      'WeWorkRemotely': '#7c3aed',
      'Remote.co': '#f59e0b',
      'Google Jobs': '#4285f4'
    };
    return colors[source] || '#667eea';
  };

  return (
    <div className="job-card">
      <div className="job-card-header">
        <h3 className="job-title">{job.title}</h3>
        <span
          className="job-source"
          style={{ backgroundColor: getSourceColor(job.source) }}
        >
          {job.source}
        </span>
      </div>

      <div className="job-company">
        <strong>{job.company}</strong>
      </div>

      <div className="job-details">
        <div className="job-detail-item">
          <span className="detail-label">Location:</span>
          <span className="detail-value">{job.location}</span>
        </div>

        {job.salary && job.salary !== 'Not specified' && (
          <div className="job-detail-item">
            <span className="detail-label">Salary:</span>
            <span className="detail-value">{job.salary}</span>
          </div>
        )}

        {job.companySize && job.companySize !== 'Not specified' && (
          <div className="job-detail-item">
            <span className="detail-label">Company Size:</span>
            <span className="detail-value">{job.companySize}</span>
          </div>
        )}

        {job.industry && job.industry !== 'Not specified' && (
          <div className="job-detail-item">
            <span className="detail-label">Industry:</span>
            <span className="detail-value">{job.industry}</span>
          </div>
        )}
      </div>

      {job.description && (
        <div className="job-description">
          {job.description.substring(0, 200)}
          {job.description.length > 200 && '...'}
        </div>
      )}

      <div className="job-footer">
        <span className="job-date">{job.datePulled}</span>
        <a
          href={job.link}
          target="_blank"
          rel="noopener noreferrer"
          className="job-link"
        >
          View Job →
        </a>
      </div>
    </div>
  );
}

export default JobCard;

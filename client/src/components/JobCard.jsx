import { formatDistanceToNow } from 'date-fns';
import './JobCard.css';

function JobCard({ job }) {
  const getSourceColor = (source) => {
    const colors = {
      'LinkedIn': '#0077b5',
      'BuiltIn': '#ff6b35',
      'RemoteOK': '#28a745',
      'WeWorkRemotely': '#7c3aed',
      'Remote.co': '#f59e0b',
      'Google Jobs': '#4285f4',
      'Startup.jobs': '#ec4899',
      'JSearch API (Google Jobs/LinkedIn/Indeed)': '#667eea'
    };
    return colors[source] || '#667eea';
  };

  const formatPostingDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="job-card">
      <div className="job-card-header">
        <div className="job-title-section">
          <h3 className="job-title">{job.title}</h3>
          <div className="job-company">{job.company}</div>
        </div>
        <a
          href={job.link}
          target="_blank"
          rel="noopener noreferrer"
          className="job-link"
        >
          View Job →
        </a>
      </div>

      <div className="job-meta">
        <span className="meta-item location">
          <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {job.location}
        </span>

        {job.salary && job.salary !== 'Not specified' && (
          <span className="meta-item salary">
            <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {job.salary}
          </span>
        )}

        {job.postingDate && (
          <span className="meta-item">
            <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatPostingDate(job.postingDate)}
          </span>
        )}

        <span
          className="meta-item source-badge"
          style={{ backgroundColor: getSourceColor(job.source) }}
        >
          {job.source}
        </span>
      </div>

      {job.description && (
        <div className="job-description">
          {job.description.substring(0, 150)}
          {job.description.length > 150 && '...'}
        </div>
      )}
    </div>
  );
}

export default JobCard;

import { useState, useRef, useCallback } from 'react';
import SearchForm from './components/SearchForm';
import JobResults from './components/JobResults';
import JobActions from './components/JobActions';
import RecurringSearches from './components/RecurringSearches';
import './App.css';

function App() {
  const [jobs, setJobs] = useState([]);
  const [searchCriteria, setSearchCriteria] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState(new Set());

  // Ref so JobActions can trigger a refresh on the RecurringSearches panel
  // after a new recurring search is created
  const refreshRecurringRef = useRef(null);
  const handleSearchCreated = useCallback(() => {
    if (refreshRecurringRef.current) refreshRecurringRef.current();
  }, []);

  // Format the build-time git commit timestamp for the footer.
  // __BUILD_TIME__ is injected by vite.config.js define plugin at build time.
  const lastDeployed = (() => {
    try {
      const d = new Date(__BUILD_TIME__);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return __BUILD_TIME__;
    }
  })();

  const handleSearchResults = (results, criteria, debug) => {
    setJobs(results);
    setSearchCriteria(criteria);
    setDebugInfo(debug);
    setShowDebug(false);
    setSelectedJobs(new Set());
  };

  const handleToggleSelect = (jobLink) => {
    setSelectedJobs(prev => {
      const next = new Set(prev);
      next.has(jobLink) ? next.delete(jobLink) : next.add(jobLink);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedJobs(prev =>
      prev.size === jobs.length ? new Set() : new Set(jobs.map(j => j.link))
    );
  };

  const handleLoading = (isLoading) => {
    setLoading(isLoading);
  };

  const handleError = (errorMsg) => {
    setError(errorMsg);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🤖 Jobinator 3000</h1>
        <p>Your Job Search Companion</p>
      </header>

      <div className="app-content">
        <SearchForm
          onResults={handleSearchResults}
          onLoading={handleLoading}
          onError={handleError}
        />

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <RecurringSearches onRegisterRefresh={(fn) => { refreshRecurringRef.current = fn; }} />

        {!loading && jobs.length === 0 && debugInfo && (
          <div className="debug-panel">
            <button className="debug-toggle" onClick={() => setShowDebug(!showDebug)}>
              {showDebug ? 'Hide' : 'Show'} troubleshooting info
            </button>
            {showDebug && (
              <div className="debug-details">
                <p className="debug-title">Where did the jobs go?</p>

                {/* Search query that was actually sent */}
                <div className="debug-row">
                  <span className="debug-label">Query sent to API</span>
                  <span className="debug-value debug-query">"{debugInfo.query}"</span>
                </div>
                <div className="debug-row">
                  <span className="debug-label">Date filter</span>
                  <span className="debug-value">{debugInfo.datePosted}</span>
                </div>

                {/* API raw count */}
                <div className="debug-row">
                  <span className="debug-label">API returned</span>
                  <span className="debug-value">{debugInfo.apiReturned ?? '—'} jobs</span>
                </div>

                {/* Salary filter row + reasons */}
                {debugInfo.salaryFilteredOut > 0 && (
                  <div className="debug-row">
                    <span className="debug-label">Salary filter removed</span>
                    <span className="debug-value debug-hit">{debugInfo.salaryFilteredOut} jobs</span>
                  </div>
                )}

                {/* Remote filter row + per-job reasons */}
                {debugInfo.isRemoteOnly && (
                  <>
                    <div className="debug-row">
                      <span className="debug-label">Remote filter removed</span>
                      <span className={`debug-value ${debugInfo.remoteFilteredOut > 0 ? 'debug-hit' : ''}`}>{debugInfo.remoteFilteredOut} jobs</span>
                    </div>
                    {debugInfo.remoteReasons?.length > 0 && (
                      <div className="debug-reasons">
                        {debugInfo.remoteReasons.map((r, i) => (
                          <div key={i} className="debug-reason-item">
                            <span className="debug-reason-title">{r.title}</span>
                            <span className="debug-reason-why">{r.reason}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Employment filter row + per-job reasons */}
                {debugInfo.employmentFilteredOut > 0 && (
                  <>
                    <div className="debug-row">
                      <span className="debug-label">Non-full-time removed</span>
                      <span className="debug-value debug-hit">{debugInfo.employmentFilteredOut} jobs</span>
                    </div>
                    {debugInfo.employmentReasons?.length > 0 && (
                      <div className="debug-reasons">
                        {debugInfo.employmentReasons.map((r, i) => (
                          <div key={i} className="debug-reason-item">
                            <span className="debug-reason-title">{r.title}</span>
                            <span className="debug-reason-why">{r.employmentType}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Final count */}
                <div className="debug-row debug-final">
                  <span className="debug-label">Remaining after all filters</span>
                  <span className="debug-value">{debugInfo.afterEmploymentFilter ?? 0} jobs</span>
                </div>

                {/* Hint — pick the LAST filter that brought it to zero */}
                <p className="debug-hint">
                  {debugInfo.error
                    ? debugInfo.error
                    : debugInfo.apiReturned === 0
                      ? 'The API itself returned nothing. Try a broader search term or change the date filter (e.g. "Last 7 Days" instead of "Today").'
                      : debugInfo.employmentFilteredOut > 0 && debugInfo.afterEmploymentFilter === 0
                        ? `${debugInfo.employmentFilteredOut} job${debugInfo.employmentFilteredOut > 1 ? 's' : ''} survived the remote filter but were all explicitly Part-Time or Contract. The API may be mislabelling them — or these are genuinely not full-time roles.`
                        : debugInfo.salaryFilteredOut > 0 && debugInfo.afterEmploymentFilter === 0
                          ? 'All jobs were outside your salary range. Try widening it or removing it entirely.'
                          : debugInfo.remoteFilteredOut > 0 && debugInfo.afterEmploymentFilter === 0
                            ? 'Every job the API returned was flagged as hybrid/onsite by our keyword scanner. Try adding "Onsite" or "Hybrid" to your location types.'
                            : 'Try relaxing one or more filters to get results.'}
                </p>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Searching for jobs...</p>
          </div>
        )}

        {!loading && jobs.length > 0 && (
          <>
            <JobActions jobs={jobs} searchCriteria={searchCriteria} selectedJobs={selectedJobs} onSearchCreated={handleSearchCreated} />
            <JobResults jobs={jobs} selectedJobs={selectedJobs} onToggleSelect={handleToggleSelect} onSelectAll={handleSelectAll} />
          </>
        )}
      </div>

      <footer className="app-footer">
        <p>Built by <a href="https://realsimplerevops.com" target="_blank" rel="noopener noreferrer">Real Simple RevOps</a></p>
        <p className="last-updated">Last deployed: {lastDeployed}</p>
      </footer>
    </div>
  );
}

export default App;

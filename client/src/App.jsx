import { useState, useRef, useCallback } from 'react';
import SearchForm from './components/SearchForm';
import JobResults from './components/JobResults';
import JobActions from './components/JobActions';
import RecurringSearches from './components/RecurringSearches';
import Settings from './components/Settings';
import DuckAnimation from './components/DuckAnimation';
import './App.css';

function App() {
  const [jobs, setJobs] = useState([]);
  const [searchCriteria, setSearchCriteria] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState(new Set());
  const [showSettings, setShowSettings] = useState(false);

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
        <DuckAnimation />
        <div className="header-content">
          <div className="header-title">
            <h1>Jobinator 3000</h1>
            <p>Your Job Search Companion</p>
          </div>
          <button className="settings-btn" onClick={() => setShowSettings(true)} title="Settings">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>
      </header>

      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />

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

                {/* API Error if present */}
                {debugInfo.error && (
                  <div className="debug-row debug-error-row">
                    <span className="debug-label">API Error</span>
                    <span className="debug-value debug-error">{debugInfo.error}</span>
                  </div>
                )}

                {/* Search query/queries that were actually sent */}
                <div className="debug-row">
                  <span className="debug-label">Queries sent to API</span>
                  <span className="debug-value debug-query">
                    {debugInfo.queries && debugInfo.queries.length > 0
                      ? debugInfo.queries.map(q => `"${q}"`).join(', ')
                      : debugInfo.query
                        ? `"${debugInfo.query}"`
                        : 'N/A'}
                  </span>
                </div>
                <div className="debug-row">
                  <span className="debug-label">Date filter</span>
                  <span className="debug-value">{debugInfo.datePosted}</span>
                </div>
                <div className="debug-row">
                  <span className="debug-label">Remote only</span>
                  <span className="debug-value">{debugInfo.isRemoteOnly ? 'Yes' : 'No'}</span>
                </div>
                <div className="debug-row">
                  <span className="debug-label">Salary filter</span>
                  <span className="debug-value">
                    {debugInfo.salaryFilter?.min || debugInfo.salaryFilter?.max
                      ? `$${(debugInfo.salaryFilter.min || 0).toLocaleString()} - $${(debugInfo.salaryFilter.max || 300000).toLocaleString()}`
                      : 'None'}
                  </span>
                </div>

                {/* API raw count */}
                <div className="debug-row">
                  <span className="debug-label">API returned</span>
                  <span className={`debug-value ${debugInfo.apiReturned === 0 ? 'debug-error' : ''}`}>
                    {debugInfo.apiReturned ?? '—'} jobs
                  </span>
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
                        {debugInfo.remoteReasons.slice(0, 5).map((r, i) => (
                          <div key={i} className="debug-reason-item">
                            <span className="debug-reason-title">{r.title}</span>
                            <span className="debug-reason-why">{r.reason}</span>
                          </div>
                        ))}
                        {debugInfo.remoteReasons.length > 5 && (
                          <div className="debug-reason-more">+ {debugInfo.remoteReasons.length - 5} more</div>
                        )}
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
                        {debugInfo.employmentReasons.slice(0, 5).map((r, i) => (
                          <div key={i} className="debug-reason-item">
                            <span className="debug-reason-title">{r.title}</span>
                            <span className="debug-reason-why">{r.employmentType}</span>
                          </div>
                        ))}
                        {debugInfo.employmentReasons.length > 5 && (
                          <div className="debug-reason-more">+ {debugInfo.employmentReasons.length - 5} more</div>
                        )}
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
                    ? `API Error: ${debugInfo.error}. This could be a rate limit, quota exceeded, or invalid API key. Check the Settings panel for API status.`
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

                {/* Copy Debug Report button */}
                <button
                  className="debug-copy-btn"
                  onClick={() => {
                    const queriesStr = debugInfo.queries && debugInfo.queries.length > 0
                      ? debugInfo.queries.map(q => `"${q}"`).join(', ')
                      : debugInfo.query ? `"${debugInfo.query}"` : 'N/A';
                    const report = `=== JOBINATOR DEBUG REPORT ===
Timestamp: ${new Date().toISOString()}
Search Queries: ${queriesStr}
Job Titles: ${debugInfo.jobTitles?.join(', ') || 'N/A'}
Date Filter: ${debugInfo.datePosted}
Remote Only: ${debugInfo.isRemoteOnly ? 'Yes' : 'No'}
Salary Filter: ${debugInfo.salaryFilter?.min || 0} - ${debugInfo.salaryFilter?.max || 300000}

API Response:
- API Returned: ${debugInfo.apiReturned ?? 'N/A'} jobs
- Error: ${debugInfo.error || 'None'}

Filter Results:
- After Remote Filter: ${debugInfo.afterRemoteFilter ?? 'N/A'}
- Remote Filtered Out: ${debugInfo.remoteFilteredOut ?? 0}
- Salary Filtered Out: ${debugInfo.salaryFilteredOut ?? 0}
- Employment Filtered Out: ${debugInfo.employmentFilteredOut ?? 0}
- Final Count: ${debugInfo.afterEmploymentFilter ?? 0}

${debugInfo.remoteReasons?.length > 0 ? `Remote Filter Reasons:\n${debugInfo.remoteReasons.map(r => `  - ${r.title}: ${r.reason}`).join('\n')}` : ''}
${debugInfo.employmentReasons?.length > 0 ? `\nEmployment Filter Reasons:\n${debugInfo.employmentReasons.map(r => `  - ${r.title}: ${r.employmentType}`).join('\n')}` : ''}

Raw Debug Object:
${JSON.stringify(debugInfo, null, 2)}
=== END REPORT ===`;
                    navigator.clipboard.writeText(report);
                    alert('Debug report copied to clipboard!');
                  }}
                >
                  Copy Debug Report
                </button>
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

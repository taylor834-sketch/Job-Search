import { useState, useEffect } from 'react';
import SearchForm from './components/SearchForm';
import JobResults from './components/JobResults';
import JobActions from './components/JobActions';
import './App.css';

function App() {
  const [jobs, setJobs] = useState([]);
  const [searchCriteria, setSearchCriteria] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchResults = (results, criteria, debug) => {
    setJobs(results);
    setSearchCriteria(criteria);
    setDebugInfo(debug);
    setShowDebug(false);
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

        {!loading && jobs.length === 0 && debugInfo && (
          <div className="debug-panel">
            <button className="debug-toggle" onClick={() => setShowDebug(!showDebug)}>
              {showDebug ? 'Hide' : 'Show'} troubleshooting info
            </button>
            {showDebug && (
              <div className="debug-details">
                <p className="debug-title">Where did the jobs go?</p>
                <div className="debug-row">
                  <span className="debug-label">API returned</span>
                  <span className="debug-value">{debugInfo.apiReturned ?? '—'} jobs</span>
                </div>
                {debugInfo.isRemoteOnly && (
                  <div className="debug-row">
                    <span className="debug-label">Remote filter removed</span>
                    <span className={`debug-value ${debugInfo.remoteFilteredOut > 0 ? 'debug-hit' : ''}`}>{debugInfo.remoteFilteredOut} jobs</span>
                  </div>
                )}
                {(debugInfo.salaryFilter?.min != null || debugInfo.salaryFilter?.max != null) && (
                  <div className="debug-row">
                    <span className="debug-label">Salary filter removed</span>
                    <span className={`debug-value ${debugInfo.salaryFilteredOut > 0 ? 'debug-hit' : ''}`}>{debugInfo.salaryFilteredOut} jobs</span>
                  </div>
                )}
                {debugInfo.employmentType !== 'all' && (
                  <div className="debug-row">
                    <span className="debug-label">Employment type ({debugInfo.employmentType}) removed</span>
                    <span className={`debug-value ${debugInfo.employmentFilteredOut > 0 ? 'debug-hit' : ''}`}>{debugInfo.employmentFilteredOut} jobs</span>
                  </div>
                )}
                <div className="debug-row debug-final">
                  <span className="debug-label">Remaining after all filters</span>
                  <span className="debug-value">{debugInfo.afterEmploymentFilter ?? 0} jobs</span>
                </div>
                <p className="debug-hint">
                  {debugInfo.apiReturned === 0
                    ? 'The API itself returned nothing — try a broader search term or change the date filter.'
                    : debugInfo.remoteFilteredOut > 0 && debugInfo.afterEmploymentFilter === 0
                      ? 'The remote filter removed all results. These jobs mentioned office/hybrid keywords. Try removing "Remote Only" or broadening location types.'
                      : debugInfo.employmentFilteredOut > 0 && debugInfo.afterEmploymentFilter === 0
                        ? `All ${debugInfo.employmentFilteredOut} jobs were filtered by employment type. Try changing from "${debugInfo.employmentType}" to "All Types".`
                        : debugInfo.salaryFilteredOut > 0 && debugInfo.afterEmploymentFilter === 0
                          ? 'The salary range filtered out all results. Try widening your salary range.'
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
            <JobActions jobs={jobs} searchCriteria={searchCriteria} />
            <JobResults jobs={jobs} />
          </>
        )}
      </div>

      <footer className="app-footer">
        <p>Built by <a href="https://realsimplerevops.com" target="_blank" rel="noopener noreferrer">Real Simple RevOps</a></p>
        <p className="last-updated">Last updated: {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
      </footer>
    </div>
  );
}

export default App;

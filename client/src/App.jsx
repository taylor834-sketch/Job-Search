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
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchResults = (results, criteria) => {
    setJobs(results);
    setSearchCriteria(criteria);
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

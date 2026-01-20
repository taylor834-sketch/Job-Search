import { useState } from 'react';
import SearchForm from './components/SearchForm';
import JobResults from './components/JobResults';
import JobActions from './components/JobActions';
import './App.css';

function App() {
  const [jobs, setJobs] = useState([]);
  const [searchCriteria, setSearchCriteria] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        <p>Your AI-Powered Job Search Companion</p>
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
      </footer>
    </div>
  );
}

export default App;

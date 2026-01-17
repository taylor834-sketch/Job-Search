import { useState } from 'react';
import SearchForm from './components/SearchForm';
import JobResults from './components/JobResults';
import './App.css';

function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearchResults = (results) => {
    setJobs(results);
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
        <h1>Job Search Aggregator</h1>
        <p>Search across LinkedIn, BuiltIn, Remote Job Sites, and Google Jobs</p>
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
          <JobResults jobs={jobs} />
        )}
      </div>
    </div>
  );
}

export default App;

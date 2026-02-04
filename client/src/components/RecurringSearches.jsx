import { useState, useEffect } from 'react';
import { getRecurringSearches, deleteRecurringSearch, toggleRecurringSearch } from '../services/api';
import './RecurringSearches.css';

function RecurringSearches() {
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [error, setError] = useState(null);

  const fetchSearches = async () => {
    try {
      setLoading(true);
      const data = await getRecurringSearches();
      setSearches(data.searches || []);
      setError(null);
    } catch (e) {
      setError('Failed to load recurring searches');
    } finally {
      setLoading(false);
    }
  };

  // Fetch whenever the panel opens
  useEffect(() => {
    if (showPanel) fetchSearches();
  }, [showPanel]);

  const handleToggle = async (search) => {
    try {
      await toggleRecurringSearch(search.id, !search.isActive);
      // Optimistic update
      setSearches(prev =>
        prev.map(s => s.id === search.id ? { ...s, isActive: !s.isActive } : s)
      );
    } catch {
      setError('Failed to toggle search');
    }
  };

  const handleDelete = async (searchId) => {
    try {
      await deleteRecurringSearch(searchId);
      setSearches(prev => prev.filter(s => s.id !== searchId));
    } catch {
      setError('Failed to delete search');
    }
  };

  const formatDate = (iso) => {
    if (!iso) return 'Never';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  const formatCriteria = (criteria) => {
    if (!criteria) return 'N/A';
    const parts = [];
    if (criteria.jobTitle) parts.push(criteria.jobTitle);
    if (criteria.locationType?.length) parts.push(criteria.locationType.join(', '));
    if (criteria.location) parts.push(criteria.location);
    if (criteria.minSalary || criteria.maxSalary) {
      const min = criteria.minSalary ? '$' + Number(criteria.minSalary).toLocaleString() : '$0';
      const max = criteria.maxSalary ? '$' + Number(criteria.maxSalary).toLocaleString() : 'No max';
      parts.push(min + ' – ' + max);
    }
    if (criteria.datePosted && criteria.datePosted !== 'all') parts.push('Posted: ' + criteria.datePosted);
    return parts.join(' | ');
  };

  return (
    <div className="recurring-searches">
      <button
        className="recurring-toggle-btn"
        onClick={() => setShowPanel(!showPanel)}
      >
        <span className="recurring-toggle-icon">{showPanel ? '▾' : '▸'}</span>
        My Scheduled Searches
        {!loading && searches.length > 0 && (
          <span className="recurring-badge">{searches.length}</span>
        )}
      </button>

      {showPanel && (
        <div className="recurring-panel">
          {error && <p className="recurring-error">{error}</p>}

          {loading && <p className="recurring-loading">Loading...</p>}

          {!loading && searches.length === 0 && (
            <p className="recurring-empty">
              No scheduled searches yet. Use "Make Recurring Search" after a job search to set one up.
            </p>
          )}

          {!loading && searches.length > 0 && (
            <div className="recurring-list">
              {searches.map(search => (
                <div key={search.id} className={`recurring-item${search.isActive ? '' : ' recurring-item--inactive'}`}>
                  <div className="recurring-item-header">
                    <div className="recurring-item-criteria">
                      {formatCriteria(search.searchCriteria)}
                    </div>
                    <div className="recurring-item-actions">
                      <button
                        className={`recurring-toggle ${search.isActive ? 'recurring-toggle--on' : 'recurring-toggle--off'}`}
                        onClick={() => handleToggle(search)}
                        title={search.isActive ? 'Pause this search' : 'Resume this search'}
                      >
                        {search.isActive ? 'Active' : 'Paused'}
                      </button>
                      <button
                        className="recurring-delete"
                        onClick={() => handleDelete(search.id)}
                        title="Delete this scheduled search"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="recurring-item-meta">
                    <span className="recurring-meta-item">
                      <strong>Frequency:</strong> {search.frequency === 'weekly' ? 'Weekly (' + search.dayOfWeek + ')' : 'Daily'}
                    </span>
                    <span className="recurring-meta-item">
                      <strong>Email:</strong> {search.userEmail || 'Taylor@realsimplerevops.com'}
                    </span>
                    <span className="recurring-meta-item">
                      <strong>Created:</strong> {formatDate(search.createdAt)}
                    </span>
                    <span className="recurring-meta-item">
                      <strong>Last run:</strong> {formatDate(search.lastRun)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RecurringSearches;

import { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import { getRecurringSearches, deleteRecurringSearch, toggleRecurringSearch, updateRecurringSearch } from '../services/api';
import './RecurringSearches.css';

const dayOptions = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
];

function RecurringSearches({ onRegisterRefresh }) {
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [error, setError] = useState(null);

  // Edit modal state
  const [editingSearch, setEditingSearch] = useState(null); // the full search object being edited
  const [editTitle, setEditTitle] = useState('');
  const [editFrequency, setEditFrequency] = useState('daily');
  const [editDayOfWeek, setEditDayOfWeek] = useState(null);
  const [editEmail, setEditEmail] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const fetchSearches = useCallback(async () => {
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
  }, []);

  // Register our fetch function with the parent so it can trigger a refresh
  useEffect(() => {
    if (onRegisterRefresh) onRegisterRefresh(fetchSearches);
  }, [onRegisterRefresh, fetchSearches]);

  // Fetch whenever the panel opens
  useEffect(() => {
    if (showPanel) fetchSearches();
  }, [showPanel, fetchSearches]);

  const handleToggle = async (search) => {
    try {
      await toggleRecurringSearch(search.id, !search.isActive);
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

  // ── Edit modal helpers ──────────────────────────────────────────────────
  const openEdit = (search) => {
    setEditingSearch(search);
    setEditTitle(search.searchCriteria?.jobTitle || '');
    setEditFrequency(search.frequency || 'daily');
    setEditDayOfWeek(
      search.dayOfWeek
        ? dayOptions.find(d => d.value === search.dayOfWeek) || null
        : null
    );
    setEditEmail(search.userEmail || '');
  };

  const closeEdit = () => {
    setEditingSearch(null);
  };

  const handleSaveEdit = async () => {
    if (!editingSearch) return;
    if (editFrequency === 'weekly' && !editDayOfWeek) {
      setError('Please select a day of the week for weekly searches');
      return;
    }

    setEditSaving(true);
    try {
      const updatedCriteria = {
        ...editingSearch.searchCriteria,
        jobTitle: editTitle
      };

      await updateRecurringSearch(editingSearch.id, {
        searchCriteria: updatedCriteria,
        frequency: editFrequency,
        dayOfWeek: editFrequency === 'weekly' ? editDayOfWeek.value : null,
        userEmail: editEmail || null
      });

      // Optimistic local update
      setSearches(prev =>
        prev.map(s =>
          s.id === editingSearch.id
            ? {
                ...s,
                searchCriteria: updatedCriteria,
                frequency: editFrequency,
                dayOfWeek: editFrequency === 'weekly' ? editDayOfWeek.value : null,
                userEmail: editEmail || null
              }
            : s
        )
      );

      closeEdit();
      setError(null);
    } catch (e) {
      setError('Failed to save changes');
    } finally {
      setEditSaving(false);
    }
  };
  // ── end edit helpers ────────────────────────────────────────────────────

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
                        className="recurring-edit"
                        onClick={() => openEdit(search)}
                        title="Edit this scheduled search"
                      >
                        ✎
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
                      <strong>Frequency:</strong> {search.frequency === 'weekly' ? 'Weekly (' + (search.dayOfWeek || '—') + ')' : 'Daily'}
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

      {/* ── Edit modal ──────────────────────────────────────────────── */}
      {editingSearch && (
        <div className="modal-overlay" onClick={closeEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Scheduled Search</h2>
            <p className="modal-description">
              Update the search criteria or schedule for this recurring alert.
            </p>

            <div className="modal-form">
              {/* Job Title */}
              <div className="form-group">
                <label>Job Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g., Software Engineer"
                  className="text-input"
                />
              </div>

              {/* Frequency */}
              <div className="form-group">
                <label>Frequency</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      value="daily"
                      checked={editFrequency === 'daily'}
                      onChange={(e) => setEditFrequency(e.target.value)}
                    />
                    <span>Daily (jobs posted today)</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      value="weekly"
                      checked={editFrequency === 'weekly'}
                      onChange={(e) => setEditFrequency(e.target.value)}
                    />
                    <span>Weekly (jobs from last 7 days)</span>
                  </label>
                </div>
              </div>

              {/* Day picker — only when weekly */}
              {editFrequency === 'weekly' && (
                <div className="form-group">
                  <label>Day of Week</label>
                  <Select
                    options={dayOptions}
                    value={editDayOfWeek}
                    onChange={setEditDayOfWeek}
                    placeholder="Select day..."
                  />
                </div>
              )}

              {/* Email */}
              <div className="form-group">
                <label>Your Email (Optional)</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="text-input"
                />
                <small>Leave blank to only notify Taylor@realsimplerevops.com</small>
              </div>

              <div className="modal-actions">
                <button onClick={closeEdit} className="btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={editSaving}
                  className="btn-primary"
                >
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecurringSearches;

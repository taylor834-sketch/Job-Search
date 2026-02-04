import { useState } from 'react';
import Select from 'react-select';
import { exportJobs, createRecurringSearch } from '../services/api';
import './JobActions.css';

const dayOptions = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
];

function JobActions({ jobs, searchCriteria, selectedJobs, onSearchCreated }) {
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [frequency, setFrequency] = useState('daily');
  const [dayOfWeek, setDayOfWeek] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const runExport = async (jobsToExport) => {
    setIsExporting(true);
    try {
      await exportJobs(jobsToExport);
      setMessage({ type: 'success', text: `Exported ${jobsToExport.length} job${jobsToExport.length !== 1 ? 's' : ''} successfully!` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export jobs' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAll = () => runExport(jobs);

  const handleExportSelected = () => {
    const selected = jobs.filter(j => selectedJobs.has(j.link));
    if (selected.length === 0) return;
    runExport(selected);
  };

  const handleCreateRecurring = async () => {
    try {
      if (frequency === 'weekly' && !dayOfWeek) {
        setMessage({ type: 'error', text: 'Please select a day of the week' });
        return;
      }

      await createRecurringSearch({
        searchCriteria,
        frequency,
        dayOfWeek: frequency === 'weekly' ? dayOfWeek.value : null,
        userEmail: userEmail || null
      });

      setMessage({ type: 'success', text: 'Recurring search created! You will receive email alerts.' });
      setShowRecurringModal(false);
      if (onSearchCreated) onSearchCreated();

      setTimeout(() => {
        setMessage(null);
        setUserEmail('');
        setDayOfWeek(null);
      }, 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create recurring search' });
    }
  };

  return (
    <div className="job-actions">
      <div className="action-buttons">
        <button
          onClick={handleExportAll}
          disabled={isExporting || jobs.length === 0}
          className="action-btn export-btn"
        >
          {isExporting ? 'Exporting...' : `Export All (${jobs.length})`}
        </button>

        <button
          onClick={handleExportSelected}
          disabled={isExporting || selectedJobs.size === 0}
          className="action-btn export-selected-btn"
        >
          Export Selected ({selectedJobs.size})
        </button>

        <button
          onClick={() => setShowRecurringModal(true)}
          disabled={jobs.length === 0}
          className="action-btn recurring-btn"
        >
          Make Recurring Search
        </button>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {showRecurringModal && (
        <div className="modal-overlay" onClick={() => setShowRecurringModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Set Up Recurring Search</h2>
            <p className="modal-description">
              You'll receive email alerts with new job matches. Taylor@realsimplerevops.com will always be notified.
            </p>

            <div className="modal-form">
              <div className="form-group">
                <label>Frequency</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      value="daily"
                      checked={frequency === 'daily'}
                      onChange={(e) => setFrequency(e.target.value)}
                    />
                    <span>Daily (jobs posted today)</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      value="weekly"
                      checked={frequency === 'weekly'}
                      onChange={(e) => setFrequency(e.target.value)}
                    />
                    <span>Weekly (jobs from last 7 days)</span>
                  </label>
                </div>
              </div>

              {frequency === 'weekly' && (
                <div className="form-group">
                  <label>Day of Week</label>
                  <Select
                    options={dayOptions}
                    value={dayOfWeek}
                    onChange={setDayOfWeek}
                    placeholder="Select day..."
                  />
                </div>
              )}

              <div className="form-group">
                <label>Your Email (Optional)</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="text-input"
                />
                <small>Leave blank to only notify Taylor@realsimplerevops.com</small>
              </div>

              <div className="modal-actions">
                <button
                  onClick={() => setShowRecurringModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRecurring}
                  className="btn-primary"
                >
                  Create Recurring Search
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobActions;

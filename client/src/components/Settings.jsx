import { useState, useEffect } from 'react';
import { getApiStatus, testEmail as testEmailApi } from '../services/api';
import './Settings.css';

function Settings({ isOpen, onClose }) {
  const [apiStatus, setApiStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emailTesting, setEmailTesting] = useState(false);
  const [emailResult, setEmailResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchApiStatus();
    }
  }, [isOpen]);

  const fetchApiStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getApiStatus();
      setApiStatus(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      setEmailTesting(true);
      setEmailResult(null);
      const result = await testEmailApi();
      setEmailResult({ success: true, message: result.message });
    } catch (err) {
      setEmailResult({ success: false, message: err.message });
    } finally {
      setEmailTesting(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (isoString) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 90) return '#e74c3c';
    if (percentage >= 70) return '#f39c12';
    return '#27ae60';
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose}>&times;</button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h3>API Usage (JSearch / RapidAPI)</h3>

            {loading && (
              <div className="settings-loading">
                <div className="mini-spinner"></div>
                <span>Loading API status...</span>
              </div>
            )}

            {error && (
              <div className="settings-error">
                Failed to load API status: {error}
              </div>
            )}

            {!loading && !error && apiStatus && (
              <>
                <div className="api-status-card">
                  <div className="api-status-row">
                    <span className="api-label">API Key Configured</span>
                    <span className={`api-value ${apiStatus.hasApiKey ? 'status-ok' : 'status-error'}`}>
                      {apiStatus.hasApiKey ? 'Yes' : 'No - Add JSEARCH_API_KEY to .env'}
                    </span>
                  </div>
                </div>

                <div className="api-usage-card">
                  <div className="api-usage-header">
                    <span className="api-usage-title">
                      {apiStatus.currentMonth?.monthName || 'Current Month'}
                    </span>
                    <span className="api-usage-reset">
                      Resets in {apiStatus.daysUntilReset} days
                    </span>
                  </div>

                  <div className="api-usage-bar-container">
                    <div
                      className="api-usage-bar"
                      style={{
                        width: `${Math.min(apiStatus.estimatedLimit?.usedPercentage || 0, 100)}%`,
                        backgroundColor: getStatusColor(apiStatus.estimatedLimit?.usedPercentage || 0)
                      }}
                    />
                  </div>

                  <div className="api-usage-stats">
                    <div className="api-stat">
                      <span className="api-stat-value">{apiStatus.currentMonth?.calls || 0}</span>
                      <span className="api-stat-label">Total Calls</span>
                    </div>
                    <div className="api-stat">
                      <span className="api-stat-value">{apiStatus.currentMonth?.pages || 0}</span>
                      <span className="api-stat-label">Pages Fetched</span>
                    </div>
                    <div className="api-stat">
                      <span className="api-stat-value">{apiStatus.currentMonth?.successes || 0}</span>
                      <span className="api-stat-label">Successful</span>
                    </div>
                    <div className="api-stat">
                      <span className="api-stat-value" style={{ color: apiStatus.currentMonth?.failures > 0 ? '#e74c3c' : 'inherit' }}>
                        {apiStatus.currentMonth?.failures || 0}
                      </span>
                      <span className="api-stat-label">Failed</span>
                    </div>
                  </div>

                  {(apiStatus.currentMonth?.rateLimits > 0 || apiStatus.currentMonth?.quotaExceeded > 0) && (
                    <div className="api-warnings">
                      {apiStatus.currentMonth?.rateLimits > 0 && (
                        <div className="api-warning">
                          Rate limited {apiStatus.currentMonth.rateLimits} time{apiStatus.currentMonth.rateLimits > 1 ? 's' : ''}
                        </div>
                      )}
                      {apiStatus.currentMonth?.quotaExceeded > 0 && (
                        <div className="api-warning api-warning-critical">
                          Quota exceeded {apiStatus.currentMonth.quotaExceeded} time{apiStatus.currentMonth.quotaExceeded > 1 ? 's' : ''} - check your RapidAPI plan
                        </div>
                      )}
                    </div>
                  )}

                  <div className="api-usage-note">
                    {apiStatus.estimatedLimit?.note}
                  </div>
                </div>

                {apiStatus.currentMonth?.lastCall && (
                  <div className="api-last-call">
                    <span className="api-label">Last API Call</span>
                    <span className="api-value">{formatDate(apiStatus.currentMonth.lastCall)}</span>
                  </div>
                )}

                {apiStatus.recentCalls && apiStatus.recentCalls.length > 0 && (
                  <div className="api-recent-calls">
                    <h4>Recent API Calls</h4>
                    <div className="api-calls-list">
                      {apiStatus.recentCalls.map((call, index) => (
                        <div key={index} className={`api-call-item ${call.status}`}>
                          <span className="api-call-time">
                            {new Date(call.timestamp).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className="api-call-pages">{call.pages} page{call.pages > 1 ? 's' : ''}</span>
                          <span className={`api-call-status ${call.status}`}>
                            {call.status === 'success' ? 'OK' : call.errorType || 'Failed'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button className="api-refresh-btn" onClick={fetchApiStatus}>
                  Refresh Status
                </button>
              </>
            )}
          </div>

          <div className="settings-section">
            <h3>Email Configuration</h3>

            {!loading && apiStatus?.emailConfig && (
              <>
                <div className="api-status-card">
                  <div className="api-status-row">
                    <span className="api-label">Email Configured</span>
                    <span className={`api-value ${apiStatus.emailConfig.configured ? 'status-ok' : 'status-error'}`}>
                      {apiStatus.emailConfig.configured ? 'Yes' : 'No - Add EMAIL_USER and EMAIL_PASSWORD to .env'}
                    </span>
                  </div>
                  {apiStatus.emailConfig.configured && (
                    <>
                      <div className="api-status-row" style={{ marginTop: '10px' }}>
                        <span className="api-label">Service</span>
                        <span className="api-value">{apiStatus.emailConfig.service}</span>
                      </div>
                      <div className="api-status-row" style={{ marginTop: '10px' }}>
                        <span className="api-label">Sender</span>
                        <span className="api-value">{apiStatus.emailConfig.user}</span>
                      </div>
                      <div className="api-status-row" style={{ marginTop: '10px' }}>
                        <span className="api-label">Admin Email</span>
                        <span className="api-value">{apiStatus.emailConfig.adminEmail}</span>
                      </div>
                    </>
                  )}
                </div>

                {emailResult && (
                  <div className={`email-test-result ${emailResult.success ? 'email-test-success' : 'email-test-error'}`}>
                    {emailResult.message}
                  </div>
                )}

                <button
                  className="api-refresh-btn"
                  onClick={handleTestEmail}
                  disabled={emailTesting || !apiStatus.emailConfig.configured}
                  style={{ opacity: (!apiStatus.emailConfig.configured || emailTesting) ? 0.6 : 1 }}
                >
                  {emailTesting ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span className="mini-spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }}></span>
                      Sending...
                    </span>
                  ) : 'Send Test Email'}
                </button>
              </>
            )}
          </div>

          <div className="settings-section">
            <h3>About</h3>
            <p className="settings-about">
              Jobinator 3000 uses the JSearch API (via RapidAPI) to aggregate job listings
              from Google Jobs, LinkedIn, Indeed, and other sources. Check your
              <a href="https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch" target="_blank" rel="noopener noreferrer">
                {' '}RapidAPI dashboard{' '}
              </a>
              for exact usage limits based on your subscription plan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;

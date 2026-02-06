import axios from 'axios';

// In production (Render), use relative path. In development, use localhost
const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === 'production' ? '/api' : 'http://localhost:3001/api');

export const searchJobs = async (searchParams) => {
  try {
    // Use longer timeout for searches with multiple job titles
    const response = await axios.post(`${API_BASE_URL}/jobs/search`, searchParams, {
      timeout: 90000 // 90 seconds timeout
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error);

    // Check for timeout specifically
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new Error('Search timed out. Try searching for fewer job titles or try again.');
    }

    // Check for network error (server may be sleeping)
    if (error.code === 'ERR_NETWORK' || !error.response) {
      throw new Error('Connection error. The server may be waking up - please try again in 30 seconds.');
    }

    throw new Error(
      error.response?.data?.error ||
      'Failed to search for jobs. Please check your connection and try again.'
    );
  }
};

export const exportJobs = async (jobs) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/jobs/export`, { jobs }, {
      responseType: 'blob'
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `job-search-results-${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Export Error:', error);
    throw new Error('Failed to export jobs');
  }
};

export const createRecurringSearch = async (searchData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/jobs/recurring`, searchData);
    return response.data;
  } catch (error) {
    console.error('Create Recurring Search Error:', error);
    throw new Error(
      error.response?.data?.error ||
      'Failed to create recurring search'
    );
  }
};

export const getRecurringSearches = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/jobs/recurring`);
    return response.data;
  } catch (error) {
    console.error('Get Recurring Searches Error:', error);
    throw new Error('Failed to get recurring searches');
  }
};

export const deleteRecurringSearch = async (searchId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/jobs/recurring/${searchId}`);
    return response.data;
  } catch (error) {
    console.error('Delete Recurring Search Error:', error);
    throw new Error('Failed to delete recurring search');
  }
};

export const toggleRecurringSearch = async (searchId, isActive) => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/jobs/recurring/${searchId}/toggle`, { isActive });
    return response.data;
  } catch (error) {
    console.error('Toggle Recurring Search Error:', error);
    throw new Error('Failed to toggle recurring search');
  }
};

export const updateRecurringSearch = async (searchId, updateData) => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/jobs/recurring/${searchId}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Update Recurring Search Error:', error);
    throw new Error(
      error.response?.data?.error ||
      'Failed to update recurring search'
    );
  }
};

export const getApiStatus = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/jobs/api-status`);
    return response.data;
  } catch (error) {
    console.error('Get API Status Error:', error);
    throw new Error('Failed to get API status');
  }
};

export const testEmail = async (recipientEmail) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/jobs/test-email`, { recipientEmail }, {
      timeout: 30000
    });
    return response.data;
  } catch (error) {
    console.error('Test Email Error:', error);
    throw new Error(
      error.response?.data?.error || 'Failed to send test email'
    );
  }
};

export const runRecurringSearchNow = async (searchId) => {
  try {
    // This now returns immediately and runs in background
    const response = await axios.post(`${API_BASE_URL}/jobs/recurring/${searchId}/run`, {}, {
      timeout: 30000 // 30 seconds should be plenty for the initial response
    });
    return response.data;
  } catch (error) {
    console.error('Run Search Now Error:', error);

    // Check for timeout specifically
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new Error('Request timed out. The server may be waking up - try again in 30 seconds.');
    }

    // Check for network error (server may be sleeping)
    if (error.code === 'ERR_NETWORK' || !error.response) {
      throw new Error('Connection error. The server may be waking up - please try again in 30 seconds.');
    }

    throw new Error(
      error.response?.data?.error ||
      'Failed to run search. The server may be waking up - try again in 30 seconds.'
    );
  }
};

export const getRunNowStatus = async (statusKey) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/jobs/run-status/${statusKey}`, {
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('Get Run Status Error:', error);
    throw new Error(
      error.response?.data?.error ||
      'Failed to get status'
    );
  }
};

export const getAllRunStatuses = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/jobs/run-statuses`, {
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('Get All Run Statuses Error:', error);
    throw new Error(
      error.response?.data?.error ||
      'Failed to get statuses'
    );
  }
};

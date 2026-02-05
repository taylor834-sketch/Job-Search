import { JsonDB, Config } from 'node-json-db';
import { v4 as uuidv4 } from 'uuid';
import { format, subDays, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use absolute path so it works regardless of CWD
const dataDir = path.resolve(__dirname, '..', 'data');
const savedSearchesDB = new JsonDB(new Config(path.join(dataDir, 'savedSearches'), true, false, '/'));
const seenJobsDB = new JsonDB(new Config(path.join(dataDir, 'seenJobs'), true, false, '/'));
const apiUsageDB = new JsonDB(new Config(path.join(dataDir, 'apiUsage'), true, false, '/'));

// Saved Searches Management
export const saveSavedSearch = async (searchData) => {
  try {
    const searchId = uuidv4();
    const search = {
      id: searchId,
      ...searchData,
      createdAt: new Date().toISOString(),
      lastRun: null,
      isActive: true
    };

    await savedSearchesDB.push(`/searches/${searchId}`, search);
    return search;
  } catch (error) {
    console.error('Error saving search:', error);
    throw error;
  }
};

export const getSavedSearch = async (searchId) => {
  try {
    return await savedSearchesDB.getData(`/searches/${searchId}`);
  } catch (error) {
    if (error.message.includes("Can't find dataPath")) {
      return null;
    }
    throw error;
  }
};

export const getAllSavedSearches = async () => {
  try {
    const searches = await savedSearchesDB.getData('/searches');
    return Object.values(searches);
  } catch (error) {
    if (error.message.includes("Can't find dataPath")) {
      return [];
    }
    throw error;
  }
};

export const updateLastRun = async (searchId) => {
  try {
    await savedSearchesDB.push(`/searches/${searchId}/lastRun`, new Date().toISOString());
  } catch (error) {
    console.error('Error updating last run:', error);
  }
};

export const deleteSavedSearch = async (searchId) => {
  try {
    await savedSearchesDB.delete(`/searches/${searchId}`);
    return true;
  } catch (error) {
    console.error('Error deleting search:', error);
    return false;
  }
};

export const toggleSearchActive = async (searchId, isActive) => {
  try {
    await savedSearchesDB.push(`/searches/${searchId}/isActive`, isActive);
    return true;
  } catch (error) {
    console.error('Error toggling search:', error);
    return false;
  }
};

export const updateSavedSearch = async (searchId, updates) => {
  try {
    // Verify the search exists first
    const existing = await savedSearchesDB.getData(`/searches/${searchId}`);
    if (!existing) return null;

    // Apply only the allowed fields
    if (updates.searchCriteria) {
      await savedSearchesDB.push(`/searches/${searchId}/searchCriteria`, updates.searchCriteria);
    }
    if (updates.frequency) {
      await savedSearchesDB.push(`/searches/${searchId}/frequency`, updates.frequency);
      // If switching to daily, clear dayOfWeek
      if (updates.frequency === 'daily') {
        await savedSearchesDB.push(`/searches/${searchId}/dayOfWeek`, null);
      }
    }
    if (updates.dayOfWeek !== undefined) {
      await savedSearchesDB.push(`/searches/${searchId}/dayOfWeek`, updates.dayOfWeek);
    }
    if (updates.userEmail !== undefined) {
      await savedSearchesDB.push(`/searches/${searchId}/userEmail`, updates.userEmail || null);
    }

    // Return the updated record
    return await savedSearchesDB.getData(`/searches/${searchId}`);
  } catch (error) {
    console.error('Error updating search:', error);
    throw error;
  }
};

// Seen Jobs Management
const createJobKey = (job) => {
  // Create unique key from title and company (normalized)
  const normalizedTitle = job.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const normalizedCompany = job.company.toLowerCase().replace(/[^\w\s]/g, '').trim();
  return `${normalizedTitle}|${normalizedCompany}`;
};

export const markJobAsSeen = async (job, searchId) => {
  try {
    const jobKey = createJobKey(job);
    const seenJob = {
      ...job,
      seenAt: new Date().toISOString(),
      searchId
    };

    await seenJobsDB.push(`/jobs/${jobKey}`, seenJob);
  } catch (error) {
    console.error('Error marking job as seen:', error);
  }
};

export const isJobSeen = async (job) => {
  try {
    const jobKey = createJobKey(job);
    const seenJob = await seenJobsDB.getData(`/jobs/${jobKey}`);
    return !!seenJob;
  } catch (error) {
    if (error.message.includes("Can't find dataPath")) {
      return false;
    }
    return false;
  }
};

export const filterNewJobs = async (jobs) => {
  const seenFlags = await Promise.all(jobs.map(job => isJobSeen(job)));
  return jobs.filter((_, i) => !seenFlags[i]);
};

export const markMultipleJobsAsSeen = async (jobs, searchId) => {
  for (const job of jobs) {
    await markJobAsSeen(job, searchId);
  }
};

// Cleanup old seen jobs (older than 30 days)
export const cleanupOldSeenJobs = async () => {
  try {
    const allJobs = await seenJobsDB.getData('/jobs');
    const cutoffDate = subDays(new Date(), 30);

    for (const [key, job] of Object.entries(allJobs)) {
      const seenDate = new Date(job.seenAt);
      if (seenDate < cutoffDate) {
        await seenJobsDB.delete(`/jobs/${key}`);
      }
    }

    console.log('Cleaned up old seen jobs');
  } catch (error) {
    if (!error.message.includes("Can't find dataPath")) {
      console.error('Error cleaning up seen jobs:', error);
    }
  }
};

// Filter jobs by posting date
export const filterJobsByPostingDate = (jobs, daysBack = 1) => {
  const cutoffDate = subDays(new Date(), daysBack);

  return jobs.filter(job => {
    if (!job.postingDate) {
      // If no posting date, include it (might be new)
      return true;
    }

    try {
      const postingDate = new Date(job.postingDate);
      return postingDate >= cutoffDate;
    } catch (error) {
      // If can't parse date, include it
      return true;
    }
  });
};

// API Usage Tracking
const getMonthKey = () => {
  const now = new Date();
  return format(now, 'yyyy-MM');
};

export const recordApiCall = async (pagesRequested = 1, status = 'success', errorType = null) => {
  try {
    const monthKey = getMonthKey();
    const now = new Date().toISOString();

    // Get current month's data or initialize
    let monthData;
    try {
      monthData = await apiUsageDB.getData(`/months/${monthKey}`);
    } catch (e) {
      monthData = {
        calls: 0,
        pages: 0,
        successes: 0,
        failures: 0,
        rateLimits: 0,
        quotaExceeded: 0,
        lastCall: null,
        firstCall: now
      };
    }

    // Update counters
    monthData.calls += 1;
    monthData.pages += pagesRequested;
    monthData.lastCall = now;

    if (status === 'success') {
      monthData.successes += 1;
    } else if (status === 'failure') {
      monthData.failures += 1;
      if (errorType === 'rate_limit') {
        monthData.rateLimits += 1;
      } else if (errorType === 'quota_exceeded') {
        monthData.quotaExceeded += 1;
      }
    }

    await apiUsageDB.push(`/months/${monthKey}`, monthData);

    // Also record last few calls for recent activity display
    const callRecord = {
      timestamp: now,
      pages: pagesRequested,
      status,
      errorType
    };

    try {
      let recentCalls = await apiUsageDB.getData('/recentCalls');
      recentCalls = [callRecord, ...recentCalls].slice(0, 50); // Keep last 50 calls
      await apiUsageDB.push('/recentCalls', recentCalls);
    } catch (e) {
      await apiUsageDB.push('/recentCalls', [callRecord]);
    }

    return monthData;
  } catch (error) {
    console.error('Error recording API call:', error);
    return null;
  }
};

export const getApiUsageStats = async () => {
  try {
    const monthKey = getMonthKey();
    const now = new Date();

    // Get current month's data
    let currentMonth;
    try {
      currentMonth = await apiUsageDB.getData(`/months/${monthKey}`);
    } catch (e) {
      currentMonth = {
        calls: 0,
        pages: 0,
        successes: 0,
        failures: 0,
        rateLimits: 0,
        quotaExceeded: 0,
        lastCall: null,
        firstCall: null
      };
    }

    // Get recent calls
    let recentCalls = [];
    try {
      recentCalls = await apiUsageDB.getData('/recentCalls');
    } catch (e) {
      recentCalls = [];
    }

    // Calculate reset date (first of next month)
    const resetDate = startOfMonth(addMonths(now, 1));

    // Check if API key is configured
    const hasApiKey = !!process.env.JSEARCH_API_KEY;

    return {
      currentMonth: {
        ...currentMonth,
        monthName: format(now, 'MMMM yyyy')
      },
      resetDate: resetDate.toISOString(),
      daysUntilReset: Math.ceil((resetDate - now) / (1000 * 60 * 60 * 24)),
      recentCalls: recentCalls.slice(0, 10), // Last 10 calls for display
      hasApiKey,
      // RapidAPI JSearch free tier limits (approximate - users should check their plan)
      estimatedLimit: {
        note: 'Check your RapidAPI dashboard for exact limits',
        freeRequests: 500,
        usedPercentage: currentMonth.calls > 0 ? Math.round((currentMonth.calls / 500) * 100) : 0
      }
    };
  } catch (error) {
    console.error('Error getting API usage stats:', error);
    return {
      currentMonth: { calls: 0, pages: 0, successes: 0, failures: 0 },
      resetDate: null,
      daysUntilReset: 0,
      recentCalls: [],
      hasApiKey: !!process.env.JSEARCH_API_KEY,
      estimatedLimit: { note: 'Unable to load usage data', freeRequests: 500, usedPercentage: 0 }
    };
  }
};

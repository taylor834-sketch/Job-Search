import { JsonDB, Config } from 'node-json-db';
import { v4 as uuidv4 } from 'uuid';
import { format, subDays } from 'date-fns';

// Initialize databases
const savedSearchesDB = new JsonDB(new Config('data/savedSearches', true, false, '/'));
const seenJobsDB = new JsonDB(new Config('data/seenJobs', true, false, '/'));

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

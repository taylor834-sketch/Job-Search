import { searchJSearchAPI } from '../scrapers/jsearchAPI.js';
import { generateExcelFile } from '../utils/excelExport.js';
import { sendJobAlertEmail } from '../utils/emailService.js';
import { saveSavedSearch, getAllSavedSearches, deleteSavedSearch, toggleSearchActive, updateSavedSearch, getApiUsageStats, getSavedSearch, updateLastRun } from '../utils/database.js';

export const searchJobs = async (req, res) => {
  try {
    const {
      jobTitle,
      jobTitles, // Array of job titles (new)
      locationType, // ['remote', 'onsite', 'hybrid']
      location, // City, State for onsite/hybrid
      minSalary,
      maxSalary,
      datePosted
    } = req.body;

    console.log('Starting job search with params:', req.body);

    // Only use JSearch API - it already covers Google Jobs, LinkedIn, Indeed, and more
    const { jobs, debug } = await searchJSearchAPI({
      jobTitle,
      jobTitles,
      locationType,
      location,
      minSalary,
      maxSalary,
      datePosted
    });

    console.log(`JSearch API returned ${jobs.length} jobs after filtering`);

    if (jobs.length === 0) {
      return res.json({
        success: true,
        count: 0,
        jobs: [],
        debug,
        message: 'No jobs found matching your criteria. Try adjusting your filters (salary range, location, etc.)'
      });
    }

    res.json({
      success: true,
      count: jobs.length,
      jobs: jobs,
      debug
    });
  } catch (error) {
    console.error('Error in searchJobs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const exportToExcel = async (req, res) => {
  try {
    const { jobs } = req.body;

    if (!jobs || jobs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No jobs provided for export'
      });
    }

    const excelBuffer = await generateExcelFile(jobs);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="job-search-results-${Date.now()}.xlsx"`);
    res.send(excelBuffer);

  } catch (error) {
    console.error('Error exporting to Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createRecurringSearch = async (req, res) => {
  try {
    const {
      searchCriteria,
      frequency, // 'daily' or 'weekly'
      dayOfWeek, // for weekly: 'monday', 'tuesday', etc.
      userEmail
    } = req.body;

    if (!searchCriteria || !frequency) {
      return res.status(400).json({
        success: false,
        error: 'Search criteria and frequency are required'
      });
    }

    if (frequency === 'weekly' && !dayOfWeek) {
      return res.status(400).json({
        success: false,
        error: 'Day of week is required for weekly searches'
      });
    }

    const savedSearch = await saveSavedSearch({
      searchCriteria,
      frequency,
      dayOfWeek: frequency === 'weekly' ? dayOfWeek : null,
      userEmail: userEmail || null
    });

    res.json({
      success: true,
      message: 'Recurring search created successfully',
      searchId: savedSearch.id
    });

  } catch (error) {
    console.error('Error creating recurring search:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getRecurringSearches = async (req, res) => {
  try {
    const searches = await getAllSavedSearches();

    res.json({
      success: true,
      searches
    });

  } catch (error) {
    console.error('Error getting recurring searches:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const deleteRecurringSearch = async (req, res) => {
  try {
    const { searchId } = req.params;

    const success = await deleteSavedSearch(searchId);

    if (success) {
      res.json({
        success: true,
        message: 'Recurring search deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Search not found'
      });
    }

  } catch (error) {
    console.error('Error deleting recurring search:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const toggleRecurringSearch = async (req, res) => {
  try {
    const { searchId } = req.params;
    const { isActive } = req.body;

    await toggleSearchActive(searchId, isActive);

    res.json({
      success: true,
      message: `Search ${isActive ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error('Error toggling recurring search:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateRecurringSearch = async (req, res) => {
  try {
    const { searchId } = req.params;
    const { searchCriteria, frequency, dayOfWeek, userEmail } = req.body;

    if (frequency === 'weekly' && !dayOfWeek) {
      return res.status(400).json({
        success: false,
        error: 'Day of week is required for weekly searches'
      });
    }

    const updated = await updateSavedSearch(searchId, {
      searchCriteria,
      frequency,
      dayOfWeek: frequency === 'weekly' ? dayOfWeek : null,
      userEmail
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Search not found'
      });
    }

    res.json({
      success: true,
      message: 'Recurring search updated successfully',
      search: updated
    });

  } catch (error) {
    console.error('Error updating recurring search:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getApiStatus = async (req, res) => {
  try {
    const stats = await getApiUsageStats();

    res.json({
      success: true,
      ...stats
    });

  } catch (error) {
    console.error('Error getting API status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Store for tracking background job status
const runNowStatus = new Map();

// Clean up old status entries after 10 minutes
const cleanupOldStatus = () => {
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  for (const [key, value] of runNowStatus.entries()) {
    if (value.startTime < tenMinutesAgo) {
      runNowStatus.delete(key);
    }
  }
};

export const runRecurringSearchNow = async (req, res) => {
  try {
    const { searchId } = req.params;

    // Get the saved search
    const search = await getSavedSearch(searchId);
    if (!search) {
      return res.status(404).json({
        success: false,
        error: 'Search not found'
      });
    }

    // Clean up old entries
    cleanupOldStatus();

    // Initialize status tracking
    const statusKey = `${searchId}-${Date.now()}`;
    runNowStatus.set(statusKey, {
      searchId,
      status: 'running',
      startTime: Date.now(),
      message: 'Starting search...',
      debug: null,
      error: null
    });

    // Respond immediately - the search will run in the background
    res.json({
      success: true,
      message: 'Search started! You will receive an email shortly if jobs are found.',
      statusKey,
      background: true
    });

    // Run the actual search in the background (after response is sent)
    setImmediate(async () => {
      const status = runNowStatus.get(statusKey);
      try {
        const { searchCriteria } = search;

        // Ensure jobTitles array exists (backwards compat: old searches have jobTitle string)
        const searchParams = {
          ...searchCriteria,
          datePosted: 'week'
        };
        // If old format with jobTitle, convert to jobTitles array
        if (searchCriteria.jobTitle && !searchCriteria.jobTitles) {
          searchParams.jobTitles = [searchCriteria.jobTitle];
        }

        status.message = 'Searching for jobs...';
        console.log(`[RunNow ${statusKey}] Starting search for: ${JSON.stringify(searchParams.jobTitles || searchParams.jobTitle)}`);

        // Run the search (use 'week' for more results in manual runs)
        const { jobs, debug } = await searchJSearchAPI(searchParams);
        status.debug = debug;

        console.log(`[RunNow ${statusKey}] Found ${jobs.length} jobs`);

        if (jobs.length === 0) {
          status.status = 'completed';
          status.message = 'Search completed but no jobs found. No email sent.';
          status.jobsFound = 0;
          console.log(`[RunNow ${statusKey}] No jobs found, no email sent`);
          return;
        }

        status.message = `Found ${jobs.length} jobs, sending email...`;

        // Send the email
        await sendJobAlertEmail(search.userEmail, jobs, searchCriteria);

        // Update last run time
        await updateLastRun(searchId);

        status.status = 'completed';
        status.message = `Email sent with ${jobs.length} job(s)!`;
        status.jobsFound = jobs.length;
        console.log(`[RunNow ${statusKey}] Email sent successfully with ${jobs.length} jobs`);

      } catch (error) {
        console.error(`[RunNow ${statusKey}] Error:`, error);
        status.status = 'error';
        status.error = error.message;
        status.message = `Error: ${error.message}`;
      }
    });

  } catch (error) {
    console.error('Error initiating run now:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get status of a background run
export const getRunNowStatus = async (req, res) => {
  try {
    const { statusKey } = req.params;

    const status = runNowStatus.get(statusKey);
    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Status not found. It may have expired or the search was never started.'
      });
    }

    res.json({
      success: true,
      ...status,
      elapsed: Date.now() - status.startTime
    });

  } catch (error) {
    console.error('Error getting run status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all recent run statuses (for debugging)
export const getAllRunStatuses = async (req, res) => {
  try {
    cleanupOldStatus();

    const statuses = [];
    for (const [key, value] of runNowStatus.entries()) {
      statuses.push({
        statusKey: key,
        ...value,
        elapsed: Date.now() - value.startTime
      });
    }

    res.json({
      success: true,
      statuses: statuses.sort((a, b) => b.startTime - a.startTime)
    });

  } catch (error) {
    console.error('Error getting all run statuses:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

import { searchJSearchAPI } from '../scrapers/jsearchAPI.js';
import { generateExcelFile } from '../utils/excelExport.js';
import { sendJobAlertEmail } from '../utils/emailService.js';
import { saveSavedSearch, getAllSavedSearches, deleteSavedSearch, toggleSearchActive, updateSavedSearch, getApiUsageStats } from '../utils/database.js';

export const searchJobs = async (req, res) => {
  try {
    const {
      jobTitle,
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
      jobs: jobs
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

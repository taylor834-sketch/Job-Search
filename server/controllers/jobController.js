import { scrapeBuiltIn } from '../scrapers/builtinScraper.js';
import { scrapeRemoteJobs } from '../scrapers/remoteJobsScraper.js';
import { scrapeGoogleJobs } from '../scrapers/googleJobsScraper.js';
import { deduplicateJobs } from '../utils/deduplication.js';
import { generateExcelFile } from '../utils/excelExport.js';
import { sendJobAlertEmail } from '../utils/emailService.js';
import { saveSavedSearch, getAllSavedSearches, deleteSavedSearch, toggleSearchActive } from '../utils/database.js';

export const searchJobs = async (req, res) => {
  try {
    const {
      jobTitle,
      locationType, // ['remote', 'onsite', 'hybrid']
      companySizes, // ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001+']
      industries, // array of industries
      minSalary,
      maxSalary,
      sources // ['linkedin', 'builtin', 'remote', 'google']
    } = req.body;

    console.log('Starting job search with params:', req.body);

    const jobPromises = [];

    // LinkedIn scraper removed to reduce build size (Puppeteer dependency too large)
    // Keeping 4 other sources: BuiltIn, Remote Jobs, Google Jobs

    if (!sources || sources.includes('builtin')) {
      jobPromises.push(
        scrapeBuiltIn({
          jobTitle,
          locationType,
          companySizes,
          industries,
          minSalary,
          maxSalary
        })
      );
    }

    if (!sources || sources.includes('remote')) {
      jobPromises.push(
        scrapeRemoteJobs({
          jobTitle,
          locationType,
          companySizes,
          industries,
          minSalary,
          maxSalary
        })
      );
    }

    if (!sources || sources.includes('google')) {
      jobPromises.push(
        scrapeGoogleJobs({
          jobTitle,
          locationType,
          companySizes,
          industries,
          minSalary,
          maxSalary
        })
      );
    }

    const results = await Promise.allSettled(jobPromises);

    let allJobs = [];
    const scraperNames = ['BuiltIn', 'Remote Jobs', 'Google Jobs'];
    let scraperIndex = 0;

    results.forEach((result) => {
      const scraperName = scraperNames[scraperIndex] || `Scraper ${scraperIndex}`;
      if (result.status === 'fulfilled') {
        console.log(`${scraperName}: Found ${result.value.length} jobs`);
        allJobs = allJobs.concat(result.value);
      } else {
        console.error(`${scraperName} failed:`, result.reason.message || result.reason);
      }
      scraperIndex++;
    });

    const uniqueJobs = deduplicateJobs(allJobs);

    console.log(`Found ${uniqueJobs.length} unique jobs from ${allJobs.length} total results`);

    if (uniqueJobs.length === 0 && jobPromises.length > 0) {
      return res.json({
        success: true,
        count: 0,
        jobs: [],
        message: 'No jobs found. Try different search criteria or check the logs for scraper errors.'
      });
    }

    res.json({
      success: true,
      count: uniqueJobs.length,
      jobs: uniqueJobs
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

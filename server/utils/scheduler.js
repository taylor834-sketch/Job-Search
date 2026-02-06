import cron from 'node-cron';
import { getAllSavedSearches, updateLastRun, filterJobsByPostingDate, filterNewJobs, markMultipleJobsAsSeen, cleanupOldSeenJobs } from './database.js';
import { searchJSearchAPI } from '../scrapers/jsearchAPI.js';
import { sendJobAlertEmail } from './emailService.js';

const runScheduledSearch = async (search) => {
  try {
    console.log(`Running scheduled search: ${search.id}`);

    const { searchCriteria } = search;

    // Ensure jobTitles array exists (backwards compat: old searches have jobTitle string)
    const searchParams = {
      ...searchCriteria,
      datePosted: search.frequency === 'weekly' ? 'week' : 'today'
    };
    // If old format with jobTitle, convert to jobTitles array
    if (searchCriteria.jobTitle && !searchCriteria.jobTitles) {
      searchParams.jobTitles = [searchCriteria.jobTitle];
    }

    // JSearch API covers Google Jobs, LinkedIn, Indeed, and more
    // Skip salary scraping for scheduled searches to avoid slow processing
    const daysBack = search.frequency === 'weekly' ? 7 : 1;
    const { jobs: allJobs } = await searchJSearchAPI(searchParams, { skipScraping: true });

    // Filter by posting date based on frequency
    let uniqueJobs = filterJobsByPostingDate(allJobs, daysBack);

    // Filter out jobs we've already seen
    uniqueJobs = await filterNewJobs(uniqueJobs);

    console.log(`Found ${uniqueJobs.length} new jobs for search ${search.id}`);

    if (uniqueJobs.length > 0) {
      // Send email alert
      await sendJobAlertEmail(search.userEmail, uniqueJobs, searchCriteria);

      // Mark jobs as seen
      await markMultipleJobsAsSeen(uniqueJobs, search.id);
    }

    // Update last run time
    await updateLastRun(search.id);

  } catch (error) {
    console.error(`Error running scheduled search ${search.id}:`, error);
  }
};

const initializeSchedulers = async () => {
  // Daily job - runs at 9 AM every day
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily scheduled searches...');

    const searches = await getAllSavedSearches();
    const dailySearches = searches.filter(s => s.isActive && s.frequency === 'daily');

    for (const search of dailySearches) {
      await runScheduledSearch(search);
    }
  });

  // Weekly jobs - runs at 9 AM on specific days
  cron.schedule('0 9 * * 0-6', async () => {
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[today];

    console.log(`Running weekly scheduled searches for ${todayName}...`);

    const searches = await getAllSavedSearches();
    const weeklySearches = searches.filter(s =>
      s.isActive &&
      s.frequency === 'weekly' &&
      s.dayOfWeek === todayName
    );

    for (const search of weeklySearches) {
      await runScheduledSearch(search);
    }
  });

  // Cleanup old seen jobs - runs at midnight every day
  cron.schedule('0 0 * * *', async () => {
    console.log('Cleaning up old seen jobs...');
    await cleanupOldSeenJobs();
  });

  console.log('Job schedulers initialized');
};

export { initializeSchedulers, runScheduledSearch };

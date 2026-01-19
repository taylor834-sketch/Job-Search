import cron from 'node-cron';
import { getAllSavedSearches, updateLastRun, filterJobsByPostingDate, filterNewJobs, markMultipleJobsAsSeen, cleanupOldSeenJobs } from './database.js';
import { scrapeBuiltIn } from '../scrapers/builtinScraper.js';
import { scrapeRemoteJobs } from '../scrapers/remoteJobsScraper.js';
import { scrapeGoogleJobs } from '../scrapers/googleJobsScraper.js';
import { deduplicateJobs } from './deduplication.js';
import { sendJobAlertEmail } from './emailService.js';

const runScheduledSearch = async (search) => {
  try {
    console.log(`Running scheduled search: ${search.id}`);

    const { searchCriteria } = search;
    const jobPromises = [];

    // Run scrapers based on sources (LinkedIn removed - Puppeteer too heavy)

    if (!searchCriteria.sources || searchCriteria.sources.includes('builtin')) {
      jobPromises.push(scrapeBuiltIn(searchCriteria));
    }

    if (!searchCriteria.sources || searchCriteria.sources.includes('remote')) {
      jobPromises.push(scrapeRemoteJobs(searchCriteria));
    }

    if (!searchCriteria.sources || searchCriteria.sources.includes('google')) {
      jobPromises.push(scrapeGoogleJobs(searchCriteria));
    }

    const results = await Promise.allSettled(jobPromises);

    let allJobs = [];
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allJobs = allJobs.concat(result.value);
      }
    });

    // Deduplicate
    let uniqueJobs = deduplicateJobs(allJobs);

    // Filter by posting date based on frequency
    const daysBack = search.frequency === 'weekly' ? 7 : 1;
    uniqueJobs = filterJobsByPostingDate(uniqueJobs, daysBack);

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

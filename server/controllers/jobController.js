import { scrapeLinkedIn } from '../scrapers/linkedinScraper.js';
import { scrapeBuiltIn } from '../scrapers/builtinScraper.js';
import { scrapeRemoteJobs } from '../scrapers/remoteJobsScraper.js';
import { scrapeGoogleJobs } from '../scrapers/googleJobsScraper.js';
import { saveToGoogleSheets } from '../utils/googleSheets.js';
import { deduplicateJobs } from '../utils/deduplication.js';

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

    if (!sources || sources.includes('linkedin')) {
      jobPromises.push(
        scrapeLinkedIn({
          jobTitle,
          locationType,
          companySizes,
          industries,
          minSalary,
          maxSalary
        })
      );
    }

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
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allJobs = allJobs.concat(result.value);
      } else {
        console.error(`Scraper ${index} failed:`, result.reason);
      }
    });

    const uniqueJobs = deduplicateJobs(allJobs);

    console.log(`Found ${uniqueJobs.length} unique jobs`);

    if (uniqueJobs.length > 0) {
      await saveToGoogleSheets(uniqueJobs);
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

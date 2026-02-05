/**
 * GitHub-based storage for recurring searches
 * Each search is stored as a JSON file in the searches/ folder of the repo
 * This ensures persistence across Render deployments
 */

const GITHUB_API = 'https://api.github.com';
const REPO_OWNER = process.env.GITHUB_REPO_OWNER || 'taylor834-sketch';
const REPO_NAME = process.env.GITHUB_REPO_NAME || 'Job-Search';
const SEARCHES_PATH = 'searches';

// Get auth headers
const getHeaders = () => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is required for persistent storage');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
};

// In-memory cache to reduce API calls
let searchCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Get all saved searches from GitHub
 */
export const getAllSavedSearchesFromGitHub = async (bypassCache = false) => {
  // Return cached data if valid
  if (!bypassCache && searchCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_TTL)) {
    return searchCache;
  }

  try {
    const headers = getHeaders();

    // Get contents of searches directory
    const response = await fetch(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${SEARCHES_PATH}`,
      { headers }
    );

    if (response.status === 404) {
      // Directory doesn't exist yet, return empty array
      console.log('Searches directory not found, returning empty array');
      searchCache = [];
      cacheTimestamp = Date.now();
      return [];
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${error}`);
    }

    const files = await response.json();

    // Filter for .json files only
    const jsonFiles = files.filter(f => f.name.endsWith('.json'));

    // Fetch content of each file
    const searches = await Promise.all(
      jsonFiles.map(async (file) => {
        try {
          const fileResponse = await fetch(file.download_url);
          const content = await fileResponse.json();
          return {
            ...content,
            _sha: file.sha // Store SHA for updates
          };
        } catch (err) {
          console.error(`Error reading search file ${file.name}:`, err);
          return null;
        }
      })
    );

    // Filter out any failed reads
    const validSearches = searches.filter(s => s !== null);

    // Update cache
    searchCache = validSearches;
    cacheTimestamp = Date.now();

    console.log(`Loaded ${validSearches.length} searches from GitHub`);
    return validSearches;
  } catch (error) {
    console.error('Error fetching searches from GitHub:', error);
    // Return cached data if available, even if stale
    if (searchCache) {
      console.log('Returning stale cache due to error');
      return searchCache;
    }
    return [];
  }
};

/**
 * Get a single search by ID
 */
export const getSavedSearchFromGitHub = async (searchId) => {
  const searches = await getAllSavedSearchesFromGitHub();
  return searches.find(s => s.id === searchId) || null;
};

/**
 * Create or update a search file in GitHub
 */
export const saveSearchToGitHub = async (searchData) => {
  try {
    const headers = getHeaders();
    const filePath = `${SEARCHES_PATH}/${searchData.id}.json`;

    // Check if file already exists to get its SHA
    let existingSha = searchData._sha;
    if (!existingSha) {
      try {
        const checkResponse = await fetch(
          `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`,
          { headers }
        );
        if (checkResponse.ok) {
          const existing = await checkResponse.json();
          existingSha = existing.sha;
        }
      } catch (err) {
        // File doesn't exist, that's fine
      }
    }

    // Remove internal fields before saving
    const { _sha, ...dataToSave } = searchData;

    // Prepare content
    const content = Buffer.from(JSON.stringify(dataToSave, null, 2)).toString('base64');

    const body = {
      message: existingSha
        ? `Update search: ${searchData.searchCriteria?.jobTitles?.[0] || searchData.searchCriteria?.jobTitle || searchData.id}`
        : `Add search: ${searchData.searchCriteria?.jobTitles?.[0] || searchData.searchCriteria?.jobTitle || searchData.id}`,
      content,
      branch: 'main'
    };

    if (existingSha) {
      body.sha = existingSha;
    }

    const response = await fetch(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${error}`);
    }

    const result = await response.json();

    // Invalidate cache
    searchCache = null;
    cacheTimestamp = null;

    console.log(`Saved search ${searchData.id} to GitHub`);

    return {
      ...dataToSave,
      _sha: result.content.sha
    };
  } catch (error) {
    console.error('Error saving search to GitHub:', error);
    throw error;
  }
};

/**
 * Delete a search file from GitHub
 */
export const deleteSearchFromGitHub = async (searchId) => {
  try {
    const headers = getHeaders();
    const filePath = `${SEARCHES_PATH}/${searchId}.json`;

    // Get file SHA (required for deletion)
    const checkResponse = await fetch(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`,
      { headers }
    );

    if (checkResponse.status === 404) {
      console.log(`Search ${searchId} not found in GitHub, nothing to delete`);
      return true;
    }

    if (!checkResponse.ok) {
      const error = await checkResponse.text();
      throw new Error(`GitHub API error: ${checkResponse.status} - ${error}`);
    }

    const file = await checkResponse.json();

    // Delete the file
    const response = await fetch(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`,
      {
        method: 'DELETE',
        headers,
        body: JSON.stringify({
          message: `Delete search: ${searchId}`,
          sha: file.sha,
          branch: 'main'
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${error}`);
    }

    // Invalidate cache
    searchCache = null;
    cacheTimestamp = null;

    console.log(`Deleted search ${searchId} from GitHub`);
    return true;
  } catch (error) {
    console.error('Error deleting search from GitHub:', error);
    throw error;
  }
};

/**
 * Update lastRun timestamp for a search
 */
export const updateLastRunInGitHub = async (searchId) => {
  try {
    const search = await getSavedSearchFromGitHub(searchId);
    if (!search) {
      console.error(`Search ${searchId} not found for lastRun update`);
      return;
    }

    search.lastRun = new Date().toISOString();

    // Add to run history
    if (!search.runHistory) {
      search.runHistory = [];
    }
    search.runHistory.push({
      timestamp: search.lastRun,
      status: 'completed'
    });
    // Keep only last 50 runs
    if (search.runHistory.length > 50) {
      search.runHistory = search.runHistory.slice(-50);
    }

    await saveSearchToGitHub(search);
  } catch (error) {
    console.error('Error updating lastRun in GitHub:', error);
  }
};

/**
 * Initialize the searches directory if it doesn't exist
 */
export const initializeSearchesDirectory = async () => {
  try {
    const headers = getHeaders();

    // Check if directory exists
    const response = await fetch(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${SEARCHES_PATH}`,
      { headers }
    );

    if (response.status === 404) {
      // Create a .gitkeep file to initialize the directory
      const content = Buffer.from('# This directory stores recurring search configurations\n').toString('base64');

      await fetch(
        `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${SEARCHES_PATH}/README.md`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            message: 'Initialize searches directory',
            content,
            branch: 'main'
          })
        }
      );

      console.log('Created searches directory in GitHub');
    } else {
      console.log('Searches directory already exists in GitHub');
    }
  } catch (error) {
    console.error('Error initializing searches directory:', error);
  }
};

/**
 * Check if GitHub storage is configured
 */
export const isGitHubStorageConfigured = () => {
  return !!process.env.GITHUB_TOKEN;
};

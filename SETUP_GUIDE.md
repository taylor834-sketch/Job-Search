# Quick Setup Guide

Follow these steps to get your Job Search Aggregator up and running.

## Step 1: Install Dependencies

```bash
npm run install-all
```

This will install all dependencies for both the server and client.

## Step 2: Set Up Google Sheets API

### Create a Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Click "Select a Project" → "New Project"
3. Name it "Job Search Aggregator" and click "Create"

### Enable Google Sheets API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on it and press "Enable"

### Create Service Account

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Fill in:
   - Service account name: `job-searcher`
   - Service account ID: (auto-filled)
   - Click "Create and Continue"
4. Skip the optional steps and click "Done"

### Get Service Account Key

1. Click on the service account you just created
2. Go to the "Keys" tab
3. Click "Add Key" → "Create New Key"
4. Choose "JSON" format
5. Click "Create" - a JSON file will download

### Create Google Sheet

1. Go to https://docs.google.com/spreadsheets/
2. Create a new blank spreadsheet
3. Name it "Job Search Results" (or whatever you prefer)
4. Copy the Spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
   ```

### Share Sheet with Service Account

1. In your Google Sheet, click "Share"
2. Paste the service account email from the JSON file (it looks like: `job-searcher@project-name.iam.gserviceaccount.com`)
3. Give it "Editor" access
4. Click "Share"

## Step 3: Configure Environment Variables

1. Copy the example env file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` in a text editor

3. Fill in the values from your JSON file:
   - `GOOGLE_SPREADSHEET_ID`: The ID from your sheet URL
   - `GOOGLE_CLIENT_EMAIL`: The `client_email` from the JSON file
   - `GOOGLE_PRIVATE_KEY`: The `private_key` from the JSON file (keep the quotes!)

Example `.env`:
```env
PORT=3001

GOOGLE_SPREADSHEET_ID=1abc123xyz456
GOOGLE_CLIENT_EMAIL=job-searcher@project-12345.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...\n-----END PRIVATE KEY-----\n"
```

**Important**: Make sure the private key keeps all the `\n` characters and stays in quotes!

## Step 4: Run the Application

Start both the server and client in development mode:

```bash
npm run dev
```

The application will open at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Step 5: Test It Out

1. Open http://localhost:3000 in your browser
2. Enter a job title (e.g., "Software Engineer")
3. Select your preferences (location type, company size, etc.)
4. Click "Search Jobs"
5. Wait for results (this may take 30-60 seconds)
6. Check your Google Sheet - it should have new entries!

## Troubleshooting

### Error: "Cannot find module..."
Run `npm run install-all` again to ensure all dependencies are installed.

### Error: "Google Sheets API error"
- Make sure you shared the sheet with the service account email
- Verify the spreadsheet ID is correct
- Check that the private key in `.env` is properly formatted

### No results found
- Try a broader search term
- Reduce filters
- Check the terminal/console for specific scraper errors
- Some sites may be blocking automated access

### Scrapers timing out
- This is normal for some sites with anti-bot measures
- The app will continue with other sources that work
- Check server logs to see which scrapers succeeded

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- See [CONTRIBUTING.md](CONTRIBUTING.md) to learn about contributing
- Check the Google Sheet to verify data is being saved correctly
- Customize the search filters to your preferences

## Need Help?

Open an issue on GitHub with:
- What you were trying to do
- What happened instead
- Error messages (from browser console and terminal)
- Your operating system and Node.js version

Happy job hunting!

# Quick Start

Get your Job Search Aggregator running in 5 minutes!

## Prerequisites
- Node.js 18+ installed
- Google account for Sheets API

## Installation

### 1. Install Dependencies
```bash
npm run install-all
```

### 2. Set Up Google Sheets API
Follow the detailed steps in [SETUP_GUIDE.md](SETUP_GUIDE.md) to:
- Create a Google Cloud project
- Enable Google Sheets API
- Create a service account and download credentials
- Create a Google Sheet and share it with the service account

### 3. Configure Environment
```bash
cp .env.example .env
```
Edit `.env` and add your Google Sheets credentials from the JSON file you downloaded.

### 4. Run the App
```bash
npm run dev
```

Open http://localhost:3000 in your browser!

## First Search

1. Enter a job title (e.g., "Software Engineer")
2. Select your preferences (optional):
   - Location type: Remote, Onsite, or Hybrid
   - Company sizes
   - Industries
   - Salary range
3. Click "Search Jobs"
4. Wait 30-60 seconds for results
5. Check your Google Sheet - jobs are automatically saved!

## What's Next?

- Read [README.md](README.md) for full documentation
- See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed setup instructions
- Check [GITHUB_SETUP.md](GITHUB_SETUP.md) to publish to GitHub
- Review [CONTRIBUTING.md](CONTRIBUTING.md) to contribute

## Troubleshooting

**No results?**
- Check the browser console and terminal for errors
- Try a broader search term
- Verify Google Sheets credentials are correct

**Google Sheets not updating?**
- Make sure you shared the sheet with the service account email
- Check that the spreadsheet ID is correct in `.env`

**Scrapers failing?**
- This is normal - some sites have anti-bot measures
- The app will show results from scrapers that succeed
- Check server logs to see which scrapers worked

## Need Help?

Open an issue on GitHub with details about your problem!

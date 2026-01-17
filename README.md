# Job Search Aggregator

A comprehensive job search tool that aggregates listings from LinkedIn, BuiltIn, remote job websites (RemoteOK, WeWorkRemotely, Remote.co), and Google Jobs. All results are automatically saved to a Google Sheets document for easy tracking and analysis.

## Features

- **Multi-Source Search**: Scrapes jobs from LinkedIn, BuiltIn, RemoteOK, WeWorkRemotely, Remote.co, and Google Jobs
- **Advanced Filtering**:
  - Job title search
  - Location type (Remote, Onsite, Hybrid) - multi-select
  - Company size - multi-select
  - Industry - multi-select
  - Salary range slider
  - Choose specific job sources
- **Google Sheets Integration**: Automatically saves all job listings with complete details
- **Deduplication**: Intelligent job deduplication across sources
- **Modern UI**: Clean, responsive interface built with React

## Tech Stack

### Backend
- Node.js + Express
- Puppeteer (for dynamic content scraping)
- Axios + Cheerio (for static content scraping)
- Google Sheets API
- Date-fns for date formatting

### Frontend
- React 18
- Vite
- React-Select for multi-select dropdowns
- RC-Slider for salary range
- Axios for API calls

## Prerequisites

- Node.js 18+ and npm
- Google Cloud Platform account (for Sheets API)
- Git

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/job-search-aggregator.git
cd job-search-aggregator
```

### 2. Install Dependencies

```bash
npm run install-all
```

This installs dependencies for both the server and client.

### 3. Set Up Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API
4. Create a Service Account:
   - Go to "Credentials" → "Create Credentials" → "Service Account"
   - Give it a name and create it
   - Click on the service account → "Keys" → "Add Key" → "Create New Key" → "JSON"
   - Download the JSON file
5. Create a new Google Sheet
6. Share the sheet with the service account email (found in the JSON file as `client_email`)
7. Copy the Spreadsheet ID from the URL (the long string between `/d/` and `/edit`)

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
PORT=3001

GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

**Important**: Make sure to keep the quotes around `GOOGLE_PRIVATE_KEY` and preserve the `\n` characters.

## Usage

### Development Mode

Run both the server and client in development mode:

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Production Build

Build the frontend:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## How It Works

1. **User Input**: Enter job search criteria through the web interface
2. **Parallel Scraping**: The backend scrapes all selected job sources simultaneously
3. **Deduplication**: Jobs are deduplicated based on title and company name
4. **Google Sheets**: Results are automatically appended to your Google Sheet with:
   - Date pulled
   - Job title
   - Company name
   - Company size
   - Industry
   - Location
   - Salary
   - Source
   - Job link
   - Description
5. **Display**: Results are shown in a clean, card-based layout

## Data Collected

For each job listing, the following information is collected (when available):

- Job title
- Company name
- Company size
- Industry
- Location/work type
- Salary range
- Job description
- Application link
- Source platform
- Date pulled

## Important Notes

### Web Scraping Limitations

- **Rate Limiting**: Some sites may rate-limit or block requests. The tool includes error handling to continue with other sources if one fails.
- **Anti-Bot Measures**: LinkedIn and other sites have anti-scraping measures. Results may vary.
- **Dynamic Content**: Some sites load content dynamically. Puppeteer is used for these cases but may be slower.
- **Structure Changes**: Job sites frequently update their HTML structure, which may break scrapers. You may need to update selectors.

### Best Practices

- Don't run searches too frequently (respect rate limits)
- Use specific job titles for better results
- The more sources you select, the longer the search will take
- Check the Google Sheet regularly for new listings

### Legal Considerations

- This tool is for personal use only
- Always review the Terms of Service of the websites you're scraping
- Respect robots.txt files
- Don't use this for commercial purposes without proper authorization

## Troubleshooting

### "No jobs found"
- Try broader search terms
- Reduce the number of filters
- Check if the job sites are accessible
- Look at server logs for specific errors

### Google Sheets not updating
- Verify your service account has edit access to the sheet
- Check that environment variables are set correctly
- Ensure the private key format is correct (with `\n` preserved)

### Scraper errors
- Some sites may block automated access
- Try reducing the frequency of requests
- Check if site structure has changed (may need to update selectors)

## Project Structure

```
job-search-aggregator/
├── server/
│   ├── index.js                 # Express server
│   ├── routes/
│   │   └── jobRoutes.js         # API routes
│   ├── controllers/
│   │   └── jobController.js     # Request handlers
│   ├── scrapers/
│   │   ├── linkedinScraper.js   # LinkedIn scraper
│   │   ├── builtinScraper.js    # BuiltIn scraper
│   │   ├── remoteJobsScraper.js # Remote job sites scraper
│   │   └── googleJobsScraper.js # Google Jobs scraper
│   └── utils/
│       ├── googleSheets.js      # Google Sheets integration
│       └── deduplication.js     # Job deduplication logic
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SearchForm.jsx   # Search form component
│   │   │   ├── JobResults.jsx   # Results container
│   │   │   └── JobCard.jsx      # Individual job card
│   │   ├── services/
│   │   │   └── api.js           # API service
│   │   ├── App.jsx              # Main app component
│   │   └── main.jsx             # App entry point
│   ├── index.html
│   └── vite.config.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Future Enhancements

- [ ] Add email notifications for new job matches
- [ ] Implement job application tracking
- [ ] Add more job sources (Indeed, Glassdoor, etc.)
- [ ] Create filters for experience level
- [ ] Add job favoriting/bookmarking
- [ ] Implement scheduled/automated searches
- [ ] Add export to CSV functionality
- [ ] Create browser extension

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This tool is provided for educational and personal use only. Users are responsible for ensuring their use complies with the terms of service of the websites being scraped. The authors are not responsible for any misuse of this tool.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Made with ❤️ for job seekers everywhere

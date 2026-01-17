# Contributing to Job Search Aggregator

Thank you for considering contributing to the Job Search Aggregator! This document provides guidelines and instructions for contributing.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue on GitHub with:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Your environment (OS, Node version, browser)

### Suggesting Enhancements

Enhancement suggestions are welcome! Please open an issue with:
- A clear, descriptive title
- Detailed description of the proposed feature
- Use cases and benefits
- Any potential drawbacks or challenges

### Adding New Job Sources

To add a new job source:

1. Create a new scraper file in `server/scrapers/`
2. Follow the existing scraper pattern:
   ```javascript
   export const scrapeYourSite = async (filters) => {
     // Return array of job objects with this structure:
     // {
     //   title, company, location, link, description,
     //   salary, source, datePulled, companySize, industry
     // }
   };
   ```
3. Import and add to `server/controllers/jobController.js`
4. Update the frontend `sourceOptions` in `SearchForm.jsx`
5. Test thoroughly
6. Update README.md with the new source

### Pull Request Process

1. Fork the repository
2. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes
4. Test your changes thoroughly
5. Update documentation as needed
6. Commit with clear, descriptive messages:
   ```bash
   git commit -m "Add feature: description of what you added"
   ```
7. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
8. Open a Pull Request with:
   - Clear title and description
   - Reference to related issues
   - Screenshots/demos if applicable

### Code Style Guidelines

- Use ES6+ features
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and single-purpose
- Handle errors gracefully
- Use async/await for asynchronous code

### Testing

Before submitting a PR:
- Test the search functionality with various filters
- Verify Google Sheets integration works
- Check that all scrapers handle errors gracefully
- Test the UI responsiveness
- Ensure no console errors

### Commit Message Guidelines

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- First line should be 50 characters or less
- Reference issues and PRs when relevant

Examples:
```
Add RemoteJobs scraper for additional job sources
Fix salary parsing in LinkedIn scraper
Update README with new installation instructions
Refactor deduplication logic for better performance
```

## Development Setup

1. Follow the installation instructions in README.md
2. Make sure all tests pass before making changes
3. Create a new branch for your work
4. Make changes and test locally
5. Submit a pull request

## Questions?

Feel free to open an issue with any questions about contributing!

Thank you for contributing!

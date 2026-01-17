# Email Setup Guide

To enable email notifications for job alerts, you need to configure email credentials. This guide covers Gmail setup, but you can use any email service.

## Option 1: Gmail (Recommended)

### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account settings: https://myaccount.google.com/
2. Click on "Security" in the left sidebar
3. Enable "2-Step Verification" if not already enabled

### Step 2: Create App Password

1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Name it "Job Search Aggregator"
4. Click "Generate"
5. **Copy the 16-character password** (you'll only see this once!)

### Step 3: Configure .env File

Create a `.env` file in the project root (if you haven't already):

```env
PORT=3001

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
ADMIN_EMAIL=Taylor@realsimplerevops.com
```

Replace:
- `your-email@gmail.com` with your Gmail address
- `your-16-char-app-password` with the app password you just generated

## Option 2: Other Email Services

### Outlook/Hotmail

```env
EMAIL_SERVICE=hotmail
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
ADMIN_EMAIL=Taylor@realsimplerevops.com
```

### Yahoo Mail

```env
EMAIL_SERVICE=yahoo
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password
ADMIN_EMAIL=Taylor@realsimplerevops.com
```

Note: Yahoo also requires an app password. Generate one at: https://login.yahoo.com/account/security

### Custom SMTP Server

For other email providers, you can configure custom SMTP settings in `server/utils/emailService.js`:

```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.yourdomain.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

## Testing Email Configuration

After setting up your `.env` file:

1. Start the server:
   ```bash
   npm run server
   ```

2. Make a test search and create a recurring search with your email

3. Check your inbox for the confirmation

## Troubleshooting

### "Invalid login" error
- Double-check your email and password
- Make sure you're using an **app password**, not your regular password (for Gmail/Yahoo)
- Verify 2FA is enabled on your Google account

### "Connection timeout" error
- Check your internet connection
- Some networks block SMTP ports - try a different network
- Verify the email service is correct in your `.env`

### Not receiving emails
- Check your spam folder
- Verify the email address is correct
- Check server logs for error messages
- Make sure the server is running when scheduled jobs run

## How Email Notifications Work

1. **Immediate Search**: When you search for jobs, you can export to Excel or create a recurring search
2. **Recurring Searches**:
   - Daily: Runs at 9 AM every day, sends jobs posted that day
   - Weekly: Runs at 9 AM on your chosen day, sends jobs from the past 7 days
3. **Email Recipients**:
   - Taylor@realsimplerevops.com (always included)
   - Your email (if you provide one when creating the recurring search)
4. **Deduplication**: Jobs you've already been notified about won't be sent again

## Security Notes

- **Never commit your `.env` file to Git** - it's already in `.gitignore`
- Use app passwords (not your main password) when possible
- Limit access to your `.env` file
- For production deployment, use environment variables provided by your hosting service

## Email Template

Emails include:
- Search criteria used
- Number of jobs found
- Job details (title, company, location, salary, posting date)
- Direct links to each job
- Professional formatting with your branding

## Need Help?

If you're having trouble with email setup, open an issue on GitHub with:
- The email service you're trying to use
- Any error messages you're seeing
- Whether you've successfully generated an app password

---

Happy job hunting with automated email alerts!

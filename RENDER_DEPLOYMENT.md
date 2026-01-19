# Render.com Deployment Guide

Deploy your Job Search Aggregator to Render.com for **free** with full support for scheduled jobs and email notifications.

## Why Render.com?

- ✅ **Completely Free** - No credit card required
- ✅ **Cron Jobs Work** - Daily/weekly email alerts will run automatically
- ✅ **24/7 Uptime** - Your app stays running
- ✅ **Auto-deploys** - Pushes to GitHub automatically deploy
- ✅ **Easy Setup** - 5 minutes to deploy

## Prerequisites

- GitHub account with your code pushed (✅ Already done!)
- Email credentials set up (see EMAIL_SETUP_GUIDE.md)

## Step 1: Create Render Account

1. Go to https://render.com/
2. Click **"Get Started"**
3. Sign up with your **GitHub account** (easiest option)
4. Authorize Render to access your repositories

## Step 2: Create a New Web Service

1. From the Render dashboard, click **"New +"** → **"Web Service"**
2. Click **"Connect a repository"**
3. Find and select **"taylor834-sketch/Job-Search"**
4. Click **"Connect"**

## Step 3: Configure the Web Service

Fill in the following settings:

### Basic Settings
- **Name**: `job-search-aggregator` (or whatever you prefer)
- **Region**: Choose closest to you (e.g., Oregon USA)
- **Branch**: `main`
- **Root Directory**: Leave blank
- **Environment**: `Node`
- **Build Command**:
  ```bash
  npm install && cd client && npm install && cd .. && npm run build
  ```
- **Start Command**:
  ```bash
  npm start
  ```

### Instance Type
- Select **"Free"** (Free instance - 750 hours/month)

## Step 4: Add Environment Variables

Scroll down to **"Environment Variables"** section and click **"Add Environment Variable"**

Add these variables one by one:

### Required Variables

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Sets production mode |
| `PORT` | `3001` | Server port |
| `EMAIL_SERVICE` | `gmail` | Or your email service |
| `EMAIL_USER` | `your-email@gmail.com` | Your email address |
| `EMAIL_PASSWORD` | `your-app-password` | Your Gmail app password |
| `ADMIN_EMAIL` | `Taylor@realsimplerevops.com` | Admin email (always notified) |

### How to Add Each Variable
1. Click **"Add Environment Variable"**
2. Enter the **Key** name
3. Enter the **Value**
4. Click **"Save"** or continue adding more

## Step 5: Deploy!

1. Scroll to the bottom
2. Click **"Create Web Service"**
3. Render will now:
   - Clone your repository
   - Install dependencies
   - Build the frontend
   - Start your server

This will take 3-5 minutes. Watch the logs to see progress.

## Step 6: Verify Deployment

Once deployment is complete:

1. You'll see **"Live"** status with a green indicator
2. Your app URL will be something like: `https://job-search-aggregator.onrender.com`
3. Click the URL to open your app
4. Test the search functionality!

## Step 7: Test Recurring Searches

1. Search for some jobs
2. Click **"Make Recurring Search"**
3. Set up a daily or weekly search
4. Add your email (optional)
5. Click **"Create Recurring Search"**
6. You should receive a confirmation that it was created
7. The scheduler will automatically run at 9 AM (in server timezone)

## Important Notes

### Free Tier Limitations

- **Spin down after inactivity**: Free services sleep after 15 minutes of inactivity
- **Cold starts**: First request after sleeping takes 30-60 seconds to wake up
- **Cron jobs still work**: Scheduled jobs will wake the service automatically
- **750 hours/month**: More than enough for one service

### Keeping Service Awake (Optional)

If you want to keep the service always active:

1. Use a service like **UptimeRobot** (free): https://uptimerobot.com/
2. Set it to ping your Render URL every 14 minutes
3. This prevents the service from sleeping

Or upgrade to Render's paid tier ($7/month) for always-on services.

### Scheduled Jobs

Your cron jobs are configured to run:
- **Daily searches**: Every day at 9:00 AM
- **Weekly searches**: Every week on chosen day at 9:00 AM
- **Cleanup**: Every day at midnight

The scheduler will automatically wake the service if it's asleep.

## Updating Your Deployment

### Automatic Updates
Render automatically redeploys when you push to GitHub:

```bash
git add .
git commit -m "Your changes"
git push
```

Render will detect the push and redeploy automatically!

### Manual Redeploy
From the Render dashboard:
1. Go to your service
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

## Monitoring Your Service

### View Logs
1. Go to your service in Render dashboard
2. Click **"Logs"** tab
3. See real-time logs of:
   - Search requests
   - Scheduled job runs
   - Email sending
   - Errors (if any)

### Check Health
Your app has a health endpoint: `https://your-app.onrender.com/health`

Returns:
```json
{
  "status": "ok",
  "message": "Job Search Aggregator API is running"
}
```

## Troubleshooting

### Deployment Failed

**Check Build Logs:**
- Look for error messages in the deploy logs
- Common issues:
  - Missing dependencies (run `npm install` locally first)
  - Build errors in frontend
  - Node version mismatch

**Solution:** Fix errors locally, commit, and push again.

### Environment Variables Not Working

- Double-check spelling and values
- Make sure there are no extra spaces
- For `EMAIL_PASSWORD`, use the **app password**, not your regular password
- Click **"Save Changes"** after editing variables

### Service Won't Start

- Check the **Start Command** is: `npm start`
- Verify `server/index.js` exists
- Check logs for specific error messages

### Emails Not Sending

- Verify environment variables are set correctly
- Check that `EMAIL_PASSWORD` is your Gmail app password
- Look at logs for email-related errors
- Test your email credentials locally first

### Scheduled Jobs Not Running

- Check server logs around 9 AM to see if jobs executed
- Verify cron is initialized (should see "Job schedulers initialized" in logs)
- Jobs may take a minute to wake service from sleep
- Check that recurring searches were created successfully

### Service is Slow

- Free tier services sleep after 15 minutes of inactivity
- First request after sleeping takes 30-60 seconds (cold start)
- Subsequent requests are fast
- Use UptimeRobot to keep service awake, or upgrade to paid tier

## Cost

- **Free Tier**: $0/month
  - 750 hours/month
  - 512 MB RAM
  - Sleeps after 15 min inactivity
  - Perfect for this app!

- **Starter Tier**: $7/month (if you want always-on)
  - Always running
  - 512 MB RAM
  - No cold starts

## Security Notes

- ✅ Environment variables are encrypted
- ✅ HTTPS is automatic
- ✅ Never commit your `.env` file
- ✅ Render handles SSL certificates automatically

## Custom Domain (Optional)

Want to use your own domain?

1. Go to service **Settings**
2. Click **"Custom Domain"**
3. Add your domain
4. Follow DNS configuration instructions
5. SSL certificate is automatic!

## Next Steps

1. ✅ Deploy to Render
2. ✅ Test the application
3. ✅ Set up a recurring search
4. ✅ Wait for your first email alert (at 9 AM)
5. 🎉 Enjoy automated job hunting!

## Support

If you run into issues:

1. Check the Render logs first
2. Review this guide's troubleshooting section
3. Check EMAIL_SETUP_GUIDE.md for email issues
4. Open an issue on GitHub with:
   - Error messages from Render logs
   - What you were trying to do
   - Screenshots if helpful

## Your App URLs

After deployment, your URLs will be:

- **Frontend**: `https://job-search-aggregator.onrender.com`
- **API Health**: `https://job-search-aggregator.onrender.com/health`
- **API Endpoint**: `https://job-search-aggregator.onrender.com/api`

(Replace `job-search-aggregator` with whatever name you chose)

---

🚀 **Ready to deploy? Let's go!**

Visit https://render.com/ and follow the steps above!

# Deployment Guide

This guide covers deploying your Job Search Aggregator to various hosting platforms.

## Deployment Options

### Option 1: Vercel (Recommended for Frontend + Serverless)

#### Prerequisites
- Vercel account (free tier available)
- GitHub repository

#### Steps

1. **Build the client**
   ```bash
   cd client
   npm run build
   ```

2. **Create `vercel.json` in root**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server/index.js",
         "use": "@vercel/node"
       },
       {
         "src": "client/package.json",
         "use": "@vercel/static-build",
         "config": { "distDir": "dist" }
       }
     ],
     "routes": [
       { "src": "/api/(.*)", "dest": "server/index.js" },
       { "src": "/(.*)", "dest": "client/dist/$1" }
     ]
   }
   ```

3. **Deploy**
   ```bash
   npm install -g vercel
   vercel
   ```

4. **Add Environment Variables**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add your Google Sheets credentials

### Option 2: Heroku

#### Prerequisites
- Heroku account
- Heroku CLI installed

#### Steps

1. **Create `Procfile`**
   ```
   web: node server/index.js
   ```

2. **Update `package.json` scripts**
   ```json
   "scripts": {
     "start": "node server/index.js",
     "heroku-postbuild": "cd client && npm install && npm run build"
   }
   ```

3. **Serve static files** (Update `server/index.js`)
   ```javascript
   import path from 'path';
   import { fileURLToPath } from 'url';

   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);

   // Serve static files from React app
   app.use(express.static(path.join(__dirname, '../client/dist')));

   app.get('*', (req, res) => {
     res.sendFile(path.join(__dirname, '../client/dist/index.html'));
   });
   ```

4. **Deploy**
   ```bash
   heroku create your-app-name
   git push heroku main
   ```

5. **Set environment variables**
   ```bash
   heroku config:set GOOGLE_SPREADSHEET_ID=your_id
   heroku config:set GOOGLE_CLIENT_EMAIL=your_email
   heroku config:set GOOGLE_PRIVATE_KEY="your_key"
   ```

### Option 3: Railway

#### Steps

1. **Connect GitHub repo** at https://railway.app
2. **Add environment variables** in project settings
3. **Railway will auto-detect and deploy**

### Option 4: Digital Ocean App Platform

#### Steps

1. **Create App** from GitHub repo
2. **Configure build settings**:
   - Build Command: `npm run install-all && npm run build`
   - Run Command: `npm start`
3. **Add environment variables**
4. **Deploy**

### Option 5: AWS EC2 (Full Control)

#### Prerequisites
- AWS account
- EC2 instance running Ubuntu

#### Steps

1. **SSH into your instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-instance-ip
   ```

2. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install Git and clone repo**
   ```bash
   sudo apt-get install git
   git clone https://github.com/yourusername/job-search-aggregator.git
   cd job-search-aggregator
   ```

4. **Install dependencies**
   ```bash
   npm run install-all
   ```

5. **Create `.env` file**
   ```bash
   nano .env
   # Add your environment variables
   ```

6. **Build client**
   ```bash
   npm run build
   ```

7. **Install PM2** (process manager)
   ```bash
   sudo npm install -g pm2
   ```

8. **Start the app**
   ```bash
   pm2 start server/index.js --name job-searcher
   pm2 startup
   pm2 save
   ```

9. **Set up Nginx** (optional, for reverse proxy)
   ```bash
   sudo apt-get install nginx
   sudo nano /etc/nginx/sites-available/default
   ```

   Add:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   sudo systemctl restart nginx
   ```

### Option 6: Docker

#### Create `Dockerfile`

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY client/package*.json ./client/

RUN npm install
RUN cd client && npm install

COPY . .

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

#### Create `docker-compose.yml`

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - GOOGLE_SPREADSHEET_ID=${GOOGLE_SPREADSHEET_ID}
      - GOOGLE_CLIENT_EMAIL=${GOOGLE_CLIENT_EMAIL}
      - GOOGLE_PRIVATE_KEY=${GOOGLE_PRIVATE_KEY}
    restart: unless-stopped
```

#### Deploy with Docker

```bash
docker-compose up -d
```

## Environment Variables

All deployment platforms need these environment variables:

- `PORT` - Server port (usually auto-set by platform)
- `GOOGLE_SPREADSHEET_ID` - Your Google Sheet ID
- `GOOGLE_CLIENT_EMAIL` - Service account email
- `GOOGLE_PRIVATE_KEY` - Service account private key

## Post-Deployment Checklist

- [ ] Verify environment variables are set correctly
- [ ] Test job search functionality
- [ ] Check Google Sheets integration works
- [ ] Monitor server logs for errors
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Configure CORS if needed
- [ ] Set up SSL/HTTPS
- [ ] Configure domain name (if applicable)
- [ ] Set up automated backups

## Performance Optimization

### For Production

1. **Enable compression** in Express:
   ```javascript
   import compression from 'compression';
   app.use(compression());
   ```

2. **Add rate limiting**:
   ```javascript
   import rateLimit from 'express-rate-limit';

   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 100
   });

   app.use('/api/', limiter);
   ```

3. **Cache responses** where appropriate

4. **Use CDN** for static assets

## Monitoring

### Set up logging

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Health checks

Already included at `/health` endpoint.

## Scaling Considerations

- Consider Redis for caching job results
- Use a job queue (Bull, BullMQ) for background scraping
- Implement database for persistent storage (MongoDB, PostgreSQL)
- Set up load balancing for multiple instances
- Use scraping proxies to avoid rate limits

## Security

- Never commit `.env` files
- Use environment variables for all secrets
- Keep dependencies updated
- Implement rate limiting
- Add authentication if needed
- Use HTTPS in production
- Sanitize user inputs
- Implement CORS properly

## Cost Estimates

**Free Tier Options:**
- Vercel: Free for hobby projects
- Heroku: Free tier available (with limitations)
- Railway: $5/month with free trial credits
- Digital Ocean: $5-10/month for basic droplet

**Recommended for Production:**
- Railway or Digital Ocean App Platform: ~$10-20/month
- AWS EC2 t3.micro: ~$10/month
- Include proxy services if needed: ~$10-50/month

## Troubleshooting Deployment

**Build fails:**
- Check Node.js version compatibility
- Verify all dependencies are in package.json
- Check build logs for specific errors

**App crashes:**
- Check environment variables are set
- Review application logs
- Verify Google Sheets credentials
- Check memory/CPU limits

**Scrapers not working:**
- Some platforms block puppeteer/chromium
- Consider using scraping APIs or proxies
- Implement fallback mechanisms

## Need Help?

Open an issue on GitHub with:
- Deployment platform you're using
- Error messages
- Steps you've already tried

Good luck with your deployment!

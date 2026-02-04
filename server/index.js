import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import jobRoutes from './routes/jobRoutes.js';
import { initializeSchedulers } from './utils/scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the project root (one level up from server/) regardless of CWD
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Warn at startup if critical env vars are missing so problems are obvious immediately
if (!process.env.JSEARCH_API_KEY) {
  console.warn('⚠️  JSEARCH_API_KEY is not set — job searches will return 0 results.');
  console.warn('    Create a .env file in the project root with your RapidAPI key.');
}

// Ensure the data directory exists so node-json-db can write its files
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('Created data/ directory');
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/jobs', jobRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Job Search Aggregator API is running' });
});

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initializeSchedulers();
});

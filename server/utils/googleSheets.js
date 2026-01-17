import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

const getAuthClient = () => {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    return auth;
  } catch (error) {
    console.error('Error creating auth client:', error.message);
    throw error;
  }
};

export const saveToGoogleSheets = async (jobs) => {
  try {
    if (!SPREADSHEET_ID) {
      console.error('Google Spreadsheet ID not configured');
      return;
    }

    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const sheetName = 'Job Listings';

    try {
      await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
        ranges: [sheetName]
      });
    } catch (error) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [{
            addSheet: {
              properties: { title: sheetName }
            }
          }]
        }
      });

      const headers = [
        'Date Pulled',
        'Job Title',
        'Company',
        'Company Size',
        'Industry',
        'Location',
        'Salary',
        'Source',
        'Job Link',
        'Description'
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1:J1`,
        valueInputOption: 'RAW',
        resource: {
          values: [headers]
        }
      });
    }

    const values = jobs.map(job => [
      job.datePulled,
      job.title,
      job.company,
      job.companySize,
      job.industry,
      job.location,
      job.salary,
      job.source,
      job.link,
      job.description.substring(0, 500)
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:J`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values
      }
    });

    console.log(`Successfully saved ${jobs.length} jobs to Google Sheets`);

  } catch (error) {
    console.error('Error saving to Google Sheets:', error.message);
    throw error;
  }
};

export const getExistingJobs = async () => {
  try {
    if (!SPREADSHEET_ID) {
      return [];
    }

    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Job Listings!A2:J'
    });

    return response.data.values || [];
  } catch (error) {
    console.error('Error reading from Google Sheets:', error.message);
    return [];
  }
};

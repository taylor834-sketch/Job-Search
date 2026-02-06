import express from 'express';
import {
  searchJobs,
  exportToExcel,
  createRecurringSearch,
  getRecurringSearches,
  deleteRecurringSearch,
  toggleRecurringSearch,
  updateRecurringSearch,
  getApiStatus,
  testEmail,
  runRecurringSearchNow,
  getRunNowStatus,
  getAllRunStatuses
} from '../controllers/jobController.js';

const router = express.Router();

router.post('/search', searchJobs);
router.post('/export', exportToExcel);
router.post('/recurring', createRecurringSearch);
router.get('/recurring', getRecurringSearches);
router.get('/api-status', getApiStatus);
router.post('/test-email', testEmail);
router.post('/recurring/:searchId/run', runRecurringSearchNow);
router.get('/run-status/:statusKey', getRunNowStatus);
router.get('/run-statuses', getAllRunStatuses);
router.patch('/recurring/:searchId/toggle', toggleRecurringSearch);
router.patch('/recurring/:searchId', updateRecurringSearch);
router.delete('/recurring/:searchId', deleteRecurringSearch);

export default router;

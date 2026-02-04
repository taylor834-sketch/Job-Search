import express from 'express';
import {
  searchJobs,
  exportToExcel,
  createRecurringSearch,
  getRecurringSearches,
  deleteRecurringSearch,
  toggleRecurringSearch,
  updateRecurringSearch
} from '../controllers/jobController.js';

const router = express.Router();

router.post('/search', searchJobs);
router.post('/export', exportToExcel);
router.post('/recurring', createRecurringSearch);
router.get('/recurring', getRecurringSearches);
router.patch('/recurring/:searchId/toggle', toggleRecurringSearch);
router.patch('/recurring/:searchId', updateRecurringSearch);
router.delete('/recurring/:searchId', deleteRecurringSearch);

export default router;

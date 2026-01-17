import express from 'express';
import {
  searchJobs,
  exportToExcel,
  createRecurringSearch,
  getRecurringSearches,
  deleteRecurringSearch,
  toggleRecurringSearch
} from '../controllers/jobController.js';

const router = express.Router();

router.post('/search', searchJobs);
router.post('/export', exportToExcel);
router.post('/recurring', createRecurringSearch);
router.get('/recurring', getRecurringSearches);
router.delete('/recurring/:searchId', deleteRecurringSearch);
router.patch('/recurring/:searchId/toggle', toggleRecurringSearch);

export default router;

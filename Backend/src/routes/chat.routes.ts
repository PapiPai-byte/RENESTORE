import { Router } from 'express';
import {
  chatStream,
  getSuggestedFaqs,
  incrementFaqClick,
  getUnansweredLogs,
} from '../controllers/chat.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// Public: suggested FAQs (no auth needed)
router.get('/chat/faqs/suggested', getSuggestedFaqs);

// Public: increment FAQ click count (called when user clicks a suggestion chip)
router.post('/chat/faqs/:id/click', incrementFaqClick);

// Authenticated: stream chat response via SSE
router.post('/chat/stream', authenticate, chatStream);

// Admin-only: list unanswered chat logs
router.get('/chat/logs/unanswered', authenticate, authorize('admin'), getUnansweredLogs);

export default router;

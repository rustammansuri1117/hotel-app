import { Router } from 'express';
import { createBooking, getBooking } from '../controllers/bookingController.js';

const router = Router();

router.post('/', createBooking);          // POST /api/bookings            (book a hotel)
router.get('/:reference', getBooking);    // GET  /api/bookings/:reference (booking confirmation)

export default router;

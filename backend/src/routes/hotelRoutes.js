import { Router } from 'express';
import { uploadImage } from '../middleware/upload.js';
import {
  listHotels,
  listLocations,
  getHotel,
  createHotel,
  updateHotel,
  deleteHotel,
} from '../controllers/hotelController.js';

const router = Router();

router.get('/', listHotels);                   // GET    /api/hotels  (search, filters, pagination)
router.get('/locations', listLocations);       // GET    /api/hotels/locations  (must be before /:id)
router.get('/:id', getHotel);                  // GET    /api/hotels/:id
router.post('/', uploadImage, createHotel);    // POST   /api/hotels
router.put('/:id', uploadImage, updateHotel);  // PUT    /api/hotels/:id
router.delete('/:id', deleteHotel);            // DELETE /api/hotels/:id

export default router;

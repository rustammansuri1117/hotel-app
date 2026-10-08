import crypto from 'node:crypto';
import pool from '../config/db.js';

const COLUMNS = `id, reference, hotel_id, hotel_title, price_per_night, guest_name, email, phone,
                 check_in, check_out, adults, children, rooms, nights, total_price,
                 special_requests, status, created_at`;

const MAX_NIGHTS = 30;
const MAX_GUESTS_PER_ROOM = 4;
const DAY_MS = 24 * 60 * 60 * 1000;

// ---------- small helpers ----------

const pad = (n) => String(n).padStart(2, '0');

// today's date as YYYY-MM-DD (server local time)
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// strict "YYYY-MM-DD" -> Date (UTC midnight), or null if it is not a real calendar date
function parseISODate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const same = date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  return same ? date : null;
}

// e.g. BK261007K4M9Q  (BK + yymmdd + 5 random characters, no confusing 0/O/1/I)
const REF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function makeReference() {
  const d = new Date();
  const stamp = `${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const random = [...crypto.randomBytes(5)].map((b) => REF_CHARS[b % REF_CHARS.length]).join('');
  return `BK${stamp}${random}`;
}

const asInt = (v) => (v !== undefined && v !== null && String(v).trim() !== '' && Number.isInteger(Number(v)) ? Number(v) : NaN);

function validateBooking(body = {}) {
  const errors = [];

  const hotelId = asInt(body.hotelId);
  if (!Number.isInteger(hotelId) || hotelId < 1 || hotelId > 2147483647) errors.push('hotelId is required');

  const guestName = String(body.guestName ?? '').trim();
  if (guestName.length < 2 || guestName.length > 100) errors.push('Full name must be 2 to 100 characters');

  const email = String(body.email ?? '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) errors.push('Enter a valid email address');

  const phone = String(body.phone ?? '').replace(/[\s-]/g, '');
  if (!/^\+?\d{10,15}$/.test(phone)) errors.push('Enter a valid phone number (10 to 15 digits)');

  const checkInDate = parseISODate(body.checkIn);
  const checkOutDate = parseISODate(body.checkOut);
  let nights = 0;
  if (!checkInDate) errors.push('Check-in date is required');
  if (!checkOutDate) errors.push('Check-out date is required');
  if (checkInDate && checkOutDate) {
    if (body.checkIn < todayISO()) errors.push('Check-in date cannot be in the past');
    nights = Math.round((checkOutDate - checkInDate) / DAY_MS);
    if (nights < 1) errors.push('Check-out must be after check-in');
    else if (nights > MAX_NIGHTS) errors.push(`You can book at most ${MAX_NIGHTS} nights at a time`);
  }

  const adults = asInt(body.adults);
  const children = body.children === undefined || body.children === '' ? 0 : asInt(body.children);
  const rooms = asInt(body.rooms);
  if (!(adults >= 1 && adults <= 20)) errors.push('Adults must be between 1 and 20');
  if (!(children >= 0 && children <= 20)) errors.push('Children must be between 0 and 20');
  if (!(rooms >= 1 && rooms <= 10)) errors.push('Rooms must be between 1 and 10');
  if (rooms >= 1 && adults >= 1 && children >= 0) {
    if (rooms > adults) errors.push('Each room needs at least one adult');
    if (adults + children > rooms * MAX_GUESTS_PER_ROOM) {
      errors.push(`A room fits at most ${MAX_GUESTS_PER_ROOM} guests, please add more rooms`);
    }
  }

  const specialRequests = String(body.specialRequests ?? '').trim();
  if (specialRequests.length > 500) errors.push('Special requests must be 500 characters or fewer');

  return {
    errors,
    values: {
      hotelId, guestName, email, phone, adults, children, rooms, nights, specialRequests,
      checkIn: body.checkIn, checkOut: body.checkOut,
    },
  };
}

// ---------- handlers ----------

// POST /api/bookings   (JSON body)
export async function createBooking(req, res, next) {
  try {
    const { errors, values: v } = validateBooking(req.body);
    if (errors.length) return res.status(400).json({ message: errors.join(', '), errors });

    const hotelResult = await pool.query('SELECT id, title, price FROM hotels WHERE id = $1', [v.hotelId]);
    if (!hotelResult.rows.length) return res.status(404).json({ message: 'Hotel not found' });
    const hotel = hotelResult.rows[0];

    // the total is always calculated on the server from the hotel's real price
    const total = Math.round(hotel.price * v.nights * v.rooms * 100) / 100;

    // reference is random; retry in the (very unlikely) case it already exists
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const { rows } = await pool.query(
          `INSERT INTO bookings
             (reference, hotel_id, hotel_title, price_per_night, guest_name, email, phone,
              check_in, check_out, adults, children, rooms, nights, total_price, special_requests)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           RETURNING ${COLUMNS}`,
          [
            makeReference(), hotel.id, hotel.title, hotel.price, v.guestName, v.email, v.phone,
            v.checkIn, v.checkOut, v.adults, v.children, v.rooms, v.nights, total,
            v.specialRequests || null,
          ]
        );
        return res.status(201).json({ message: 'Booking confirmed', data: rows[0] });
      } catch (err) {
        if (err.code !== '23505') throw err; // only retry on duplicate reference
      }
    }
    throw new Error('Could not generate a unique booking reference');
  } catch (err) {
    next(err);
  }
}

// GET /api/bookings/:reference
export async function getBooking(req, res, next) {
  try {
    const reference = String(req.params.reference).toUpperCase();
    if (!/^BK[A-Z0-9]{6,18}$/.test(reference)) {
      return res.status(400).json({ message: 'Invalid booking reference' });
    }

    const { rows } = await pool.query(`SELECT ${COLUMNS} FROM bookings WHERE reference = $1`, [reference]);
    if (!rows.length) return res.status(404).json({ message: 'Booking not found' });

    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
}

import pool from '../config/db.js';
import { toImagePath, removeImageFile, discardUploadedFile } from '../middleware/upload.js';

// image_path is exposed to the frontend as "image"
const COLUMNS = `id, title, description, price, latitude, longitude, location,
                 image_path AS image, created_at, updated_at`;

// Whitelist: user input is never interpolated into ORDER BY.
const SORTS = {
  newest: 'created_at DESC, id DESC',
  oldest: 'created_at ASC, id ASC',
  price_asc: 'price ASC, id ASC',
  price_desc: 'price DESC, id DESC',
  name: 'title ASC, id ASC',
};

const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';

function parseId(raw) {
  return /^\d+$/.test(raw) && Number(raw) <= 2147483647 ? Number(raw) : null;
}

function parsePositiveInt(raw, fallback, max) {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}

/**
 * Validate a create/update body.
 *  - requireAll: true for POST (title + price mandatory)
 *  - false for PUT (only the fields that were sent are updated)
 * Accepts `hotelName` as an alias of `title`.
 */
function validateHotel(body = {}, { requireAll }) {
  const errors = [];
  const values = {};

  const title = body.title ?? body.hotelName;
  if (title !== undefined) {
    const t = String(title).trim();
    if (!t) errors.push('title is required');
    else if (t.length > 150) errors.push('title must be 150 characters or fewer');
    else values.title = t;
  } else if (requireAll) {
    errors.push('title is required');
  }

  if (body.description !== undefined) values.description = String(body.description).trim();

  if (body.price !== undefined && !isBlank(body.price)) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0 || price > 99999999) {
      errors.push('price must be a non-negative number');
    } else values.price = price;
  } else if (requireAll || body.price !== undefined) {
    errors.push('price is required');
  }

  for (const [field, limit] of [['latitude', 90], ['longitude', 180]]) {
    if (body[field] === undefined) continue;
    if (isBlank(body[field])) {
      values[field] = null;
      continue;
    }
    const n = Number(body[field]);
    if (!Number.isFinite(n) || Math.abs(n) > limit) {
      errors.push(`${field} must be a number between -${limit} and ${limit}`);
    } else values[field] = n;
  }

  if (body.location !== undefined) {
    const loc = String(body.location).trim();
    if (loc.length > 100) errors.push('location must be 100 characters or fewer');
    else values.location = loc || null;
  }

  return { errors, values };
}

// GET /api/hotels?search=&location=&minPrice=&maxPrice=&sort=&page=&limit=
export async function listHotels(req, res, next) {
  try {
    const { search, location, minPrice, maxPrice, sort } = req.query;
    const page = parsePositiveInt(req.query.page, 1, 1_000_000);
    const limit = parsePositiveInt(req.query.limit, 10, 50);

    const conditions = [];
    const params = [];
    const bind = (value) => {
      params.push(value);
      return `$${params.length}`;
    };

    if (!isBlank(search)) {
      // escape LIKE wildcards so "50%" or "a_b" are matched literally
      const p = bind(`%${String(search).trim().replace(/[\\%_]/g, '\\$&')}%`);
      conditions.push(`(title ILIKE ${p} OR description ILIKE ${p} OR location ILIKE ${p})`);
    }

    if (!isBlank(location)) {
      conditions.push(`LOWER(location) = LOWER(${bind(String(location).trim())})`);
    }

    for (const [name, raw, op] of [['minPrice', minPrice, '>='], ['maxPrice', maxPrice, '<=']]) {
      if (isBlank(raw)) continue;
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0) {
        return res.status(400).json({ message: `${name} must be a non-negative number` });
      }
      conditions.push(`price ${op} ${bind(n)}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = SORTS[sort] || SORTS.newest;

    const countParams = [...params];
    const limitPlaceholder = bind(limit);
    const offsetPlaceholder = bind((page - 1) * limit);

    const countSql = `SELECT COUNT(*)::int AS total FROM hotels ${where}`;
    const dataSql = `
      SELECT ${COLUMNS}
      FROM hotels
      ${where}
      ORDER BY ${orderBy}
      LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`;

    const [{ rows: countRows }, { rows }] = await Promise.all([
      pool.query(countSql, countParams),
      pool.query(dataSql, params),
    ]);

    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      data: rows,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/hotels/locations  -> { data: ["Bengaluru", "Delhi", ...] } (feeds the search dropdown)
export async function listLocations(_req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT location FROM hotels
       WHERE location IS NOT NULL AND location <> ''
       ORDER BY location`
    );
    res.json({ data: rows.map((r) => r.location) });
  } catch (err) {
    next(err);
  }
}

// GET /api/hotels/:id
export async function getHotel(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid hotel id' });

    const { rows } = await pool.query(`SELECT ${COLUMNS} FROM hotels WHERE id = $1`, [id]);
    if (!rows.length) return res.status(404).json({ message: 'Hotel not found' });

    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
}

// POST /api/hotels   (multipart/form-data, optional file field "image")
export async function createHotel(req, res, next) {
  try {
    const { errors, values } = validateHotel(req.body, { requireAll: true });
    if (errors.length) {
      await discardUploadedFile(req.file);
      return res.status(400).json({ message: errors.join(', '), errors });
    }

    const { rows } = await pool.query(
      `INSERT INTO hotels (title, description, price, latitude, longitude, location, image_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${COLUMNS}`,
      [
        values.title,
        values.description ?? '',
        values.price,
        values.latitude ?? null,
        values.longitude ?? null,
        values.location ?? null,
        req.file ? toImagePath(req.file.filename) : null,
      ]
    );

    res.status(201).json({ message: 'Hotel added successfully', data: rows[0] });
  } catch (err) {
    await discardUploadedFile(req.file);
    next(err);
  }
}

// PUT /api/hotels/:id   (only the fields that are sent are changed; a new "image" replaces the old one)
export async function updateHotel(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      await discardUploadedFile(req.file);
      return res.status(400).json({ message: 'Invalid hotel id' });
    }

    const { errors, values } = validateHotel(req.body, { requireAll: false });
    if (req.file) values.image_path = toImagePath(req.file.filename);

    if (!errors.length && Object.keys(values).length === 0) {
      errors.push('No fields to update');
    }
    if (errors.length) {
      await discardUploadedFile(req.file);
      return res.status(400).json({ message: errors.join(', '), errors });
    }

    const existing = await pool.query('SELECT image_path FROM hotels WHERE id = $1', [id]);
    if (!existing.rows.length) {
      await discardUploadedFile(req.file);
      return res.status(404).json({ message: 'Hotel not found' });
    }
    const oldImage = existing.rows[0].image_path;

    // Column names come from validateHotel's fixed keys, never from user input.
    const sets = [];
    const params = [];
    for (const [column, value] of Object.entries(values)) {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    }
    params.push(id);

    const { rows } = await pool.query(
      `UPDATE hotels
       SET ${sets.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length}
       RETURNING ${COLUMNS}`,
      params
    );

    if (req.file && oldImage) await removeImageFile(oldImage);

    res.json({ message: 'Hotel updated successfully', data: rows[0] });
  } catch (err) {
    await discardUploadedFile(req.file);
    next(err);
  }
}

// DELETE /api/hotels/:id
export async function deleteHotel(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid hotel id' });

    const { rows } = await pool.query(
      'DELETE FROM hotels WHERE id = $1 RETURNING id, title, image_path',
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Hotel not found' });

    await removeImageFile(rows[0].image_path);

    res.json({ message: `${rows[0].title} deleted successfully`, data: { id: rows[0].id } });
  } catch (err) {
    next(err);
  }
}

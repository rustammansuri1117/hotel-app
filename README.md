# Hotel App: React + Express + PostgreSQL

```
frontend/   React (Vite) app: your original UI, now connected to the API
backend/    Express REST API, PostgreSQL via native SQL (pg), images saved on disk
```

## 1. Requirements
- Node.js 20.11 or newer
- PostgreSQL running locally

## 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env        # then edit DB_PASSWORD (and other values) for your PostgreSQL
```
Create the database once (either way):
```bash
createdb hotel_db
# or:  psql -U postgres -c "CREATE DATABASE hotel_db;"
```
Create the table and (optionally) load the 8 sample hotels:
```bash
npm run db:init
npm run db:seed      # optional
npm run dev          # API on http://localhost:5000
```

## 3. Frontend setup
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```
Vite proxies `/api` and `/uploads` to `http://localhost:5000`, so no extra config is needed in development.
For a production build, copy `.env.example` to `.env` and set `VITE_API_URL` to your backend URL.

## 4. REST API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST   | `/api/hotels` | Add a hotel (multipart/form-data, optional `image` file) |
| GET    | `/api/hotels` | Fetch hotels with search, filters and pagination |
| GET    | `/api/hotels/:id` | Fetch one hotel |
| PUT    | `/api/hotels/:id` | Update a hotel (send only the fields to change; a new `image` replaces the old one) |
| DELETE | `/api/hotels/:id` | Delete a hotel (and its image file) |
| GET    | `/api/hotels/locations` | Distinct locations (fills the location dropdown) |

### Fields
`title` (required, `hotelName` also accepted), `price` (required), `description`, `latitude`, `longitude`, `location`, `image` (file: jpeg/png/webp/gif, max 5 MB).

### GET /api/hotels query params
| Param | Example | Meaning |
|-------|---------|---------|
| `search` | `sea` | Matches title, description or location (case-insensitive) |
| `location` | `Chennai` | Exact location (case-insensitive) |
| `minPrice` / `maxPrice` | `2000` / `4000` | Price range per night |
| `sort` | `newest` (default), `oldest`, `price_asc`, `price_desc`, `name` | Ordering |
| `page` / `limit` | `2` / `4` | Pagination (limit max 50, default 10) |

Response:
```json
{
  "data": [{ "id": 1, "title": "Hotel 1", "description": "...", "price": 2500,
             "latitude": 28.6139, "longitude": 77.209, "location": "Delhi",
             "image": "/uploads/1727999999999-uuid.jpg",
             "created_at": "...", "updated_at": "..." }],
  "pagination": { "page": 1, "limit": 4, "total": 8, "totalPages": 2, "hasNext": true, "hasPrev": false }
}
```

### Images
Uploaded files are written to `backend/uploads/` with a random name. Only the path (`/uploads/<file>`) is stored in the `image_path` column, and files are served at `GET /uploads/<file>`. Replacing or deleting a hotel removes its old image file.

### Example
```bash
curl -X POST http://localhost:5000/api/hotels \
  -F title="Sea View" -F price=5100 -F location=Chennai \
  -F latitude=13.08 -F longitude=80.27 -F image=@photo.jpg

curl "http://localhost:5000/api/hotels?search=sea&maxPrice=6000&page=1&limit=4"
```

## 5. What changed in the frontend
- `src/api/hotels.js`, `src/hooks/useHotels.js`: API client and data-loading hook (new)
- **Home**: hotels, search and pagination now come from the server. The Hero filters (name, location, max price) and the navbar search (press Enter) update the URL (`/?search=...`)
- **Add Hotel**: sends `FormData` (with the image) to `POST /api/hotels`; new optional **Location** field
- **Update Hotel / Delete Hotel**: list from the API, save via `PUT`, remove via `DELETE`
- `vite.config.js`: dev proxy to the backend
- Fixed the import `./Component/FormPage/Form` to `./Component/Formpage/Form` to match the real folder name (the old path fails on Linux/macOS)

## Booking ("Book Now")

Click **Book Now** on a hotel card to open `/book/:id`.

1. Guest details: full name, email, phone.
2. Stay details: check-in, check-out, adults, children, rooms, special requests.
3. A live price summary shows nights x rooms x price per night.
4. **Confirm Booking** saves the booking in PostgreSQL and opens `/booking/<REFERENCE>` (for example `BK261007K4M9Q`) with all details and a Print button.

Rules checked by the backend: valid email and phone, check-in not in the past, check-out after check-in (max 30 nights), at least one adult per room, max 4 guests per room. The total price is always calculated on the server from the hotel's real price.
No payment gateway: the guest pays at the hotel.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/bookings` | Create a booking (JSON body) |
| GET | `/api/bookings/:reference` | Get one booking (confirmation page) |

The `bookings` table is in `backend/sql/schema.sql`. **Run `npm run db:init` once more** to create it (existing hotels are not touched).

## Redux

Redux Toolkit holds the hotel list, the selected hotel and the booking.

| File | Purpose |
|------|---------|
| `frontend/src/store/store.js` | Creates the store (`state.hotels`, `state.bookings`) |
| `frontend/src/store/hotelsSlice.js` | `loadHotels`, `loadHotel`, `addHotel`, `editHotel`, `removeHotel` |
| `frontend/src/store/bookingsSlice.js` | `createBooking`, `loadBooking` |
| `frontend/src/hooks/useHotels.js` | Loads the hotel list into the store |

## React Helmet (page titles and meta tags)

`react-helmet-async` (the maintained version of React Helmet) sets the browser tab title and meta description on every page. `HelmetProvider` is in `main.jsx`, and each page has a `<Helmet>` block (Home, Book, Confirmation, Add, Update, Delete, 404).

After pulling these changes run `npm install` in `frontend/` (adds `@reduxjs/toolkit`, `react-redux`, `react-helmet-async`).

---

## 🚀 Deployment Guide: Supabase + Render

### 1. Supabase Setup (PostgreSQL)

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and go to your project.
2. In the left navigation, click on **SQL Editor** -> **New query**.
3. Paste the contents of `backend/sql/schema.sql` into the editor and click **Run**. This creates the `hotels` and `bookings` tables with all necessary indexes.
4. *(Optional)* To insert sample hotels, paste `backend/sql/seed.sql` and click **Run**.
5. Retrieve your Connection String:
   - Go to **Project Settings** (gear icon) ➔ **Database** ➔ **Connection string**.
   - Note: If your password contains special characters like `?`, encode them (for example `?` becomes `%3F`).
   - If deploying on Render (IPv4), use the **Connection Pooler** URI (Session mode on port 5432 or Transaction mode on port 6543) if direct connection experiences timeouts.

---

### 2. Deploy on Render (render.com)

You can choose either of two deployment methods:

#### Method A: Combined Full-Stack Web Service (Easiest & Single Free Dyno)
1. Push this repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** ➔ **Web Service**.
3. Connect your GitHub repository.
4. Configure the service:
   - **Name**: `hotel-app`
   - **Environment**: `Node`
   - **Root Directory**: *(leave blank / project root)*
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `DATABASE_URL`: `postgresql://postgres:CB2af..iVB%3FJFdH@db.byzsavsmfvsrmgduyxms.supabase.co:5432/postgres` (or your Pooler URI)
   - `CORS_ORIGIN`: `*`
6. Click **Deploy Web Service**.

#### Method B: Microservices (Render Blueprint via `render.yaml`)
1. In Render, select **New +** ➔ **Blueprint**.
2. Connect your repo (Render will automatically read [render.yaml](render.yaml) to configure `hotel-backend` and `hotel-frontend`).
3. Set the `DATABASE_URL` environment variable for the backend and `VITE_API_URL` (backend URL) for the frontend.



-- Run with:  npm run db:init   (or: psql -d hotel_db -f sql/schema.sql)

CREATE TABLE IF NOT EXISTS hotels (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(150)  NOT NULL,
    description TEXT          NOT NULL DEFAULT '',
    price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    latitude    NUMERIC(9,6)  CHECK (latitude  BETWEEN -90  AND 90),
    longitude   NUMERIC(9,6)  CHECK (longitude BETWEEN -180 AND 180),
    location    VARCHAR(100),
    image_path  VARCHAR(255),              -- e.g. /uploads/1727999999999-uuid.jpg
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotels_price      ON hotels (price);
CREATE INDEX IF NOT EXISTS idx_hotels_location   ON hotels (LOWER(location));
CREATE INDEX IF NOT EXISTS idx_hotels_created_at ON hotels (created_at DESC);

-- ---------------------------------------------------------------
-- Bookings (run `npm run db:init` again to create this table)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
    id               SERIAL PRIMARY KEY,
    reference        VARCHAR(20)   NOT NULL UNIQUE,          -- e.g. BK261007K4M9Q
    hotel_id         INTEGER       REFERENCES hotels(id) ON DELETE SET NULL,
    hotel_title      VARCHAR(150)  NOT NULL,                 -- snapshot, stays if hotel is deleted
    price_per_night  NUMERIC(10,2) NOT NULL,                 -- snapshot of the price at booking time
    guest_name       VARCHAR(100)  NOT NULL,
    email            VARCHAR(150)  NOT NULL,
    phone            VARCHAR(20)   NOT NULL,
    check_in         DATE          NOT NULL,
    check_out        DATE          NOT NULL,
    adults           INTEGER       NOT NULL CHECK (adults   BETWEEN 1 AND 20),
    children         INTEGER       NOT NULL DEFAULT 0 CHECK (children BETWEEN 0 AND 20),
    rooms            INTEGER       NOT NULL CHECK (rooms    BETWEEN 1 AND 10),
    nights           INTEGER       NOT NULL CHECK (nights >= 1),
    total_price      NUMERIC(12,2) NOT NULL CHECK (total_price >= 0),
    special_requests TEXT,
    status           VARCHAR(20)   NOT NULL DEFAULT 'confirmed',
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CHECK (check_out > check_in)
);

CREATE INDEX IF NOT EXISTS idx_bookings_hotel_id ON bookings (hotel_id);
CREATE INDEX IF NOT EXISTS idx_bookings_email    ON bookings (LOWER(email));

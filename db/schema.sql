-- Drop existing tables
DROP TABLE IF EXISTS additional_pets CASCADE;
DROP TABLE IF EXISTS health_records CASCADE;
DROP TABLE IF EXISTS emergency_contacts CASCADE;
DROP TABLE IF EXISTS booking_addons CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS service_addons CASCADE;
DROP TABLE IF EXISTS pets CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table with role column
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  street_address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  role VARCHAR(50) DEFAULT 'user',
  reset_token VARCHAR(255),
  reset_token_expiry TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pets table
CREATE TABLE pets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  species VARCHAR(50),
  breed VARCHAR(100),
  age DECIMAL(4,2),
  weight DECIMAL(6,2),
  vaccinated BOOLEAN DEFAULT FALSE,
  is_primary BOOLEAN DEFAULT TRUE,  -- ✅ ADD THIS LINE
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services table
CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service Add-ons table
CREATE TABLE service_addons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES services(id),
  booking_date DATE NOT NULL,
  booking_time TIME,
  special_notes TEXT,
  subtotal DECIMAL(10,2),
  tax DECIMAL(10,2),
  total DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'unpaid',
  payment_date TIMESTAMP,
  payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Booking add-ons table
CREATE TABLE booking_addons (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  addon_id INTEGER,
  price_at_purchase DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Emergency Contacts table
CREATE TABLE emergency_contacts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  relationship VARCHAR(50),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Health Records table
CREATE TABLE health_records (
  id SERIAL PRIMARY KEY,
  pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  vet_name VARCHAR(100),
  vet_phone VARCHAR(20),
  vet_clinic VARCHAR(100),
  allergies TEXT,
  medications TEXT,
  medical_conditions TEXT,
  special_care_instructions TEXT,
  last_checkup_date DATE,
  next_checkup_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_pets_user_id ON pets(user_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_pet_id ON bookings(pet_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX idx_health_records_pet_id ON health_records(pet_id);

-- Payment Table
-- Payment table to store each charge / attempt
CREATE TABLE IF NOT EXISTS payment (
  id                  BIGSERIAL PRIMARY KEY,
  booking_id          BIGINT,

  provider            VARCHAR(50) NOT NULL,

  subtotal_cents      INTEGER NOT NULL,
  tax_cents           INTEGER NOT NULL,
  total_cents         INTEGER NOT NULL,
  currency            CHAR(3) NOT NULL DEFAULT 'USD',

  card_brand          VARCHAR(30),
  card_last4          VARCHAR(4),
  external_id         VARCHAR(255),
  status              VARCHAR(30) NOT NULL DEFAULT 'pending',

  customer_name       VARCHAR(255) NOT NULL,
  customer_email      VARCHAR(255) NOT NULL,
  customer_phone      VARCHAR(50),

  billing_first_name  VARCHAR(100) NOT NULL,
  billing_last_name   VARCHAR(100) NOT NULL,
  billing_line1       VARCHAR(255) NOT NULL,
  billing_line2       VARCHAR(255),
  billing_city        VARCHAR(100) NOT NULL,
  billing_state       VARCHAR(50) NOT NULL,
  billing_postal_code VARCHAR(20) NOT NULL,
  billing_country     VARCHAR(2) NOT NULL DEFAULT 'US',

  raw_request         JSONB,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
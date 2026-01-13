// routes/bookings.js
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const bcrypt = require('bcrypt');

/**
 * POST /api/bookings
 * Public endpoint used by the site to create a booking.
 *
 * Flow:
 *  - Validate service_id and addon IDs
 *  - Find or create user by owner_email
 *  - Find or create pet for that user
 *  - Insert booking row (NO "addons" column; uses booking_addons table)
 *  - Insert booking_addons rows (if any addons are provided)
 *  - Create a session for the user (so they can see their bookings)
 */
router.post('/', async (req, res) => {
  try {
    const {
      service_id,
      service_name, // not stored, just accepted
      booking_date,
      booking_time,
      special_notes,
      subtotal,
      tax,
      total,
      addons, // [{ id, price, ...}]

      // Owner
      owner_name,
      owner_email,
      owner_phone,
      zip_code,

      // Pet details
      pet_name,
      pet_species,
      pet_breed,
      pet_age,
      pet_weight,
      pet_vaccinated
    } = req.body;

    // Basic validation
    if (!owner_email || !pet_name || !service_id || !booking_date || !booking_time) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields: owner_email, pet_name, service_id, booking_date, booking_time'
      });
    }

    // 1) Make sure the service exists
    const svcResult = await pool.query(
      'SELECT id FROM services WHERE id = $1',
      [service_id]
    );
    if (svcResult.rows.length === 0) {
      return res.status(400).json({ ok: false, error: 'Invalid service ID' });
    }

    // 2) If addons are provided, validate addon IDs
    if (Array.isArray(addons) && addons.length > 0) {
      const addonIds = addons.map(a => a.id).filter(Boolean);
      if (addonIds.length > 0) {
        const addonCheck = await pool.query(
          'SELECT id FROM service_addons WHERE id = ANY($1)',
          [addonIds]
        );
        if (addonCheck.rows.length !== addonIds.length) {
          return res.status(400).json({ ok: false, error: 'Invalid addon ID detected' });
        }
      }
    }

    // Start DB transaction
    await pool.query('BEGIN');

    try {
      let user_id;
      let pet_id;

      // 3) Find or create the user by email
      const userLookup = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [owner_email]
      );

      if (userLookup.rows.length > 0) {
        user_id = userLookup.rows[0].id;
      } else {
        // Create new user with a random temporary password
        const tempPassword = Math.random().toString(36).slice(-12);
        const hash = await bcrypt.hash(tempPassword, 10);

        const newUser = await pool.query(
          `INSERT INTO users (email, password_hash, first_name, phone, zip_code, role)
           VALUES ($1, $2, $3, $4, $5, 'customer')
           RETURNING id`,
          [owner_email, hash, owner_name || null, owner_phone || null, zip_code || null]
        );
        user_id = newUser.rows[0].id;
        console.log('✅ User created for booking:', owner_email, '(ID:', user_id, ')');
      }

      // 4) Find or create the pet for that user
      const petLookup = await pool.query(
        'SELECT id FROM pets WHERE user_id = $1 AND name = $2',
        [user_id, pet_name]
      );

      if (petLookup.rows.length > 0) {
        pet_id = petLookup.rows[0].id;
      } else {
        const newPet = await pool.query(
          `INSERT INTO pets (user_id, name, species, breed, age, weight, vaccinated)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [
            user_id,
            pet_name,
            pet_species || null,
            pet_breed || null,
            pet_age || null,
            pet_weight || null,
            pet_vaccinated
          ]
        );
        pet_id = newPet.rows[0].id;
        console.log('✅ Pet created for booking:', pet_name, '(ID:', pet_id, ')');
      }

      // 5) Insert booking (NO "addons" column — just subtotal/tax/total)
      const bookingInsert = await pool.query(
        `INSERT INTO bookings (
           user_id,
           pet_id,
           service_id,
           booking_date,
           booking_time,
           special_notes,
           subtotal,
           tax,
           total,
           status,
           payment_status
         )
         VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,'pending','unpaid'
         )
         RETURNING *;`,
        [
          user_id,
          pet_id,
          service_id,
          booking_date,
          booking_time,
          special_notes || null,
          subtotal || 0,
          tax || 0,
          total || 0
        ]
      );

      const booking = bookingInsert.rows[0];

      // 6) Insert booking_addons rows if any
      if (Array.isArray(addons) && addons.length > 0) {
        for (const addon of addons) {
          if (!addon.id) continue;
          await pool.query(
            `INSERT INTO booking_addons (booking_id, addon_id, price_at_purchase)
             VALUES ($1, $2, $3);`,
            [booking.id, addon.id, addon.price || 0]
          );
        }
      }

      // Commit transaction
      await pool.query('COMMIT');

      // 7) Populate session so the user can later view bookings in /account.html
      req.session.userId = user_id;
      req.session.userEmail = owner_email;
      req.session.userName = owner_name || owner_email;
      req.session.userRole = 'customer';

      console.log('✅ Booking created:', booking.id, 'for', owner_email);

      return res.status(201).json({
        ok: true,
        message: '✅ Booking confirmed!',
        booking
      });
    } catch (txErr) {
      await pool.query('ROLLBACK');
      throw txErr;
    }
  } catch (err) {
    console.error('❌ Booking error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Internal server error'
    });
  }
});

/**
 * GET /api/bookings
 * Optional query params:
 *   ?user_id=...
 *   ?status=pending|approved|denied|cancelled
 *   ?date_from=YYYY-MM-DD
 *   ?date_to=YYYY-MM-DD
 */
router.get('/', async (req, res) => {
  try {
    const { user_id, status, date_from, date_to } = req.query;
    let sql = 'SELECT * FROM bookings WHERE 1=1';
    const params = [];

    if (user_id) {
      params.push(user_id);
      sql += ` AND user_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }
    if (date_from) {
      params.push(date_from);
      sql += ` AND booking_date >= $${params.length}`;
    }
    if (date_to) {
      params.push(date_to);
      sql += ` AND booking_date <= $${params.length}`;
    }

    sql += ' ORDER BY booking_date DESC, booking_time DESC LIMIT 100';

    const result = await pool.query(sql, params);
    return res.json({ ok: true, count: result.rows.length, bookings: result.rows });
  } catch (err) {
    console.error('GET /api/bookings error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/bookings/:id
 * Includes service, pet, and user email.
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
         b.*,
         s.name AS service_name,
         p.name AS pet_name,
         u.email AS user_email
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       JOIN pets p     ON b.pet_id = p.id
       JOIN users u    ON b.user_id = u.id
       WHERE b.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Booking not found' });
    }

    return res.json({ ok: true, booking: result.rows[0] });
  } catch (err) {
    console.error('GET /api/bookings/:id error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * PUT /api/bookings/:id
 * Body: { status: 'approved' | 'denied' | 'cancelled' | 'pending' }
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ ok: false, error: 'Status required' });
    }

    const result = await pool.query(
      `UPDATE bookings
       SET status = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Booking not found' });
    }

    return res.json({ ok: true, booking: result.rows[0] });
  } catch (err) {
    console.error('PUT /api/bookings/:id error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
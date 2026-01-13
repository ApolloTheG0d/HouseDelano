var express = require('express');
var router = express.Router();
var pool = require('../db/pool');

// Middleware to check if user is logged in
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  next();
}

/* GET user profile */
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, phone, street_address, city, state, zip_code, role FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    res.json({ ok: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* PUT update profile */
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { firstName, lastName, phone, streetAddress, city, state, zipCode } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, phone = $3, street_address = $4, 
           city = $5, state = $6, zip_code = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *;`,
      [firstName, lastName, phone, streetAddress, city, state, zipCode, req.session.userId]
    );

    res.json({ ok: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* GET user's pets */
router.get('/pets', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM pets WHERE user_id = $1 ORDER BY is_primary DESC, created_at ASC',
      [req.session.userId]
    );

    res.json({ ok: true, pets: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* POST add new pet */
router.post('/pets', requireAuth, async (req, res) => {
  try {
    // accept both petName (old) and name (new from make-appointment page)
    const { petName, name, species, breed, age, weight, vaccinated } = req.body;
    const finalName = petName || name;

    if (!finalName) {
      return res.status(400).json({ ok: false, error: 'Pet name is required' });
    }

    const result = await pool.query(
      `INSERT INTO pets (user_id, name, species, breed, age, weight, vaccinated, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
       RETURNING *;`,
      [
        req.session.userId,
        finalName,
        species || null,
        breed || null,
        age || null,
        weight || null,
        // frontend sends "yes"/"no" or true/false
        vaccinated === 'yes' || vaccinated === true
      ]
    );

    res.json({ ok: true, pet: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* PUT update pet */
router.put('/pets/:id', requireAuth, async (req, res) => {
  try {
    const { name, petName, species, breed, age, weight, vaccinated } = req.body;
    const { id } = req.params;
    const userId = req.session.userId;
    
    // Accept both 'name' and 'petName' for flexibility
    const petNameValue = name || petName;

    // Check if pet belongs to user
    const petResult = await pool.query(
      'SELECT * FROM pets WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (petResult.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Pet not found or does not belong to you' });
    }

    const result = await pool.query(
      `UPDATE pets 
       SET name = $1, species = $2, breed = $3, age = $4, weight = $5, vaccinated = $6
       WHERE id = $7 AND user_id = $8
       RETURNING *;`,
      [
        petNameValue,
        species || null,
        breed || null,
        age || null,
        weight || null,
        vaccinated === 'yes' || vaccinated === true,
        id,
        userId
      ]
    );

    res.json({ ok: true, pet: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* DELETE pet */
router.delete('/pets/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;

    // Check if pet belongs to user
    const petResult = await pool.query(
      'SELECT * FROM pets WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (petResult.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Pet not found or does not belong to you' });
    }

    await pool.query(
      'DELETE FROM pets WHERE id = $1',
      [id]
    );

    res.json({ ok: true, message: 'Pet deleted successfully' });
  } catch (err) {
    console.error('❌ Delete pet error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* GET emergency contacts */
router.get('/emergency-contacts', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM emergency_contacts WHERE user_id = $1 ORDER BY is_primary DESC, created_at ASC',
      [req.session.userId]
    );

    res.json({ ok: true, contacts: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* POST add emergency contact */
router.post('/emergency-contacts', requireAuth, async (req, res) => {
  try {
    const { name, phone, email, relationship } = req.body;

    const result = await pool.query(
      `INSERT INTO emergency_contacts (user_id, name, phone, email, relationship, is_primary)
       VALUES ($1, $2, $3, $4, $5, FALSE)
       RETURNING *;`,
      [req.session.userId, name, phone, email, relationship]
    );

    res.json({ ok: true, contact: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ✅ CREATE BOOKING for the logged-in user
   POST /api/user/bookings
   used by appointmentForbooking.html script */
router.post('/bookings', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;

    const {
      service_id,
      pet_id,
      booking_date,
      booking_time,
      subtotal,
      tax,
      total,
      addons,   // [{ id, label, price }, ...]
      notes
    } = req.body;

    if (!service_id || !pet_id || !booking_date || !booking_time) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields: service_id, pet_id, booking_date, booking_time'
      });
    }

    // 1) insert into bookings (no "addons" column here)
    const insertBookingSql = `
      INSERT INTO bookings (
        user_id,
        pet_id,
        service_id,
        booking_date,
        booking_time,
        status,
        payment_status,
        subtotal,
        tax,
        total,
        special_notes
      ) VALUES (
        $1, $2, $3, $4, $5,
        'pending',
        'unpaid',
        $6, $7, $8,
        $9
      )
      RETURNING *;
    `;

    const bookingValues = [
      userId,
      pet_id,
      service_id,
      booking_date,
      booking_time,
      subtotal || 0,
      tax || 0,
      total || 0,
      notes || null
    ];

    const bookingResult = await pool.query(insertBookingSql, bookingValues);
    const booking = bookingResult.rows[0];

    // 2) store add-ons in booking_addons table (if provided)
    if (Array.isArray(addons) && addons.length > 0) {
      const insertAddonSql = `
        INSERT INTO booking_addons (booking_id, addon_id, price_at_purchase)
        VALUES ($1, $2, $3)
      `;
      for (const addon of addons) {
        if (!addon.id) continue;
        await pool.query(insertAddonSql, [
          booking.id,
          addon.id,
          addon.price || 0
        ]);
      }
    }

    return res.json({ ok: true, booking });
  } catch (err) {
    console.error('CREATE BOOKING ERROR:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Internal server error'
    });
  }
});

/* GET user's bookings */
router.get('/bookings', requireAuth, async (req, res) => {
  try {
    // Get bookings with service and pet details
    const bookingsResult = await pool.query(
      `SELECT 
          b.*, 
          s.name       AS service_name, 
          s.base_price AS service_price, 
          p.name       AS pet_name
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       JOIN pets     p ON b.pet_id   = p.id
       WHERE b.user_id = $1
       -- 👉 newest first: date, then time, then id
       ORDER BY b.booking_date DESC, b.booking_time DESC, b.id DESC;`,
      [req.session.userId]
    );

    const bookings = bookingsResult.rows;

    // For each booking, get the add-ons
    for (let booking of bookings) {
      const addonsResult = await pool.query(
        `SELECT 
            sa.id, 
            sa.name, 
            ba.price_at_purchase
         FROM booking_addons ba
         JOIN service_addons sa ON ba.addon_id = sa.id
         WHERE ba.booking_id = $1;`,
        [booking.id]
      );
      booking.addons = addonsResult.rows;
    }

    res.json({ ok: true, bookings });
  } catch (err) {
    console.error('❌ Error loading user bookings:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* CANCEL user's booking (mark as cancelled instead of deleting) */
router.delete('/bookings/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;

    // Check if booking exists and belongs to user
    const bookingResult = await pool.query(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Booking not found or does not belong to you'
      });
    }

    const booking = bookingResult.rows[0];

    // Only allow cancel of pending / approved
    if (booking.status !== 'pending' && booking.status !== 'approved') {
      return res.status(400).json({
        ok: false,
        error: `Cannot cancel ${booking.status} bookings. Only pending and approved bookings can be cancelled.`
      });
    }

    // 🔹 Mark as cancelled instead of deleting
    const updateResult = await pool.query(
      `UPDATE bookings
       SET status = 'cancelled',
           updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *;`,
      [id, userId]
    );

    console.log(`🚫 Booking #${id} cancelled by user ${userId}`);
    res.json({
      ok: true,
      message: 'Booking cancelled successfully',
      booking: updateResult.rows[0]
    });
  } catch (err) {
    console.error('❌ Cancel booking error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* POST process payment for booking */
router.post('/bookings/:id/pay', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method } = req.body || {};
    const userId = req.session.userId;

    // 1) Check booking exists and belongs to user
    const bookingResult = await pool.query(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    // 2) Don’t allow paying for cancelled / denied bookings
    if (booking.status === 'cancelled' || booking.status === 'denied') {
      return res.status(400).json({
        ok: false,
        error: `Cannot pay for a ${booking.status} booking`
      });
    }

    // 3) Already paid?
    if (booking.payment_status === 'paid') {
      return res.status(400).json({ ok: false, error: 'Booking already paid' });
    }

    // 4) Mark as paid (and auto-approve if it was pending)
    const result = await pool.query(
      `UPDATE bookings 
       SET payment_status = 'paid',
           payment_method  = $1,
           payment_date    = NOW(),
           updated_at      = NOW(),
           status          = CASE 
                               WHEN status = 'pending' THEN 'approved'
                               ELSE status
                             END
       WHERE id = $2
         AND user_id = $3
       RETURNING *;`,
      [payment_method || 'card', id, userId]
    );

    const updated = result.rows[0];

    console.log(
      `✅ Payment processed for booking #${id}, user ${userId}, amount: $${updated.total}`
    );

    return res.json({
      ok: true,
      message: 'Payment processed successfully',
      booking: updated
    });
  } catch (err) {
    console.error('❌ Payment processing error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
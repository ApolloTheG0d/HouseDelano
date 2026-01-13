var express = require('express');
var router = express.Router();
var pool = require('../db/pool');

/** Require normal logged-in user */
function requireUser(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ ok: false, error: 'Not authenticated' });
  }
  next();
}

/**
 * ✅ CREATE BOOKING for the logged-in user
 * POST /api/user/bookings
 * (IMPORTANT: this route must be defined BEFORE `/:id`)
 */
router.post('/bookings', requireUser, async (req, res) => {
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
      addons,
      notes
    } = req.body;

    if (!service_id || !pet_id || !booking_date || !booking_time) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields: service_id, pet_id, booking_date, booking_time'
      });
    }

    const sql = `
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
        addons,
        special_notes
      ) VALUES (
        $1, $2, $3, $4, $5,
        'pending',
        'unpaid',
        $6, $7, $8,
        $9,
        $10
      )
      RETURNING *;
    `;

    const values = [
      userId,
      pet_id,
      service_id,
      booking_date,
      booking_time,
      subtotal || 0,
      tax || 0,
      total || 0,
      JSON.stringify(addons || []),
      notes || null
    ];

    const result = await pool.query(sql, values);
    const booking = result.rows[0];

    return res.json({ ok: true, booking });
  } catch (err) {
    console.error('CREATE BOOKING ERROR:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Internal server error'
    });
  }
});

/* =========================================
 *  EXISTING USER ROUTES
 * =======================================*/

/* GET users listing (admin-ish – lists all users) */
router.get('/', async function (req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, phone, city, state, created_at 
       FROM users 
       ORDER BY created_at DESC 
       LIMIT 50;`
    );
    res.json({ ok: true, count: result.rows.length, users: result.rows });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* GET user by ID */
router.get('/:id', async function (req, res, next) {
  try {
    const { id } = req.params;
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1;', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }
    const user = userResult.rows[0];

    // Get user's pets
    const petsResult = await pool.query('SELECT * FROM pets WHERE user_id = $1;', [id]);

    res.json({ ok: true, user, pets: petsResult.rows });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* DELETE user by ID */
router.delete('/:id', async function (req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id;', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    res.json({ ok: true, message: 'User deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* POST create new user (sign up) */
router.post('/', async function (req, res, next) {
  try {
    const {
      email,
      password_hash,
      first_name,
      last_name,
      phone,
      street_address,
      city,
      state,
      zip_code
    } = req.body;

    if (!email || !password_hash) {
      return res.status(400).json({ ok: false, error: 'Email and password required' });
    }

    const result = await pool.query(
      `INSERT INTO users (
         email,
         password_hash,
         first_name,
         last_name,
         phone,
         street_address,
         city,
         state,
         zip_code
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, email, first_name, last_name;`,
      [email, password_hash, first_name, last_name, phone, street_address, city, state, zip_code]
    );

    res.status(201).json({ ok: true, user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      // Unique constraint violation
      return res.status(409).json({ ok: false, error: 'Email already exists' });
    }
    console.error('Error creating user:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
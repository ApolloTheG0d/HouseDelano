var express = require('express');
var router = express.Router();
var pool = require('../db/pool');
var bcrypt = require('bcrypt');

// Middleware to check if admin is logged in
function requireAdminAuth(req, res, next) {
  if (!req.session || !req.session.adminId) {
    return res.redirect('/admin/login');
  }
  next();
}

/* GET admin login page */
router.get('/login', (req, res) => {
  if (req.session && req.session.adminId) {
    return res.redirect('/admin');
  }

  // ✅ DISABLE LAYOUT FOR LOGIN PAGE
  res.render('admin-login', {
    layout: false, // This prevents header/footer
    title: 'Admin Login',
    error: req.query.error || null
  });
});

/* POST admin login */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  console.log(`🔐 Admin login attempt for: ${email}`);

  try {
    // Query user from database
    const result = await pool.query(
      'SELECT id, email, password_hash, first_name, last_name, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log(`❌ User not found: ${email}`);
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check if user has admin role
    if (user.role !== 'admin') {
      console.log(`❌ User ${email} is not admin (role: ${user.role})`);
      return res.status(403).json({ ok: false, error: 'Access denied: Not an admin' });
    }

    // Compare password with bcrypt
    console.log(`🔐 Comparing password for: ${email}`);
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      console.log(`❌ Invalid password for: ${email}`);
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }

    // Set session
    req.session.adminId = user.id;
    req.session.adminEmail = user.email;
    req.session.adminName = `${user.first_name} ${user.last_name}`;
    req.session.adminRole = user.role;

    console.log(`✅ Admin login successful for: ${email} (ID: ${user.id})`);

    res.json({ ok: true, message: 'Login successful', redirect: '/admin' });
  } catch (err) {
    console.error('❌ Admin login error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* GET admin logout */
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

/* GET admin dashboard (protected) */
router.get('/', requireAdminAuth, async (req, res) => {
  res.render('admin', {
    layout: false, // ✅ Also disable layout for admin dashboard
    title: 'Admin Dashboard',
    adminName: req.session.adminName || 'Admin'
  });
});

/* GET services */
router.get('/services', requireAdminAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM services;');
    res.json({ ok: true, count: result.rows.length, services: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* GET services (public - for booking form) */
router.get('/public/services', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, base_price as price FROM services ORDER BY id;');
    res.json({ ok: true, services: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* GET add-ons (public - for booking form) */
router.get('/public/addons', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, price FROM service_addons ORDER BY id;');
    res.json({ ok: true, addons: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* GET bookings */
router.get('/bookings', requireAdminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        b.*, 
        u.email AS user_email,
        u.first_name || ' ' || u.last_name AS user_name,
        u.phone AS user_phone,
        s.name AS service_name,
        s.base_price AS service_price,
        p.name AS pet_name,
        p.species AS pet_species,
        p.breed AS pet_breed
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN services s ON b.service_id = s.id
      JOIN pets p ON b.pet_id = p.id
      ORDER BY b.created_at DESC;
    `);
    res.json({ ok: true, count: result.rows.length, bookings: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* PUT approve booking */
router.put('/bookings/:id/approve', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE bookings 
       SET status = 'approved', updated_at = NOW()
       WHERE id = $1
       RETURNING *;`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Booking not found' });
    }

    console.log(`✅ Booking #${id} approved by admin ${req.session.adminEmail}`);
    res.json({ ok: true, message: 'Booking approved', booking: result.rows[0] });
  } catch (err) {
    console.error('❌ Approve booking error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* PUT deny booking */
router.put('/bookings/:id/deny', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await pool.query(
      `UPDATE bookings 
       SET status = 'denied', updated_at = NOW(), special_notes = COALESCE($2, special_notes)
       WHERE id = $1
       RETURNING *;`,
      [id, reason ? `[DENIED] ${reason}` : null]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Booking not found' });
    }

    console.log(`❌ Booking #${id} denied by admin ${req.session.adminEmail}`);
    res.json({ ok: true, message: 'Booking denied', booking: result.rows[0] });
  } catch (err) {
    console.error('❌ Deny booking error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* PUT cancel booking */
router.put('/bookings/:id/cancel', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE bookings 
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1
       RETURNING *;`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Booking not found' });
    }

    console.log(`🚫 Booking #${id} cancelled by admin ${req.session.adminEmail}`);
    res.json({ ok: true, message: 'Booking cancelled', booking: result.rows[0] });
  } catch (err) {
    console.error('❌ Cancel booking error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* DELETE booking */
router.delete('/bookings/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM bookings WHERE id = $1 RETURNING id;', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Booking not found' });
    }

    console.log(`🗑️  Booking #${id} deleted by admin ${req.session.adminEmail}`);
    res.json({ ok: true, message: 'Booking deleted' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* GET pets */
router.get('/pets', requireAdminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.email AS owner_email
      FROM pets p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC;
    `);
    res.json({ ok: true, count: result.rows.length, pets: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ADD THIS: PUT update pet */
router.put('/pets/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, species, breed, age, weight, vaccinated, is_primary } = req.body;

    const result = await pool.query(
      `UPDATE pets 
       SET name = COALESCE($1, name),
           species = COALESCE($2, species),
           breed = COALESCE($3, breed),
           age = COALESCE($4, age),
           weight = COALESCE($5, weight),
           vaccinated = COALESCE($6, vaccinated),
           is_primary = COALESCE($7, is_primary)
       WHERE id = $8
       RETURNING *;`,
      [name, species, breed, age, weight, vaccinated, is_primary, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Pet not found' });
    }

    res.json({ ok: true, message: 'Pet updated', pet: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ADD THIS: DELETE pet */
router.delete('/pets/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM pets WHERE id = $1 RETURNING id;', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Pet not found' });
    }

    res.json({ ok: true, message: 'Pet deleted' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* GET emergency contacts (admin) */
router.get('/emergency-contacts', requireAdminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, u.email AS user_email
      FROM emergency_contacts e
      JOIN users u ON e.user_id = u.id
      ORDER BY e.created_at DESC;
    `);
    res.json({ ok: true, count: result.rows.length, contacts: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* DELETE emergency contact */
router.delete('/emergency-contacts/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM emergency_contacts WHERE id = $1 RETURNING id;', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Contact not found' });
    }

    res.json({ ok: true, message: 'Emergency contact deleted' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* GET health records (admin) */
router.get('/health-records', requireAdminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT h.*, p.name AS pet_name, u.email AS owner_email
      FROM health_records h
      JOIN pets p ON h.pet_id = p.id
      JOIN users u ON p.user_id = u.id
      ORDER BY h.created_at DESC;
    `);
    res.json({ ok: true, count: result.rows.length, records: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* DELETE health record */
router.delete('/health-records/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM health_records WHERE id = $1 RETURNING id;', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Record not found' });
    }

    res.json({ ok: true, message: 'Health record deleted' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
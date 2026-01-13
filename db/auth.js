var express = require('express');
var router = express.Router();
const auth = require('../db/auth');

/* GET login page */
router.get('/login', (req, res) => {
  res.render('admin-login', { title: 'Admin Login' });
});

/* POST login */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email and password required' });
    }

    // Authenticate
    const admin = await auth.authenticateAdmin(email, password);

    if (!admin) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password' });
    }

    // Set session
    req.session.adminId = admin.id;
    req.session.adminEmail = admin.email;
    req.session.adminName = admin.name;

    console.log('✅ Admin session created:', admin.email);

    // Check if it's API request or form submission
    if (req.accepts('json')) {
      return res.json({ ok: true, admin, message: 'Logged in successfully' });
    } else {
      return res.redirect('/admin');
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* POST register (admin only - should be protected) */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email and password required' });
    }

    // Register
    const admin = await auth.registerAdmin(email, password, name || 'Admin');

    res.status(201).json({ ok: true, admin, message: 'Admin registered successfully' });
  } catch (err) {
    if (err.message.includes('already exists')) {
      return res.status(409).json({ ok: false, error: err.message });
    }
    console.error('Register error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* GET logout */
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
    }
    console.log('✅ Admin logged out');
    res.redirect('/admin/login');
  });
});

/* GET session status */
router.get('/status', (req, res) => {
  if (req.session && req.session.adminId) {
    return res.json({
      ok: true,
      authenticated: true,
      admin: {
        id: req.session.adminId,
        email: req.session.adminEmail,
        name: req.session.adminName
      }
    });
  }

  res.json({ ok: true, authenticated: false });
});

module.exports = router;
// app.js
var createError    = require('http-errors');
var express        = require('express');
var path           = require('path');
var cookieParser   = require('cookie-parser');
var logger         = require('morgan');
var session        = require('express-session');
var bcrypt         = require('bcrypt'); // used in some routes

var indexRouter    = require('./routes/index');

// ✅ THIS MUST MATCH YOUR ACTUAL FILE: routes/users.js
var usersRouter    = require('./routes/users');

// ✅ THIS MUST MATCH YOUR ACTUAL FILE: routes/bookings.js
var bookingsRouter = require('./routes/bookings');

var adminRouter    = require('./routes/admin');
var authRouter     = require('./routes/auth');
var passwordResetRouter = require('./routes/passwordReset');

// account.js handles /api/user/profile, /api/user/pets, /api/user/bookings, etc.
var accountRouter  = require('./routes/account');

var paymentRouter  = require('./routes/payment');

const expressLayouts = require('express-ejs-layouts');
const pool           = require('./db/pool');

var app = express();

// ---------------- View engine ----------------
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(expressLayouts);
app.set('layout', 'layout');

// ---------------- Core middleware ----------------
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ✅ Session must be BEFORE routes that read req.session
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// ---------------- Routes ----------------

// Main pages (HTML)
app.use('/', indexRouter);

// ✅ User/account APIs
// accountRouter: /api/user/profile, /api/user/pets, /api/user/bookings (GET/DELETE/etc.)
app.use('/api/user', accountRouter);

// usersRouter (routes/users.js): admin-style user listing, plus any extra user endpoints
// If you added POST /bookings inside users.js, it'll now be /api/user/bookings
app.use('/api/user', usersRouter);

// ✅ Booking APIs from routes/bookings.js (if you still use them separately)
app.use('/api/bookings', bookingsRouter);
app.use('/bookings', bookingsRouter); // if you still hit /bookings from admin or old code

// ✅ Admin routes
app.use('/admin', adminRouter);
app.use('/api/admin', adminRouter);
app.use('/api/services', adminRouter);
app.use('/api/pets', adminRouter);

// ✅ Payment API
app.use('/api/payment', paymentRouter);

// ✅ Auth routes
app.use('/auth', authRouter);
app.use('/auth', passwordResetRouter);

// ✅ Static files (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// ---------------- Health check ----------------
app.get('/health/db', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT current_database() AS db, now() AS ts;');
    res.json({ ok: true, db: rows[0].db, time: rows[0].ts });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ---------------- 404 handler ----------------
app.use(function (req, res, next) {
  next(createError(404));
});

// ---------------- Error handler ----------------
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error   = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
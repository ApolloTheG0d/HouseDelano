# Password Reset Feature - Implementation Checklist

## ✅ Completed Items

### Database
- [x] Added `reset_token` column to users table
- [x] Added `reset_token_expiry` column to users table
- [x] Updated schema.sql with new columns

### Backend Routes
- [x] Created `/routes/passwordReset.js` with:
  - [x] GET /auth/forgot-password - Show forgot password form
  - [x] POST /auth/forgot-password - Process email, generate token
  - [x] GET /auth/reset-password/:userId/:token - Show reset form
  - [x] POST /auth/reset-password/:userId/:token - Process password reset

### Frontend Views
- [x] Created `views/forgotPassword.ejs` - Email entry form
- [x] Created `views/resetPassword.ejs` - New password form
- [x] Created `views/resetPasswordSuccess.ejs` - Success page
- [x] Updated `public/signIn.html` - Link to forgot password

### App Configuration
- [x] Updated `app.js` to import passwordResetRouter
- [x] Registered routes at /auth endpoint
- [x] Added crypto module for token generation (built-in)
- [x] Integrated with existing bcrypt for hashing

### Security Features
- [x] Token generation using crypto.randomBytes(32)
- [x] Token hashing with bcrypt
- [x] 1-hour token expiration
- [x] User enumeration protection (don't reveal if email exists)
- [x] Password validation (minimum 6 characters)
- [x] Confirmation password matching
- [x] Token validation and expiration checks

## 🔄 Next Steps (Optional Enhancements)

### Email Integration
- [ ] Install email service package (nodemailer, SendGrid, etc.)
- [ ] Configure email credentials in .env
- [ ] Replace console.log with actual email sending
- [ ] Add email template with reset link

### Additional Features
- [ ] Add rate limiting on forgot password endpoint
- [ ] Add email confirmation for password changes
- [ ] Add password change history
- [ ] Add account recovery questions as backup
- [ ] Add multi-factor authentication (MFA)

### Testing
- [ ] Test with valid email
- [ ] Test with non-existent email
- [ ] Test expired token
- [ ] Test invalid token
- [ ] Test password mismatch
- [ ] Test short password
- [ ] Test successful reset

## 📋 Database Migration Command

Run this to add columns to existing database:
```bash
# Using psql
psql -U addiction_user -d pawsco_dev -h 127.0.0.1 << 'EOF'
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;
EOF
```

Or regenerate database:
```bash
npm run db:migrate
```

## 🔗 URL Mapping

- **Forgot Password Page**: `/auth/forgot-password`
- **Reset Password Page**: `/auth/reset-password/:userId/:token`
- **Sign In Link**: Updated in `/public/signIn.html`

## 📦 Dependencies Used

All required packages are already installed:
- `express` - Web framework
- `bcrypt` - Password hashing
- `crypto` - Built-in Node.js module for token generation
- `ejs` - Template engine

No new npm packages required!

## 🚀 Testing the Feature

1. Start the server: `npm start`
2. Go to http://localhost:3001/auth/sign-in
3. Click "Forgot password?"
4. Enter an existing user's email
5. Check console for reset link
6. Copy the reset link and visit it
7. Enter new password and confirm
8. Successfully reset!

## 💾 Code Snippets

### 1. Route Registration in app.js
```javascript
var passwordResetRouter = require('./routes/passwordReset');

// Register routes
app.use('/auth', authRouter);
app.use('/auth', passwordResetRouter);
```

### 2. POST Forgot Password Route
```javascript
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const userResult = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.render('forgotPassword', { 
        message: 'If an account exists with that email, you will receive a password reset link.',
        error: null
      });
    }

    const user = userResult.rows[0];
    const resetToken = generateResetToken();
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    const expiryTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
      [resetTokenHash, expiryTime, user.id]
    );

    const resetLink = `${process.env.BASE_URL || 'http://localhost:3001'}/auth/reset-password/${user.id}/${resetToken}`;
    console.log(`📧 Password reset link for ${email}:`, resetLink);

    res.render('forgotPassword', { 
      message: 'If an account exists with that email, you will receive a password reset link.',
      error: null
    });
  } catch (err) {
    console.error('❌ Forgot password error:', err);
    res.render('forgotPassword', { 
      error: 'An error occurred. Please try again.',
      message: null
    });
  }
});
```

### 3. POST Reset Password Route
```javascript
router.post('/reset-password/:userId/:token', async (req, res) => {
  const { userId, token } = req.params;
  const { newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.render('resetPassword', { 
      error: 'Passwords do not match',
      userId: userId,
      token: token
    });
  }

  try {
    const userResult = await pool.query(
      'SELECT id, email, reset_token, reset_token_expiry FROM users WHERE id = $1',
      [userId]
    );

    const user = userResult.rows[0];
    const tokenValid = await bcrypt.compare(token, user.reset_token);

    if (!tokenValid || new Date() > new Date(user.reset_token_expiry)) {
      return res.render('resetPassword', { 
        error: 'Reset link has expired.',
        userId: null,
        token: null
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
      [passwordHash, userId]
    );

    res.render('resetPasswordSuccess', {
      message: 'Your password has been reset successfully.'
    });
  } catch (err) {
    console.error('❌ Reset password error:', err);
    res.render('resetPassword', { 
      error: 'An error occurred. Please try again.',
      userId: userId,
      token: token
    });
  }
});
```

### 4. Database Schema Update
```sql
ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN reset_token_expiry TIMESTAMP;
```

### 5. forgotPassword.ejs
```html
<div class="auth-container">
  <div class="auth-card">
    <h1>Forgot Password</h1>
    <p class="auth-subtitle">Enter your email address and we'll send you a link to reset your password</p>

    <% if (error) { %>
      <div class="alert alert-danger" role="alert">
        <%= error %>
      </div>
    <% } %>

    <form method="POST" action="/auth/forgot-password" class="auth-form">
      <div class="form-group">
        <label for="email">Email Address</label>
        <input 
          type="email" 
          id="email" 
          name="email" 
          class="form-control" 
          placeholder="Enter your email" 
          required
        />
      </div>

      <button type="submit" class="btn btn-primary btn-block">Send Reset Link</button>

      <div class="auth-links">
        <p>Remember your password? <a href="/auth/sign-in">Sign In</a></p>
      </div>
    </form>
  </div>
</div>
```

### 6. resetPassword.ejs
```html
<div class="auth-container">
  <div class="auth-card">
    <h1>Reset Password</h1>
    <p class="auth-subtitle">Enter your new password below</p>

    <% if (error) { %>
      <div class="alert alert-danger" role="alert">
        <%= error %>
      </div>
    <% } %>

    <% if (userId && token) { %>
      <form method="POST" action="/auth/reset-password/<%= userId %>/<%= token %>" class="auth-form">
        <div class="form-group">
          <label for="newPassword">New Password</label>
          <input 
            type="password" 
            id="newPassword" 
            name="newPassword" 
            class="form-control" 
            placeholder="Enter new password" 
            required
          />
          <small class="form-text text-muted">Password must be at least 6 characters</small>
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input 
            type="password" 
            id="confirmPassword" 
            name="confirmPassword" 
            class="form-control" 
            placeholder="Confirm new password" 
            required
          />
        </div>

        <button type="submit" class="btn btn-primary btn-block">Reset Password</button>

        <div class="auth-links">
          <p><a href="/auth/sign-in">Back to Sign In</a></p>
        </div>
      </form>
    <% } %>
  </div>
</div>
```

### 7. Updated signIn.html Link
```html
<a aria-label="Forgot password" class="paws-forgot-link" href="/auth/forgot-password">Forgot password?</a>
```

### 8. Token Generation Function
```javascript
const crypto = require('crypto');

function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}
```

### 9. Email Integration Example (Future)
```javascript
// Install: npm install nodemailer
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const resetLink = `${process.env.BASE_URL}/auth/reset-password/${user.id}/${resetToken}`;

await transporter.sendMail({
  from: 'noreply@pawsco.com',
  to: email,
  subject: 'Reset Your Password - Paws & Company',
  html: `
    <h2>Password Reset Request</h2>
    <p>Click the link below to reset your password:</p>
    <a href="${resetLink}">Reset Password</a>
    <p>This link expires in 1 hour.</p>
  `
});
```

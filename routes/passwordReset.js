const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pool = require('../db/pool');

// Generate a secure reset token
function generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
}

// 1. GET forgot password page
router.get('/forgot-password', (req, res) => {
    res.render('forgotPassword', { message: null, error: null });
});

// 2. POST request password reset link
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.render('forgotPassword', {
            error: 'Email is required',
            message: null
        });
    }

    try {
        // Check if user exists
        const userResult = await pool.query(
            'SELECT id, email FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            // For security, don't reveal if email exists
            return res.render('forgotPassword', {
                message: 'If an account exists with that email, you will receive a password reset link.',
                error: null
            });
        }

        const user = userResult.rows[0];
        const resetToken = generateResetToken();
        const resetTokenHash = await bcrypt.hash(resetToken, 10);
        const expiryTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

        // Store reset token in database
        await pool.query(
            'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
            [resetTokenHash, expiryTime, user.id]
        );

        // Redirect user directly to reset password page
        res.redirect(`/auth/reset-password/${user.id}/${resetToken}`);

    } catch (err) {
        console.error('❌ Forgot password error:', err);
        res.render('forgotPassword', {
            error: 'An error occurred. Please try again.',
            message: null
        });
    }
});

// 3. GET reset password page
router.get('/reset-password/:userId/:token', async (req, res) => {
    const { userId, token } = req.params;

    try {
        const userResult = await pool.query(
            'SELECT id, email, reset_token, reset_token_expiry FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.render('resetPassword', {
                error: 'Invalid reset link',
                userId: null,
                token: null
            });
        }

        const user = userResult.rows[0];

        // Check if reset token exists and hasn't expired
        if (!user.reset_token || !user.reset_token_expiry) {
            return res.render('resetPassword', {
                error: 'Reset link has expired. Please request a new one.',
                userId: null,
                token: null
            });
        }

        if (new Date() > new Date(user.reset_token_expiry)) {
            return res.render('resetPassword', {
                error: 'Reset link has expired. Please request a new one.',
                userId: null,
                token: null
            });
        }

        // Verify token
        const tokenValid = await bcrypt.compare(token, user.reset_token);
        if (!tokenValid) {
            return res.render('resetPassword', {
                error: 'Invalid reset link',
                userId: null,
                token: null
            });
        }

        res.render('resetPassword', {
            error: null,
            userId: userId,
            token: token
        });

    } catch (err) {
        console.error('❌ Reset password page error:', err);
        res.render('resetPassword', {
            error: 'An error occurred. Please try again.',
            userId: null,
            token: null
        });
    }
});

// 4. POST reset password
router.post('/reset-password/:userId/:token', async (req, res) => {
    const { userId, token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
        return res.render('resetPassword', {
            error: 'Please fill in all fields',
            userId: userId,
            token: token
        });
    }

    if (newPassword !== confirmPassword) {
        return res.render('resetPassword', {
            error: 'Passwords do not match',
            userId: userId,
            token: token
        });
    }

    if (newPassword.length < 8) {
        return res.render('resetPassword', {
            error: 'Password must be at least 8 characters',
            userId: userId,
            token: token
        });
    }

    try {
        const userResult = await pool.query(
            'SELECT id, email, reset_token, reset_token_expiry FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.render('resetPassword', {
                error: 'Invalid reset link',
                userId: null,
                token: null
            });
        }

        const user = userResult.rows[0];

        // Verify token still valid
        const tokenValid = await bcrypt.compare(token, user.reset_token);
        if (!tokenValid || new Date() > new Date(user.reset_token_expiry)) {
            return res.render('resetPassword', {
                error: 'Reset link has expired. Please request a new one.',
                userId: null,
                token: null
            });
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update password and clear reset token
        await pool.query(
            'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
            [passwordHash, userId]
        );

        console.log(`✅ Password reset successful for user ${user.email}`);

        res.render('resetPasswordSuccess', {
            message: 'Your password has been reset successfully. You can now log in with your new password.'
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

module.exports = router;

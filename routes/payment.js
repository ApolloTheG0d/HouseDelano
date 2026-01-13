// routes/payment.js
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

/**
 * POST /api/payment
 * Body (from payment.html):
 *  - booking_id         (from sessionStorage.booking.bookingId)
 *  - subtotal_cents
 *  - tax_cents
 *  - total_cents
 *  - currency
 *  - provider           ('card', 'apple_pay', etc.)
 *  - card { name, number, expiry, cvc, zip }   // fake for demo
 *  - customer { full_name, email, phone }
 *  - address { ... }
 *  - expires_at         (ms since epoch, from bookingExpiresAt)
 */
router.post('/', async (req, res) => {
  try {
    const {
      booking_id,
      subtotal_cents,
      tax_cents,
      total_cents,
      currency,
      provider,
      card,
      customer,
      address,
      expires_at
    } = req.body;

    // ----- Basic checks -----
    if (!total_cents || total_cents <= 0) {
      return res.status(400).json({
        ok: false,
        error: 'Total amount must be greater than zero'
      });
    }

    if (currency && currency !== 'USD') {
      return res.status(400).json({
        ok: false,
        error: 'Only USD currency is supported in this demo'
      });
    }

    // Session expiration guard (optional)
    if (expires_at && Date.now() > Number(expires_at)) {
      return res.status(400).json({
        ok: false,
        error: 'Payment session has expired. Please start a new booking.'
      });
    }

    // ----- Fake “payment processor” -----
    // In a real app you would call Stripe/PayPal here.
    const paymentId = 'pay_' + Date.now();

    // ----- If we have a booking_id, mark that booking as paid -----
    let updatedBooking = null;
    if (booking_id) {
      const result = await pool.query(
        `UPDATE bookings
           SET payment_status = 'paid',
               payment_method = $1,
               payment_date   = NOW(),
               updated_at     = NOW()
         WHERE id = $2
         RETURNING *;`,
        [provider || 'card', booking_id]
      );

      if (result.rows.length > 0) {
        updatedBooking = result.rows[0];
        console.log(
          `✅ Booking #${booking_id} marked as PAID via ${provider || 'card'} (payment_id=${paymentId})`
        );
      } else {
        console.warn('⚠️ No booking found to mark as paid for ID:', booking_id);
      }
    }

    // Success response to frontend
    return res.json({
      ok: true,
      payment_id: paymentId,
      booking: updatedBooking,
      redirect_url: '/checkout.html'
    });
  } catch (err) {
    console.error('❌ PAYMENT ERROR:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Internal server error'
    });
  }
});

module.exports = router;
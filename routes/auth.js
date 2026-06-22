var express = require('express');
var router = express.Router();
var pool = require('../db/pool');
var bcrypt = require('bcrypt');

/* POST /auth/signup - Create new user account */
router.post('/signup', async (req, res) => {
  const client = await pool.connect(); // Use transaction
  
  try {
    await client.query('BEGIN');

    const {
      email,
      password,
      confirmPassword,
      firstName,
      lastName,
      phone,
      streetAddress,
      city,
      state,
      zipCode,
      // Pet information
      petName,
      species,
      breed,
      age,
      weight,
      vaccinated,
      // Emergency contact
      emergencyName,
      emergencyRelationship,
      emergencyPhone,
      emergencyEmail,
      // Consents
      agreeTerms
    } = req.body;

    // 1. VALIDATION
    if (!email || !password) {
      await client.query('ROLLBACK');
      return res.status(400).json({ ok: false, error: 'Email and password are required' });
    }

    if (password.length < 8) {
      await client.query('ROLLBACK');
      return res.status(400).json({ ok: false, error: 'Password must be at least 8 characters' });
    }

    if (password !== confirmPassword) {
      await client.query('ROLLBACK');
      return res.status(400).json({ ok: false, error: 'Passwords do not match' });
    }

    if (!agreeTerms) {
      await client.query('ROLLBACK');
      return res.status(400).json({ ok: false, error: 'You must agree to Terms & Privacy' });
    }

    // 2. CHECK IF EMAIL EXISTS
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ ok: false, error: 'Email already registered' });
    }

    // 3. HASH PASSWORD WITH BCRYPT (10 ROUNDS)
    console.log(`🔐 Hashing password for: ${email}`);
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. INSERT USER
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, street_address, city, state, zip_code, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'user')
       RETURNING id, email, first_name, last_name, role;`,
      [email, hashedPassword, firstName, lastName, phone, streetAddress, city, state, zipCode]
    );

    const user = userResult.rows[0];
    console.log(`✅ User created: ${user.email} (ID: ${user.id})`);

    // 5. INSERT PET (if provided)
    // if (petName) {
    //   const petResult = await client.query(
    //     `INSERT INTO pets (user_id, name, species, breed, age, weight, vaccinated, is_primary)
    //      VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
    //      RETURNING id;`,
    //     [user.id, petName, species, breed, age || null, weight || null, vaccinated === 'yes']
    //   );
    //   console.log(`✅ Pet created for user ${user.id}: ${petName} (ID: ${petResult.rows[0].id})`);
    // }
    if (petName && petName.trim()) {
      console.log(`Attempting to create pet for user ${user.id}:`);
      console.log(`   Name:      ${petName}`);
      console.log(`   Species:   ${species}`);
      console.log(`   Breed:     ${breed}`);
      console.log(`   Age:       ${age}`);
      console.log(`   Weight:    ${weight}`);
      console.log(`   Vaccinated: ${vaccinated}`);

      try {
        const petResult = await client.query(
          `INSERT INTO pets (user_id, name, species, breed, age, weight, vaccinated, is_primary)
          VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
          RETURNING id;`,
          [
            user.id, 
            petName, 
            species || null, 
            breed || null, 
            age ? parseFloat(age) : null, 
            weight ? parseFloat(weight) : null, 
            vaccinated === 'yes'
          ]
        );
        
        console.log(`✅ Pet created successfully! Pet ID: ${petResult.rows[0].id}`);
      } catch (petErr) {
        console.error(`❌ Pet creation failed:`, petErr);
        // Don't rollback entire transaction for pet failure
        console.log(`⚠️ Continuing without pet...`);
      }
    } else {
      console.log(`⚠️ No pet name provided, skipping pet creation`);
    }

    // 6. INSERT EMERGENCY CONTACT (if provided)
    // if (emergencyName && emergencyPhone) {
    //     await client.query(
    //         `INSERT INTO emergency_contacts (user_id, name, relationship, phone, email, is_primary)
    //         VALUES ($1, $2, $3, $4, $5, TRUE)`,
    //         [user.id, emergencyName, emergencyRelationship, emergencyPhone, emergencyEmail]
    //     );
    //     console.log(`✅ Emergency contact created for user ${user.id}`);
    // }
    if (emergencyName && emergencyName.trim() && emergencyPhone && emergencyPhone.trim()) {
    console.log(`📞 Attempting to create emergency contact for user ${user.id}:`);
    console.log(`   Name:         ${emergencyName}`);
    console.log(`   Phone:        ${emergencyPhone}`);
    console.log(`   Email:        ${emergencyEmail}`);
    console.log(`   Relationship: ${emergencyRelationship}`);
        
    await client.query(
      `INSERT INTO emergency_contacts (user_id, name, relationship, phone, email, is_primary)
       VALUES ($1, $2, $3, $4, $5, TRUE)`,
      [user.id, emergencyName, emergencyRelationship || null, emergencyPhone, emergencyEmail || null]
    );
    
    console.log(`✅ Emergency contact created successfully!`);
    } else {
    console.log(`⚠️  Incomplete emergency contact info, skipping`);
    }

    // 7. COMMIT TRANSACTION
    await client.query('COMMIT');

    // 8. SET SESSION (auto-login)
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userName = `${user.first_name} ${user.last_name}`;
    req.session.userRole = user.role;

    res.status(201).json({
      ok: true,
      message: '✅ Account created successfully!',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      },
      redirect: '/account.html'  // Redirect to new account page
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Signup error:', err);
    res.status(500).json({ ok: false, error: 'Server error during signup' });
  } finally {
    client.release();
  }
});

/* POST /auth/signin - Sign in existing user */
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email and password required' });
    }

    // 1. QUERY USER BY EMAIL (THIS WAS MISSING!)
    const result = await pool.query(
      'SELECT id, email, password_hash, first_name, last_name, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log(`❌ User not found: ${email}`);
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // 2. COMPARE PASSWORD WITH BCRYPT
    console.log(`🔐 Comparing password for: ${email}`);
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      console.log(`❌ Invalid password for: ${email}`);
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }

    // 3. SET SESSION
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userName = `${user.first_name} ${user.last_name}`;
    req.session.userRole = user.role;

    console.log(`✅ Sign-in successful: ${email} (ID: ${user.id})`);

    res.json({
      ok: true,
      message: 'Login successful',
      redirect: user.role === 'admin' ? '/admin' : '/account',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }
    });

  } catch (err) {
    console.error('❌ Sign-in error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* GET /auth/logout - Log out user */
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
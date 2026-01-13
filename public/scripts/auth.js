
(function () {
  var form = document.getElementById('signinForm');
  var email = document.getElementById('email');
  var pw = document.getElementById('password');
  var toggle = document.querySelector('.pw-toggle');
  var year = document.getElementById('year');
  if (year) { year.textContent = new Date().getFullYear(); }

  if (toggle && pw) {
    toggle.addEventListener('click', function () {
      var show = pw.getAttribute('type') === 'password';
      pw.setAttribute('type', show ? 'text' : 'password');
      toggle.textContent = show ? 'Hide' : 'Show';
      toggle.setAttribute('aria-pressed', show ? 'true' : 'false');
    });
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // Simple client-side validation
      var ok = true;
      [email, pw].forEach(function (el) {
        if (!el.checkValidity()) {
          el.classList.add('error'); ok = false;
        } else {
          el.classList.remove('error');
        }
      });
      if (!ok) return;

      // Send sign-in request to backend
      fetch('/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.value,
          password: pw.value
        })
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (data) {
          if (data.ok) {
            window.location.href = data.redirect || '/index.html';
          } else {
            alert('Sign-in failed: ' + (data.error || 'Unknown error'));
          }
        })
        .catch(function (error) {
          console.error('Error:', error);
          alert('Sign-in error: ' + error.message);
        });
    });
  }
})();

/* POST /auth/signin - Sign in existing user */
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email and password required' });
    }

    // 1. QUERY USER BY EMAIL
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
      redirect: user.role === 'admin' ? '/admin' : '/index.html', // ✅ Redirect to index after login
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
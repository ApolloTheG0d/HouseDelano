// require('dotenv').config(); // Add this at the very top
// const { Pool } = require('pg');

// const pool = new Pool({
//   user: process.env.DB_USER || 'pawsco_user',
//   password: process.env.DB_PASS || 'pawsco_secure_password_123',
//   host: process.env.DB_HOST || 'localhost',
//   port: process.env.DB_PORT || 5432,
//   database: process.env.DB_NAME || 'pawsco_dev',
// });

// async function seed() {
//   try {
//     console.log('🌱 Seeding database...');

//     // ===== SERVICES =====
//     await pool.query(`
//       INSERT INTO services (name, description, base_price, duration_minutes)
//       VALUES
//         ('Full Grooming', 'Bath, brush, nail trim, ear cleaning', 55.00, 90),
//         ('Overnight Boarding', 'Safe, cozy suites with daily updates', 45.00, 1440),
//         ('Daycare (Full Day)', 'Structured playgroups, rest time, enrichment', 30.00, 480),
//         ('Obedience Training', 'Private or small-group sessions with certified trainers', 60.00, 60),
//         ('Dog Walking', 'Solo or small-pack walks, GPS-tracked', 20.00, 30),
//         ('Vet Telehealth', 'Chat or video with licensed vets', 35.00, 30)
//       ON CONFLICT DO NOTHING;
//     `);
//     console.log('✅ Services seeded');

//     // ===== SERVICE ADD-ONS =====
//     await pool.query(`
//       INSERT INTO service_addons (name, price)
//       VALUES
//         ('De-shedding', 10.00),
//         ('Nail Trim', 12.00),
//         ('Teeth Cleaning', 15.00),
//         ('Flea & Tick Treatment', 20.00),
//         ('Gland Expression', 8.00)
//       ON CONFLICT DO NOTHING;
//     `);
//     console.log('✅ Add-ons seeded');

//     // ===== STAFF =====
//     await pool.query(`
//       INSERT INTO staff (name, role, email, bio)
//       VALUES
//         ('Jake W', 'Owner', 'jake@pawsco.com', 'Founder & Operations Lead. Passionate about pet safety and customer care.'),
//         ('Shanghong', 'Head Groomer', 'shanghong@pawsco.com', 'Certified groomer specializing in breed-standard cuts and creative styling.'),
//         ('Huy Huy', 'Trainer', 'huyhuy@pawsco.com', 'Certified trainer focusing on puppy basics and socialization.'),
//         ('Edward', 'Trainer', 'edward@pawsco.com', 'Advanced obedience and behavior modification specialist.')
//       ON CONFLICT DO NOTHING;
//     `);
//     console.log('✅ Staff seeded');

//     console.log('✨ Database seeding complete!');
//     process.exit(0);
//   } catch (err) {
//     console.error('❌ Seeding error:', err);
//     process.exit(1);
//   }
// }

// seed();

// <--------------------------> //
const pool = require('./pool');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MAX_RETRIES = 40;
const RETRY_DELAY = 1000;

async function waitForDB(attempt = 1) {
  try {
    if (attempt % 5 === 1 || attempt === 1) {
      console.log(`⏳ Checking database... (attempt ${attempt}/${MAX_RETRIES})`);
    }

    const result = await pool.query('SELECT NOW() as connected_at;');
    console.log(`✅ Database connected! (took ${(attempt - 1) * RETRY_DELAY}ms)`);
    return result.rows[0];
  } catch (err) {
    if (attempt >= MAX_RETRIES) {
      console.error(`\n❌ Database connection failed after ${MAX_RETRIES} attempts`);
      throw err;
    }

    if (attempt % 10 === 0) {
      process.stdout.write('.');
    }

    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    return waitForDB(attempt + 1);
  }
}

async function seed() {
  try {
    console.log('\n🚀 Paws & Company - Database Setup');
    console.log('═══════════════════════════════════\n');

    await waitForDB();

    console.log('\n🌱 Seeding database...\n');

    // READ AND EXECUTE SCHEMA.SQL
    console.log('📄 Reading schema.sql...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('🔨 Creating database schema...');
    await pool.query(schema);
    console.log('✓ Schema created');

    // * READ ADMIN CREDENTIALS FROM .env *
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@pawsco.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'password123';

    // *** IMPORTANT: HASH PASSWORD WITH BCRYPT (10 ROUNDS) *** 
    console.log('🔐 Hashing admin password with bcrypt (10 rounds)...');
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    console.log(`✅ Password hashed successfully`);
    console.log(`   Plain text:  ${adminPassword}`);
    console.log(`   Bcrypt hash: ${hashedPassword.substring(0, 30)}...`);
    console.log(`   Salt rounds: 10`);

    // Seed admin user
    const adminResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, city, state, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, role;`,
      [adminEmail, hashedPassword, 'Admin', 'User', '(555) 123-4567', 'San Francisco', 'CA', 'admin']
    );

    const adminId = adminResult.rows[0].id;

    console.log('\n✅ Admin user created:');
    console.log(`   ID:       ${adminId}`);
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role:     admin`);
    console.log(`   Hash:     ${hashedPassword.substring(0, 20)}...`);

    // Seed services
    const services = [
      ['Dog Boarding', 'Safe overnight boarding for dogs', 45.00, 1440],
      ['Cat Boarding', 'Separate facility for cats', 45.00, 1440],
      ['Grooming', 'Full grooming service', 55.00, 120],
      ['Daycare', 'Half or full day supervision', 30.00, 480],
      ['Training', 'Obedience training sessions', 60.00, 60],
      ['Walking', 'Dog walking service', 20.00, 30]
    ];

    const serviceIds = [];
    for (const [name, desc, price, duration] of services) {
      const res = await pool.query(
        `INSERT INTO services (name, description, base_price, duration_minutes)
         VALUES ($1, $2, $3, $4) RETURNING id;`,
        [name, desc, price, duration]
      );
      serviceIds.push(res.rows[0].id);
    }
    console.log(`✓ ${services.length} services created`);

    // Seed service add-ons
    const addons = [
      ['De-shedding', 10.00, 'Professional de-shedding treatment'],
      ['Nail Trim', 12.00, 'Professional nail trimming'],
      ['Teeth Cleaning', 15.00, 'Professional teeth cleaning'],
      ['Flea & Tick Treatment', 20.00, 'Flea and tick prevention treatment'],
      ['Gland Expression', 8.00, 'Anal gland expression service']
    ];

    const addonIds = [];
    for (const [name, price, desc] of addons) {
      const res = await pool.query(
        `INSERT INTO service_addons (name, price, description)
         VALUES ($1, $2, $3) RETURNING id;`,
        [name, price, desc]
      );
      addonIds.push(res.rows[0].id);
    }
    console.log(`✓ ${addons.length} add-ons created`);

    // Seed pets
    const petResult = await pool.query(
      `INSERT INTO pets (user_id, name, species, breed, age, weight, vaccinated, is_primary)  -- ✅ ADD is_primary
      VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)  -- ✅ ADD TRUE parameter
      RETURNING id;`,
      [adminId, 'Luna', 'Dog', 'Golden Retriever', 3.5, 65.0, true]  // No change here
    );
    console.log(`✓ Sample pet created`);

    // Seed booking
    const bookingDate = new Date();
    bookingDate.setDate(bookingDate.getDate() + 7);
    const bookingDateStr = bookingDate.toISOString().split('T')[0];

    await pool.query(
      `INSERT INTO bookings (user_id, pet_id, service_id, booking_date, booking_time, status, subtotal, tax, total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
      [adminId, petResult.rows[0].id, serviceIds[0], bookingDateStr, '09:00:00', 'confirmed', 45.00, 3.88, 48.88]
    );
    console.log(`✓ Sample booking created`);

    console.log('\n✅ Database setup complete!\n');
    console.log('📊 Summary:');
    console.log(`   • Users: 1 (admin)`);
    console.log(`   • Services: ${services.length}`);
    console.log(`   • Add-ons: ${addons.length}`);
    console.log(`   • Pets: 1`);
    console.log(`   • Bookings: 1\n`);

    console.log('🔑 Login Credentials:');
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${adminPassword}\n`);

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seeding failed:', err.message);
    console.error('Stack trace:', err.stack);
    await pool.end();
    process.exit(1);
  }
}

seed();
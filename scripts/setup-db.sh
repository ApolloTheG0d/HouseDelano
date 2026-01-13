#!/bin/bash

echo "🐾 Paws & Company - Database Setup"
echo "===================================="
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    exit 1
fi

echo "📦 Step 1: Creating database..."
sudo -u postgres psql -c "CREATE DATABASE pawsco_dev OWNER addiction_user;" 2>/dev/null || echo "   Database already exists, continuing..."

echo "📋 Step 2: Initializing schema..."
sudo -u postgres psql pawsco_dev < db/schema.sql

echo "🔐 Step 3: Granting permissions..."
sudo -u postgres psql pawsco_dev -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO addiction_user; GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO addiction_user;"

echo "🛍️  Step 4: Seeding services..."
sudo -u postgres psql pawsco_dev << 'EOF'
INSERT INTO services (name, description, base_price, duration_minutes) VALUES 
('Dog Walking', 'Professional dog walking service for your furry friend', 25.00, 30),
('Pet Sitting', 'In-home pet sitting and care while you are away', 40.00, 60),
('Pet Grooming', 'Complete grooming service including bath, trim, and nail care', 50.00, 90),
('Veterinary Visit', 'Companion service for veterinary appointments', 35.00, 120),
('Training Session', 'One-on-one training session for behavior and obedience', 60.00, 60),
('Pet Photography', 'Professional photo session for your beloved pet', 75.00, 45)
ON CONFLICT DO NOTHING;
EOF

echo "👤 Step 5: Creating admin user..."
sudo -u postgres psql pawsco_dev -c "INSERT INTO users (email, password_hash, first_name, last_name, phone, role, created_at, updated_at) VALUES ('admin@pawsco.com', '\$2b\$10\$/IXgi0RfOtHcfPStp2DPMeALXQxwQoa3y/UE65YuvwhtauYmchIHC', 'Admin', 'User', '555-0000', 'admin', NOW(), NOW()) ON CONFLICT (email) DO NOTHING;"

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📝 Admin Credentials:"
echo "   Email: admin@pawsco.com"
echo "   Password: password123"
echo ""
echo "🚀 Next steps:"
echo "   1. Create .env file (see QUICKSTART.md for template)"
echo "   2. Run: npm start"
echo ""

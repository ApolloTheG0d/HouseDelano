#envFiletemplate:
# ===== Database Configuration =====
DB_USER=user
DB_PASS=password_123
DB_NAME=pawsco_dev
DB_HOST=127.0.0.1
DB_PORT=5432

# ===== Admin Login Credentials =====
ADMIN_EMAIL=admin@pawsco.com
ADMIN_PASSWORD=password_123

# ===== Application Environment =====
# Options: development, docker, production
NODE_ENV=development

# ===== Session Configuration =====
SESSION_SECRET=your-secret-key-change-in-production

# ===== Server Configuration =====
PORT=3001

# ===== Logging =====
LOG_LEVEL=debug

# ===== Data Storage Mode =====
# Options: 'docker' (default, portable) or 'local' (repository-stored)
# When DATA_STORAGE_MODE=local, data is saved to ./db/postgres_data/
# When DATA_STORAGE_MODE=docker, data is saved to Docker volume 'pawsco_db_data'DATA_STORAGE_MODE=local
DATA_STORAGE_MODE=local

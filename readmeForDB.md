# Database Setup

## Quick Start (One-Step)

```bash
npm run db:start
npm start
```

That's it! Your local PostgreSQL is running.

## Common Commands

```bash
# Setup databse


# Start database
npm run db:start

# Stop database
npm run db:stop

# Restart database
npm run db:restart

# View database logs
npm run db:logs

# Connect to database shell
npm run db:shell

# Seed with sample data
npm run db:seed

# Full reset (⚠️ deletes all data)
npm run db:reset

# Check if database is using Docker volume or local directory
npm run db:check-mode

# Check health of app and database
npm run db:health

# Run full diagnostic script
npm run db:diagnose
```

## What's Happening?

- Database runs in **Docker** container
- Data stored in `db/postgres_data/` (local to project)
- Schema auto-loaded from `db/schema.sql`
- No system PostgreSQL installation needed

## Troubleshooting

### "Docker not installed"
```bash
# Install Docker Desktop: https://www.docker.com/products/docker-desktop
```

### "Port 5432 already in use"
```bash
# Change DB_PORT in .env to 5433 (or any free port)
```

### "Permission denied"
```bash
# On Linux, add user to docker group:
sudo usermod -aG docker $USER
newgrp docker
```

### "Database won't start"
```bash
npm run db:logs  # Check logs for errors
npm run db:reset # Full reset
```

## Production Notes

For production:
- Use managed PostgreSQL (AWS RDS, Supabase, etc.)
- Don't commit `db/postgres_data/`
- Use strong passwords (rotate in .env)
- Enable SSL connections
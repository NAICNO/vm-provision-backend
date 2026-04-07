# Database Seed Data

Schema management is handled by Prisma migrations in `rest/prisma/migrations/`.

## Files

- **`vm_templates.sql`** — Seed data for providers and VM templates. Run against the database after migrations to populate the initial provider and template catalog.

## Usage

```bash
# Apply migrations first
cd rest && npx prisma migrate deploy

# Then seed templates
psql -U <user> -d vm_management_db -f data/vm_templates.sql
```

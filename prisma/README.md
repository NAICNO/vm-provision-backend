Update the schema in `prisma/schema.prisma`.

To apply your Prisma schema changes to the database, use the `prisma migrate dev` CLI command:

Ex: `npx prisma migrate dev --name <update message>`

This command will:

* Create a new SQL migration file for the migration
* Apply the generated SQL migration to the database
* Regenerate Prisma Client

Refer to the [Evolve your schema.](https://www.prisma.io/docs/getting-started/setup-prisma/add-to-existing-project/relational-databases/evolve-your-schema-typescript-postgresql)

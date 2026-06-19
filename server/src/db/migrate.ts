import { db, client } from "./index.ts";
import { migrate } from "drizzle-orm/postgres-js/migrator";

async function runMigration() {
  console.log("=== Running Database Migrations ===");
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("=== Migrations Completed Successfully ===");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

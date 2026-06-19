import { client } from "./index.ts";

async function main() {
  console.log("=== Database Seeding Started ===");
  try {
    console.log("No dummy seed data to insert for now.");
    console.log("=== Database Seeding Completed Successfully ===");
  } catch (error) {
    console.error("Error during database seeding:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();


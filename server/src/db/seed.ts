import { db, client } from "./index.ts";
import { users } from "./schema.ts";
import { eq } from "drizzle-orm";

async function main() {
  console.log("=== Database Seeding Started ===");
  try {
    const adminEmail = "admin@gmail.com";
    
    // Check if the admin user already exists
    const existingAdmins = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (existingAdmins.length > 0) {
      console.log(`User with email "${adminEmail}" already exists. Skipping insertion.`);
    } else {
      console.log(`Hashing password for "${adminEmail}"...`);
      const passwordHash = await Bun.password.hash("Admin@1234", {
        algorithm: "bcrypt",
        cost: 10
      });

      console.log(`Inserting root super admin...`);
      await db.insert(users).values({
        name: "Root Super Admin",
        email: adminEmail,
        passwordHash: passwordHash,
        role: "super_admin",
        isActive: true,
      });

      console.log("Root super admin created successfully.");
    }

    console.log("=== Database Seeding Completed Successfully ===");
  } catch (error) {
    console.error("Error during database seeding:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

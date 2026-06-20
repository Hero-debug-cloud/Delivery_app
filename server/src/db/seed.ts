import { db, client } from "./index.ts";
import { users, stores, productCategories, products } from "./schema.ts";
import { eq } from "drizzle-orm";

async function main() {
  console.log("=== Database Seeding Started ===");
  try {
    // 1. Root Super Admin
    const adminEmail = "admin@gmail.com";
    let adminUser = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1)
      .then(res => res[0]);

    if (!adminUser) {
      console.log(`Hashing password for "${adminEmail}"...`);
      const passwordHash = await Bun.password.hash("Admin@1234", {
        algorithm: "bcrypt",
        cost: 10
      });

      console.log(`Inserting root super admin...`);
      const [newAdmin] = await db.insert(users).values({
        name: "Root Super Admin",
        email: adminEmail,
        passwordHash: passwordHash,
        role: "super_admin",
        isActive: true,
      }).returning();
      adminUser = newAdmin;
      console.log("Root super admin created successfully.");
    } else {
      console.log(`User with email "${adminEmail}" already exists. Skipping.`);
    }

    // 2. Stores Setup
    console.log("Checking and seeding stores...");
    const existingStores = await db.select().from(stores).limit(2);
    let storeIds: string[] = existingStores.map(s => s.id);

    if (storeIds.length === 0) {
      console.log("Inserting demo stores...");
      const insertedStores = await db.insert(stores).values([
        {
          name: "Central Bengaluru Hub",
          address: "100 MG Road, Bangalore",
          latitude: 12.9716,
          longitude: 77.5946,
          phone: "+91 80 2345 6789",
          isActive: true
        },
        {
          name: "North Hebbal Hub",
          address: "404 Outer Ring Road, Hebbal",
          latitude: 13.0358,
          longitude: 77.5978,
          phone: "+91 80 9876 5432",
          isActive: true
        }
      ]).returning();
      storeIds = insertedStores.map(s => s.id);
      console.log(`Created ${storeIds.length} stores.`);
    } else {
      console.log(`Found ${storeIds.length} existing stores.`);
    }

    // 3. Product Categories Setup
    console.log("Checking and seeding product categories...");
    const existingCategories = await db.select().from(productCategories);
    let categoriesList = existingCategories;

    if (categoriesList.length === 0) {
      console.log("Inserting default product categories...");
      categoriesList = await db.insert(productCategories).values([
        {
          name: "Fruits & Vegetables",
          description: "Fresh produce sourced directly from farmers",
          imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=60",
          isActive: true
        },
        {
          name: "Dairy & Eggs",
          description: "Fresh milk, butter, cheese, and farm eggs",
          imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=60",
          isActive: true
        },
        {
          name: "Bakery & Bread",
          description: "Freshly baked artisan bread and sweet pastries",
          imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=60",
          isActive: true
        },
        {
          name: "Cold Drinks & Juices",
          description: "Refreshing soda, iced tea, energy drinks, and fruit juices",
          imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=60",
          isActive: true
        },
        {
          name: "Munchies & Snacks",
          description: "Chips, cookies, popcorn, and late-night snacks",
          imageUrl: "https://images.unsplash.com/photo-1599490659213-e2b9527b0876?w=400&auto=format&fit=crop&q=60",
          isActive: true
        }
      ]).returning();
      console.log(`Created ${categoriesList.length} categories.`);
    } else {
      console.log(`Found ${categoriesList.length} existing categories.`);
    }

    // 4. Products Setup
    console.log("Checking and seeding products...");
    const existingProductsCount = await db.select().from(products).limit(1);

    if (existingProductsCount.length === 0) {
      console.log("Inserting demo products...");
      const productsData = [];

      const findCategory = (name: string) => categoriesList.find(c => c.name === name);

      for (const storeId of storeIds) {
        // Fruits & Veg
        const fruitsCategory = findCategory("Fruits & Vegetables");
        if (fruitsCategory) {
          productsData.push({
            storeId,
            categoryId: fruitsCategory.id,
            category: fruitsCategory.name,
            name: "Organic Bananas",
            description: "Fresh, sweet Cavendish bananas sourced from local farms.",
            price: 5000, // ₹50.00
            unitSize: "1 kg (approx 6-8 pcs)",
            imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&auto=format&fit=crop&q=60",
            isFeatured: true,
            isVeg: true,
            inStock: true
          });
          productsData.push({
            storeId,
            categoryId: fruitsCategory.id,
            category: fruitsCategory.name,
            name: "Fresh Red Apples",
            description: "Crisp and sweet Royal Gala apples, rich in dietary fiber.",
            price: 18000, // ₹180.00
            unitSize: "1 kg (approx 4-5 pcs)",
            imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&auto=format&fit=crop&q=60",
            isFeatured: false,
            isVeg: true,
            inStock: true
          });
        }

        // Dairy & Eggs
        const dairyCategory = findCategory("Dairy & Eggs");
        if (dairyCategory) {
          productsData.push({
            storeId,
            categoryId: dairyCategory.id,
            category: dairyCategory.name,
            name: "Full Cream Fresh Milk",
            description: "Pasteurized homogenized full-cream cow milk.",
            price: 3200, // ₹32.00
            unitSize: "500 ml",
            imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&auto=format&fit=crop&q=60",
            isFeatured: true,
            isVeg: true,
            inStock: true
          });
          productsData.push({
            storeId,
            categoryId: dairyCategory.id,
            category: dairyCategory.name,
            name: "Salted Butter",
            description: "Rich, creamy salted butter block.",
            price: 10500, // ₹105.00
            unitSize: "100 g",
            imageUrl: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&auto=format&fit=crop&q=60",
            isFeatured: false,
            isVeg: true,
            inStock: true
          });
        }

        // Bakery
        const bakeryCategory = findCategory("Bakery & Bread");
        if (bakeryCategory) {
          productsData.push({
            storeId,
            categoryId: bakeryCategory.id,
            category: bakeryCategory.name,
            name: "Sliced Brown Bread",
            description: "Freshly baked healthy whole wheat brown bread.",
            price: 4500, // ₹45.00
            unitSize: "400 g",
            imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=60",
            isFeatured: false,
            isVeg: true,
            inStock: true
          });
        }

        // Cold Drinks
        const drinksCategory = findCategory("Cold Drinks & Juices");
        if (drinksCategory) {
          productsData.push({
            storeId,
            categoryId: drinksCategory.id,
            category: drinksCategory.name,
            name: "Coca-Cola Classic",
            description: "Carbonated refreshing soft drink.",
            price: 4000, // ₹40.00
            unitSize: "750 ml",
            imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=60",
            isFeatured: true,
            isVeg: true,
            inStock: true
          });
        }

        // Munchies
        const snacksCategory = findCategory("Munchies & Snacks");
        if (snacksCategory) {
          productsData.push({
            storeId,
            categoryId: snacksCategory.id,
            category: snacksCategory.name,
            name: "Classic Salted Potato Chips",
            description: "Crispy and salted potato chips, perfect for snacking.",
            price: 2000, // ₹20.00
            unitSize: "50 g",
            imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d20?w=400&auto=format&fit=crop&q=60",
            isFeatured: false,
            isVeg: true,
            inStock: true
          });
        }
      }

      await db.insert(products).values(productsData);
      console.log(`Seeded ${productsData.length} products successfully.`);
    } else {
      console.log("Products already seeded in database.");
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

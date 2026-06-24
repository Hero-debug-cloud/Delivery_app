import { db, client } from "./index.ts";
import { users, deliveryPartners, driverSessions, locationPings, stores } from "./schema.ts";
import { eq } from "drizzle-orm";

async function main() {
  const driverId = "58ba46cc-3cf9-4009-acf0-57c84faa1c56";
  console.log(`=== Seeding Replay Data for Driver: ${driverId} ===`);

  try {
    // 1. Resolve or Create the Driver
    let [driver] = await db
      .select()
      .from(deliveryPartners)
      .where(eq(deliveryPartners.id, driverId))
      .limit(1);

    if (!driver) {
      console.log(`Driver ID ${driverId} not found in database. Creating user and driver profile...`);
      // Create user
      const [newUser] = await db.insert(users).values({
        name: "Route Replay Driver",
        phone: "+91 98888 77777",
        role: "delivery_partner",
        isActive: true,
      }).returning();

      // Get first store
      const [store] = await db.select().from(stores).limit(1);

      // Create driver with specified ID
      const [newDriver] = await db.insert(deliveryPartners).values({
        id: driverId,
        userId: newUser.id,
        storeId: store ? store.id : null,
        vehicleType: "motorcycle",
        vehicleNumber: "KA 51 HL 9876",
        status: "offline",
        onboardingStatus: "approved",
      }).returning();
      driver = newDriver;
      console.log(`Created new driver profile with ID: ${driver.id}`);
    } else {
      console.log(`Found existing driver profile for ID: ${driver.id}`);
    }

    // 2. Clean up old sessions and coordinate pings for this driver
    console.log("Cleaning up old session logs and location pings...");
    await db.delete(driverSessions).where(eq(driverSessions.deliveryPartnerId, driverId));
    await db.delete(locationPings).where(eq(locationPings.deliveryPartnerId, driverId));

    // 3. Create a shift session for Today
    const now = new Date();
    const startTime = new Date(now.getTime() - 5 * 60 * 60 * 1000); // 5 hours ago
    const endTime = new Date(now.getTime() - 2 * 60 * 60 * 1000);   // 2 hours ago

    console.log(`Seeding shift session: ${startTime.toLocaleTimeString()} to ${endTime.toLocaleTimeString()}`);
    await db.insert(driverSessions).values({
      deliveryPartnerId: driverId,
      storeId: driver.storeId,
      startedAt: startTime,
      endedAt: endTime,
    });

    // 4. Generate ~150 location pings along a path (spaced 24 seconds apart, totaling 1 hour of travel)
    const pingsData = [];
    
    // Path starting from Bellandur (Outer Ring Road) towards Indiranagar (100 Feet Road)
    const startLat = 12.9304;
    const startLng = 77.6784;
    const endLat = 12.9784;
    const endLng = 77.6408;

    const totalPings = 150;
    const intervalSeconds = 24;

    console.log(`Generating ${totalPings} simulated coordinate coordinates along route...`);
    for (let i = 0; i < totalPings; i++) {
      const t = i / (totalPings - 1);
      
      // Interpolate coordinates with curves to simulate actual street turns
      const lat = startLat + (endLat - startLat) * t + 0.0015 * Math.sin(t * Math.PI * 6);
      const lng = startLng + (endLng - startLng) * t + 0.003 * Math.sin(t * Math.PI * 4);
      
      const recordedAt = new Date(startTime.getTime() + i * intervalSeconds * 1000);
      
      // Speed swings between 18 km/h and 52 km/h
      const speed = 25 + 20 * Math.sin(t * Math.PI * 10) + Math.random() * 7;
      // Battery slowly drops from 96% down to 88%
      const battery = Math.max(0, Math.floor(96 - t * 8));

      pingsData.push({
        deliveryPartnerId: driverId,
        latitude: lat,
        longitude: lng,
        speed: parseFloat(speed.toFixed(1)),
        battery,
        recordedAt,
      });
    }

    await db.insert(locationPings).values(pingsData);
    console.log(`Successfully seeded ${pingsData.length} coordinate points in location_pings!`);
    console.log("=== Seeding Completed Successfully ===");
  } catch (err) {
    console.error("Seeding failed with error:", err);
  } finally {
    await client.end();
  }
}

main();

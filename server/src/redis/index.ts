import Redis from "ioredis";

const redisHost = process.env.REDIS_HOST || "127.0.0.1";
const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);
const redisPassword = process.env.REDIS_PASSWORD || undefined;

export const redis = new Redis({
  host: redisHost,
  port: redisPort,
  password: redisPassword,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on("connect", () => {
  console.log("Redis connected successfully");
});

redis.on("error", (error) => {
  console.error("Redis connection error:", error);
});

// Helper namespacing functions for logistics geo operations
export const redisKeys = {
  // Store ephemeral driver locations (GEO keys)
  driverLocations: "drivers:locations",
  
  // Ephemeral driver detail hash (status, metadata, active order)
  driverDetails: (driverId: string) => `driver:${driverId}:details`,
  
  // Customer live tracking session (TTL-based access control tokens)
  trackingSession: (token: string) => `tracking:session:${token}`,
};

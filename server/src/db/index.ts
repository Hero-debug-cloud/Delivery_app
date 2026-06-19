import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.ts";

const databaseUrl = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/logiroute";

// Use connection pooling
export const client = postgres(databaseUrl);
export const db = drizzle(client, { schema });

import { Hono } from "hono";
import * as uploadController from "./controller.ts";
import { requireAuth } from "../auth/middleware.ts";

export const uploadRouter = new Hono();

// Apply auth middleware to protect S3 storage uploading operations
uploadRouter.post("/", requireAuth(["super_admin", "store_manager", "dispatcher", "delivery_partner"]), uploadController.uploadFile);

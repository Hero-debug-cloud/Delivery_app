import { Hono } from "hono";
import { requireAuth } from "../auth/middleware.ts";
import * as controller from "./controller.ts";

export const usersRouter = new Hono();

// Read operations: Super admins and Store managers can view the user accounts
usersRouter.get("/", requireAuth(["super_admin", "store_manager"]), controller.getUsers);
usersRouter.get("/:id", requireAuth(["super_admin", "store_manager"]), controller.getUserById);

// Write operations: Restrict user creations/updates/deletions strictly to Super Admin
usersRouter.post("/", requireAuth(["super_admin"]), controller.createUser);
usersRouter.patch("/:id", requireAuth(["super_admin"]), controller.updateUser);
usersRouter.delete("/:id", requireAuth(["super_admin"]), controller.deleteUser);

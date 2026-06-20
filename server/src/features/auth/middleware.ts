import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { getMe } from "./service.ts";
import type { AuthUser } from "./types.ts";

declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

export const requireAuth = (allowedRoles?: string[]): MiddlewareHandler => {
  return async (c, next) => {
    const sessionId = getCookie(c, "logiroute_session");
    if (!sessionId) {
      return c.json({ error: "UNAUTHORIZED", message: "Not authenticated" }, 401);
    }

    try {
      const user = await getMe(sessionId);
      if (!user) {
        return c.json({ error: "UNAUTHORIZED", message: "Session invalid or expired" }, 401);
      }

      if (!user.isActive) {
        return c.json({ error: "FORBIDDEN", message: "This account has been deactivated" }, 403);
      }

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        return c.json({ error: "FORBIDDEN", message: "Forbidden: insufficient permissions" }, 403);
      }

      c.set("user", user);
      return await next();
    } catch (err) {
      console.error("[requireAuth] middleware error:", err);
      return c.json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to authenticate session" }, 500);
    }
  };
};

import { Hono } from "hono";
import * as authController from "./controller.ts";
import { requireAuth } from "./middleware.ts";

export const authRouter = new Hono();

// Admin credential-based auth
authRouter.post("/admin/login", authController.adminLogin);
authRouter.post("/admin/signup", authController.adminSignup);

// OTP-based auth (delivery partners / customers)
authRouter.post("/otp/request", authController.otpRequest);
authRouter.post("/otp/verify", authController.otpVerify);

// Session management
authRouter.get("/me", authController.getMe);
authRouter.post("/logout", authController.logout);
authRouter.patch("/me", requireAuth(), authController.updateProfile);
